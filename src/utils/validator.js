const Joi = require('joi');

// Employee validation schemas
const employeeSchema = Joi.object({
    fullName: Joi.string().trim().min(2).max(100).required(),
    gender: Joi.string().valid('MALE', 'FEMALE').required(),
    employmentType: Joi.string().valid('FULL_TIME', 'PART_TIME').required(),
    position: Joi.string().trim().min(2).max(50).required(),
    employmentDate: Joi.date().max('now').required(),
    basicSalary: Joi.number().positive().required(),
    bankAccountNumber: Joi.string().trim().min(5).max(50).required(),
    allowances: Joi.array().items(Joi.object({
        type: Joi.string().valid('POSITION', 'TRANSPORT', 'HOUSING', 'MEAL', 'OTHER').required(),
        amount: Joi.number().min(0).required(),
        isTaxable: Joi.boolean().default(true),
        isActive: Joi.boolean().default(true)
    })).default([]),
    deductions: Joi.array().items(Joi.object({
        type: Joi.string().valid('LOAN', 'ADVANCE', 'OTHER').required(),
        amount: Joi.number().min(0).required(),
        remainingBalance: Joi.number().min(0),
        isActive: Joi.boolean().default(true)
    })).default([])
});

const updateEmployeeSchema = employeeSchema.fork(
    ['fullName', 'gender', 'employmentType', 'position', 'employmentDate', 'basicSalary', 'bankAccountNumber'],
    (schema) => schema.optional()
);

// User validation schemas
const userSchema = Joi.object({
    fullName: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('HR', 'FINANCE').required()
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

// Payroll validation schemas
const payrollSchema = Joi.object({
    employee: Joi.string().hex().length(24).required(),
    payPeriod: Joi.object({
        month: Joi.number().integer().min(1).max(12).required(),
        year: Joi.number().integer().min(2020).max(2030).required()
    }).required(),
    workingDays: Joi.number().integer().min(0).max(31).required(),
    overtimeHours: Joi.number().min(0).default(0),
    additionalAllowances: Joi.array().items(Joi.object({
        type: Joi.string().valid('POSITION', 'TRANSPORT', 'HOUSING', 'MEAL', 'OTHER').required(),
        amount: Joi.number().min(0).required(),
        isTaxable: Joi.boolean().default(true)
    })).default([]),
    additionalDeductions: Joi.array().items(Joi.object({
        type: Joi.string().valid('LOAN', 'ADVANCE', 'OTHER').required(),
        amount: Joi.number().min(0).required()
    })).default([])
});

// Bank account validation schemas
const bankAccountSchema = Joi.object({
    accountNumber: Joi.string().trim().min(5).max(50).required(),
    accountHolder: Joi.string().trim().min(2).max(100).required(),
    accountType: Joi.string().valid('EMPLOYEE', 'COMPANY', 'GOVERNMENT', 'PENSION').required(),
    balance: Joi.number().min(0).default(0),
    employee: Joi.string().hex().length(24).when('accountType', {
        is: 'EMPLOYEE',
        then: Joi.required(),
        otherwise: Joi.optional()
    })
});

// Transaction validation schemas
const transactionSchema = Joi.object({
    fromAccount: Joi.string().hex().length(24).required(),
    toAccount: Joi.string().hex().length(24).required(),
    amount: Joi.number().positive().required(),
    transactionType: Joi.string().valid('SALARY', 'TAX', 'PENSION', 'ALLOWANCE', 'DEDUCTION').required(),
    payroll: Joi.string().hex().length(24).optional(),
    description: Joi.string().max(255).optional()
});

// Validation middleware
const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors
            });
        }

        req.body = value;
        next();
    };
};

module.exports = {
    validate,
    schemas: {
        employee: employeeSchema,
        updateEmployee: updateEmployeeSchema,
        user: userSchema,
        login: loginSchema,
        payroll: payrollSchema,
        bankAccount: bankAccountSchema,
        transaction: transactionSchema
    }
};