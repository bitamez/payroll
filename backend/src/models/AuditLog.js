const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'APPROVE', 'PROCESS_PAYMENT', 'ROLLBACK']
    },
    resourceType: {
        type: String,
        required: true,
        enum: ['EMPLOYEE', 'PAYROLL', 'TRANSACTION', 'USER', 'BANK_ACCOUNT']
    },
    resourceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userRole: {
        type: String,
        enum: ['HR', 'FINANCE'],
        required: true
    },
    changes: {
        before: {
            type: mongoose.Schema.Types.Mixed
        },
        after: {
            type: mongoose.Schema.Types.Mixed
        }
    },
    metadata: {
        ipAddress: String,
        userAgent: String,
        sessionId: String,
        correlationId: String
    },
    description: {
        type: String,
        required: true
    },
    severity: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: 'MEDIUM'
    },
    status: {
        type: String,
        enum: ['SUCCESS', 'FAILED', 'PARTIAL'],
        default: 'SUCCESS'
    },
    errorMessage: {
        type: String
    }
}, {
    timestamps: true
});

// Indexes for efficient querying
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ severity: 1, createdAt: -1 });

// Static method to create audit log
auditLogSchema.statics.createLog = async function (logData) {
    try {
        return await this.create(logData);
    } catch (error) {
        console.error('Failed to create audit log:', error);
        // Don't throw error to prevent disrupting main operations
        return null;
    }
};

// Static method to get audit trail for a resource
auditLogSchema.statics.getResourceAuditTrail = async function (resourceType, resourceId, options = {}) {
    const { limit = 50, page = 1 } = options;
    const skip = (page - 1) * limit;

    return await this.find({ resourceType, resourceId })
        .populate('userId', 'fullName email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
};

// Static method to get user activity
auditLogSchema.statics.getUserActivity = async function (userId, options = {}) {
    const { limit = 50, page = 1, fromDate, toDate } = options;
    const skip = (page - 1) * limit;

    let query = { userId };

    if (fromDate || toDate) {
        query.createdAt = {};
        if (fromDate) query.createdAt.$gte = new Date(fromDate);
        if (toDate) query.createdAt.$lte = new Date(toDate);
    }

    return await this.find(query)
        .populate('userId', 'fullName email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
};

module.exports = mongoose.model('AuditLog', auditLogSchema);