const AuditLog = require('../models/AuditLog');

/**
 * Audit middleware to log user actions
 */
const auditMiddleware = (action, resourceType, options = {}) => {
    return async (req, res, next) => {
        // Store original res.json to intercept response
        const originalJson = res.json;

        res.json = function (data) {
            // Call original res.json
            originalJson.call(this, data);

            // Create audit log asynchronously (don't block response)
            setImmediate(async () => {
                try {
                    if (req.user && data.success) {
                        const auditData = {
                            action,
                            resourceType,
                            resourceId: options.getResourceId ? options.getResourceId(req, data) : req.params.id,
                            userId: req.user._id,
                            userRole: req.user.role,
                            description: options.getDescription ? options.getDescription(req, data) : `${action} ${resourceType}`,
                            metadata: {
                                ipAddress: req.ip,
                                userAgent: req.get('User-Agent'),
                                method: req.method,
                                url: req.originalUrl
                            },
                            severity: options.severity || 'MEDIUM',
                            status: data.success ? 'SUCCESS' : 'FAILED'
                        };

                        // Add changes if provided
                        if (options.getChanges) {
                            auditData.changes = options.getChanges(req, data);
                        }

                        // Add error message if failed
                        if (!data.success && data.message) {
                            auditData.errorMessage = data.message;
                        }

                        await AuditLog.createLog(auditData);
                    }
                } catch (error) {
                    console.error('Audit logging failed:', error);
                    // Don't throw error to prevent disrupting main operations
                }
            });
        };

        next();
    };
};

/**
 * Specific audit middleware for employee operations
 */
const auditEmployee = (action) => {
    return auditMiddleware(action, 'EMPLOYEE', {
        getResourceId: (req, data) => {
            if (action === 'CREATE' && data.data && data.data.employee) {
                return data.data.employee._id;
            }
            return req.params.id;
        },
        getDescription: (req, data) => {
            const employeeName = data.data?.employee?.fullName || 'Unknown';
            return `${action} employee: ${employeeName}`;
        },
        getChanges: (req, data) => {
            if (action === 'UPDATE') {
                return {
                    before: req.originalEmployee, // Should be set in controller
                    after: data.data?.employee
                };
            }
            return null;
        },
        severity: action === 'DELETE' ? 'HIGH' : 'MEDIUM'
    });
};

/**
 * Specific audit middleware for payroll operations
 */
const auditPayroll = (action) => {
    return auditMiddleware(action, 'PAYROLL', {
        getResourceId: (req, data) => {
            if (action === 'CREATE' && data.data && data.data.payroll) {
                return data.data.payroll._id;
            }
            return req.params.id;
        },
        getDescription: (req, data) => {
            const payrollInfo = data.data?.payroll;
            if (payrollInfo && payrollInfo.employee) {
                return `${action} payroll for ${payrollInfo.employee.fullName} - ${payrollInfo.payPeriod.month}/${payrollInfo.payPeriod.year}`;
            }
            return `${action} payroll`;
        },
        getChanges: (req, data) => {
            if (action === 'UPDATE' || action === 'APPROVE') {
                return {
                    before: req.originalPayroll, // Should be set in controller
                    after: data.data?.payroll
                };
            }
            return null;
        },
        severity: action === 'PROCESS_PAYMENT' ? 'HIGH' : 'MEDIUM'
    });
};

/**
 * Specific audit middleware for transaction operations
 */
const auditTransaction = (action) => {
    return auditMiddleware(action, 'TRANSACTION', {
        getResourceId: (req, data) => {
            if (action === 'CREATE' && data.data && data.data.transaction) {
                return data.data.transaction._id;
            }
            return req.params.id;
        },
        getDescription: (req, data) => {
            const transaction = data.data?.transaction;
            if (transaction) {
                return `${action} ${transaction.transactionType} transaction: ${transaction.amount} ETB`;
            }
            return `${action} transaction`;
        },
        severity: 'HIGH' // All transaction operations are high severity
    });
};

/**
 * Specific audit middleware for authentication operations
 */
const auditAuth = (action) => {
    return auditMiddleware(action, 'USER', {
        getResourceId: (req, data) => {
            if (action === 'LOGIN' && data.data && data.data.user) {
                return data.data.user.id;
            }
            return req.user?._id;
        },
        getDescription: (req, data) => {
            const user = data.data?.user || req.user;
            if (user) {
                return `${action}: ${user.fullName} (${user.email})`;
            }
            return action;
        },
        severity: action === 'LOGIN' ? 'LOW' : 'MEDIUM'
    });
};

/**
 * Manual audit logging function
 */
const createAuditLog = async (auditData, req) => {
    try {
        const logData = {
            ...auditData,
            metadata: {
                ipAddress: req?.ip,
                userAgent: req?.get('User-Agent'),
                method: req?.method,
                url: req?.originalUrl,
                ...auditData.metadata
            }
        };

        return await AuditLog.createLog(logData);
    } catch (error) {
        console.error('Manual audit logging failed:', error);
        return null;
    }
};

/**
 * Audit middleware for bulk operations
 */
const auditBulkOperation = (action, resourceType) => {
    return async (req, res, next) => {
        const originalJson = res.json;

        res.json = function (data) {
            originalJson.call(this, data);

            setImmediate(async () => {
                try {
                    if (req.user && data.success && data.data) {
                        const { success = [], errors = [] } = data.data;

                        // Log successful operations
                        for (const item of success) {
                            await AuditLog.createLog({
                                action,
                                resourceType,
                                resourceId: item._id,
                                userId: req.user._id,
                                userRole: req.user.role,
                                description: `Bulk ${action} ${resourceType}: ${item.fullName || item.transactionId || item._id}`,
                                metadata: {
                                    ipAddress: req.ip,
                                    userAgent: req.get('User-Agent'),
                                    bulkOperation: true,
                                    totalItems: success.length + errors.length
                                },
                                severity: 'MEDIUM',
                                status: 'SUCCESS'
                            });
                        }

                        // Log failed operations
                        for (const error of errors) {
                            await AuditLog.createLog({
                                action,
                                resourceType,
                                resourceId: error.resourceId || null,
                                userId: req.user._id,
                                userRole: req.user.role,
                                description: `Bulk ${action} ${resourceType} failed: ${error.error}`,
                                metadata: {
                                    ipAddress: req.ip,
                                    userAgent: req.get('User-Agent'),
                                    bulkOperation: true,
                                    totalItems: success.length + errors.length
                                },
                                severity: 'HIGH',
                                status: 'FAILED',
                                errorMessage: error.error
                            });
                        }
                    }
                } catch (error) {
                    console.error('Bulk audit logging failed:', error);
                }
            });
        };

        next();
    };
};

module.exports = {
    auditMiddleware,
    auditEmployee,
    auditPayroll,
    auditTransaction,
    auditAuth,
    auditBulkOperation,
    createAuditLog
};