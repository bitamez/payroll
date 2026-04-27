const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const { calculatePayroll } = require('../utils/calculateSalary');
const transactionService = require('../services/transaction.service');

/**
 * Create payroll for an employee
 */
const createPayroll = async (req, res, next) => {
    try {
        const {
            employee: employeeId,
            payPeriod,
            workingDays,
            overtimeHours,
            additionalAllowances,
            additionalDeductions
        } = req.body;

        // Check if payroll already exists for this period
        const existingPayroll = await Payroll.findOne({
            employee: employeeId,
            'payPeriod.month': payPeriod.month,
            'payPeriod.year': payPeriod.year
        });

        if (existingPayroll) {
            return res.status(400).json({
                success: false,
                message: 'Payroll already exists for this employee and period'
            });
        }

        // Get employee data
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        if (employee.status !== 'ACTIVE') {
            return res.status(400).json({
                success: false,
                message: 'Cannot create payroll for inactive employee'
            });
        }

        // Calculate payroll
        const calculation = calculatePayroll(
            employee,
            workingDays,
            overtimeHours,
            additionalAllowances,
            additionalDeductions
        );

        // Create payroll record
        const payroll = await Payroll.create({
            employee: employeeId,
            payPeriod,
            workingDays,
            overtimeHours: overtimeHours || 0,
            basicSalary: calculation.basicSalary,
            earnedSalary: calculation.earnedSalary,
            overtimePay: calculation.overtimePay,
            allowances: calculation.allowances,
            totalAllowances: calculation.totalAllowances,
            taxableAllowances: calculation.taxableAllowances,
            grossPay: calculation.grossPay,
            taxableIncome: calculation.taxableIncome,
            incomeTax: calculation.incomeTax,
            pensionEmployee: calculation.pensionEmployee,
            pensionEmployer: calculation.pensionEmployer,
            otherDeductions: calculation.otherDeductions,
            totalDeductions: calculation.totalDeductions,
            netPay: calculation.netPay,
            preparedBy: req.user._id,
            calculations: calculation.calculations
        });

        await payroll.populate('employee', 'fullName employeeId position');
        await payroll.populate('preparedBy', 'fullName role');

        res.status(201).json({
            success: true,
            message: 'Payroll created successfully',
            data: { payroll }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all payrolls with pagination and filters
 */
const getPayrolls = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const { status, month, year, employee } = req.query;

        // Build query
        let query = {};

        if (status) query.status = status;
        if (month) query['payPeriod.month'] = parseInt(month);
        if (year) query['payPeriod.year'] = parseInt(year);
        if (employee) query.employee = employee;

        const payrolls = await Payroll.find(query)
            .populate('employee', 'fullName employeeId position')
            .populate('preparedBy', 'fullName role')
            .populate('approvedBy', 'fullName role')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Payroll.countDocuments(query);

        res.json({
            success: true,
            data: {
                payrolls,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get payroll by ID
 */
const getPayrollById = async (req, res, next) => {
    try {
        const payroll = await Payroll.findById(req.params.id)
            .populate('employee', 'fullName employeeId position bankAccountNumber')
            .populate('preparedBy', 'fullName role')
            .populate('approvedBy', 'fullName role');

        if (!payroll) {
            return res.status(404).json({
                success: false,
                message: 'Payroll not found'
            });
        }

        res.json({
            success: true,
            data: { payroll }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update payroll (only if status is PENDING and user is HR)
 */
const updatePayroll = async (req, res, next) => {
    try {
        const payroll = await Payroll.findById(req.params.id);

        if (!payroll) {
            return res.status(404).json({
                success: false,
                message: 'Payroll not found'
            });
        }

        if (payroll.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: 'Can only update payroll with PENDING status'
            });
        }

        if (req.user.role !== 'HR') {
            return res.status(403).json({
                success: false,
                message: 'Only HR can update payroll'
            });
        }

        const { workingDays, overtimeHours, additionalAllowances, additionalDeductions } = req.body;

        // Get employee data for recalculation
        const employee = await Employee.findById(payroll.employee);

        // Recalculate payroll
        const calculation = calculatePayroll(
            employee,
            workingDays || payroll.workingDays,
            overtimeHours !== undefined ? overtimeHours : payroll.overtimeHours,
            additionalAllowances || [],
            additionalDeductions || []
        );

        // Update payroll
        Object.assign(payroll, {
            workingDays: workingDays || payroll.workingDays,
            overtimeHours: overtimeHours !== undefined ? overtimeHours : payroll.overtimeHours,
            earnedSalary: calculation.earnedSalary,
            overtimePay: calculation.overtimePay,
            allowances: [...payroll.allowances, ...calculation.allowances],
            totalAllowances: calculation.totalAllowances,
            taxableAllowances: calculation.taxableAllowances,
            grossPay: calculation.grossPay,
            taxableIncome: calculation.taxableIncome,
            incomeTax: calculation.incomeTax,
            pensionEmployee: calculation.pensionEmployee,
            pensionEmployer: calculation.pensionEmployer,
            otherDeductions: [...payroll.otherDeductions, ...calculation.otherDeductions],
            totalDeductions: calculation.totalDeductions,
            netPay: calculation.netPay,
            calculations: calculation.calculations
        });

        await payroll.save();
        await payroll.populate('employee', 'fullName employeeId position');

        res.json({
            success: true,
            message: 'Payroll updated successfully',
            data: { payroll }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Approve payroll (Finance role only)
 */
const approvePayroll = async (req, res, next) => {
    try {
        const payroll = await Payroll.findById(req.params.id);

        if (!payroll) {
            return res.status(404).json({
                success: false,
                message: 'Payroll not found'
            });
        }

        if (payroll.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: 'Can only approve payroll with PENDING status'
            });
        }

        payroll.status = 'APPROVED';
        payroll.approvedBy = req.user._id;
        payroll.approvedAt = new Date();

        await payroll.save();
        await payroll.populate('employee', 'fullName employeeId');
        await payroll.populate('approvedBy', 'fullName role');

        res.json({
            success: true,
            message: 'Payroll approved successfully',
            data: { payroll }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Process payroll payment (Finance role only)
 */
const processPayment = async (req, res, next) => {
    try {
        const payroll = await Payroll.findById(req.params.id)
            .populate('employee', 'fullName bankAccountNumber');

        if (!payroll) {
            return res.status(404).json({
                success: false,
                message: 'Payroll not found'
            });
        }

        if (payroll.status !== 'APPROVED') {
            return res.status(400).json({
                success: false,
                message: 'Can only process payment for approved payroll'
            });
        }

        try {
            // Process payment through transaction service
            const result = await transactionService.processPayrollPayment(payroll);

            if (result.success) {
                payroll.status = 'PAID';
                payroll.paidAt = new Date();
                await payroll.save();

                res.json({
                    success: true,
                    message: 'Payment processed successfully',
                    data: {
                        payroll,
                        transactions: result.transactions
                    }
                });
            } else {
                payroll.status = 'FAILED';
                await payroll.save();

                res.status(400).json({
                    success: false,
                    message: 'Payment processing failed',
                    error: result.error
                });
            }
        } catch (error) {
            payroll.status = 'FAILED';
            await payroll.save();
            throw error;
        }
    } catch (error) {
        next(error);
    }
};

/**
 * Delete payroll (only if status is PENDING)
 */
const deletePayroll = async (req, res, next) => {
    try {
        const payroll = await Payroll.findById(req.params.id);

        if (!payroll) {
            return res.status(404).json({
                success: false,
                message: 'Payroll not found'
            });
        }

        if (payroll.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: 'Can only delete payroll with PENDING status'
            });
        }

        await Payroll.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Payroll deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createPayroll,
    getPayrolls,
    getPayrollById,
    updatePayroll,
    approvePayroll,
    processPayment,
    deletePayroll
};