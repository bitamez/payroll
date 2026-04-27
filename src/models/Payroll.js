const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    payPeriod: {
        month: {
            type: Number,
            required: true,
            min: 1,
            max: 12
        },
        year: {
            type: Number,
            required: true
        }
    },
    workingDays: {
        type: Number,
        required: true,
        min: 0,
        max: 31
    },
    overtimeHours: {
        type: Number,
        default: 0,
        min: 0
    },
    // Salary calculations
    basicSalary: {
        type: Number,
        required: true,
        min: 0
    },
    earnedSalary: {
        type: Number,
        required: true,
        min: 0
    },
    overtimePay: {
        type: Number,
        default: 0,
        min: 0
    },
    // Allowances
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
        }
    }],
    totalAllowances: {
        type: Number,
        default: 0,
        min: 0
    },
    taxableAllowances: {
        type: Number,
        default: 0,
        min: 0
    },
    // Gross and taxable income
    grossPay: {
        type: Number,
        required: true,
        min: 0
    },
    taxableIncome: {
        type: Number,
        required: true,
        min: 0
    },
    // Deductions
    incomeTax: {
        type: Number,
        required: true,
        min: 0
    },
    pensionEmployee: {
        type: Number,
        required: true,
        min: 0
    },
    pensionEmployer: {
        type: Number,
        required: true,
        min: 0
    },
    otherDeductions: [{
        type: {
            type: String,
            enum: ['LOAN', 'ADVANCE', 'OTHER']
        },
        amount: {
            type: Number,
            min: 0
        }
    }],
    totalDeductions: {
        type: Number,
        required: true,
        min: 0
    },
    // Final calculation
    netPay: {
        type: Number,
        required: true,
        min: 0
    },
    // Workflow
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'PAID', 'FAILED'],
        default: 'PENDING'
    },
    preparedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvedAt: {
        type: Date
    },
    paidAt: {
        type: Date
    },
    // Audit trail
    calculations: {
        type: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Compound index for unique payroll per employee per period
payrollSchema.index({ employee: 1, 'payPeriod.month': 1, 'payPeriod.year': 1 }, { unique: true });

module.exports = mongoose.model('Payroll', payrollSchema);