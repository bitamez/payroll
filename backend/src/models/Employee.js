const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        unique: true
    },
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    gender: {
        type: String,
        enum: ['MALE', 'FEMALE'],
        required: true
    },
    employmentType: {
        type: String,
        enum: ['FULL_TIME', 'PART_TIME'],
        required: true
    },
    position: {
        type: String,
        required: true
    },
    employmentDate: {
        type: Date,
        required: true
    },
    basicSalary: {
        type: Number,
        required: true,
        min: 0
    },
    bankAccountNumber: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'TERMINATED'],
        default: 'ACTIVE'
    },
    terminationDate: {
        type: Date
    },
    allowances: [{
        type: {
            type: String,
            enum: ['POSITION', 'TRANSPORT', 'HOUSING', 'MEAL', 'OTHER']
        },
        amount: {
            type: Number,
            min: 0
        },
        isTaxable: {
            type: Boolean,
            default: true
        },
        isActive: {
            type: Boolean,
            default: true
        }
    }],
    deductions: [{
        type: {
            type: String,
            enum: ['LOAN', 'ADVANCE', 'OTHER']
        },
        amount: {
            type: Number,
            min: 0
        },
        remainingBalance: {
            type: Number,
            min: 0
        },
        isActive: {
            type: Boolean,
            default: true
        }
    }]
}, {
    timestamps: true
});

// Generate employee ID before saving
employeeSchema.pre('save', async function (next) {
    if (!this.employeeId) {
        const count = await mongoose.model('Employee').countDocuments();
        this.employeeId = `EMP${String(count + 1).padStart(4, '0')}`;
    }
    next();
});

module.exports = mongoose.model('Employee', employeeSchema);