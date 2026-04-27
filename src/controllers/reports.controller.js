const payrollService = require('../services/payroll.service');
const taxService = require('../services/tax.service');
const pensionService = require('../services/pension.service');
const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const Transaction = require('../models/Transaction');

/**
 * Generate payroll report
 */
const generatePayrollReport = async (req, res, next) => {
    try {
        const filters = req.body;

        const report = await payrollService.generatePayrollReport(filters);

        res.json({
            success: true,
            message: 'Payroll report generated successfully',
            data: { report }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Generate tax report
 */
const generateTaxReport = async (req, res, next) => {
    try {
        const { payPeriod, employeeIds } = req.body;

        let query = {};
        if (payPeriod) {
            if (payPeriod.month) query['payPeriod.month'] = payPeriod.month;
            if (payPeriod.year) query['payPeriod.year'] = payPeriod.year;
        }
        if (employeeIds && employeeIds.length > 0) {
            query.employee = { $in: employeeIds };
        }

        const payrolls = await Payroll.find(query)
            .populate('employee', 'fullName employeeId position')
            .sort({ 'employee.fullName': 1 });

        const taxReport = taxService.generateTaxReport(payrolls);

        res.json({
            success: true,
            message: 'Tax report generated successfully',
            data: {
                report: taxReport,
                period: payPeriod,
                generatedAt: new Date()
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Generate pension report
 */
const generatePensionReport = async (req, res, next) => {
    try {
        const filters = req.body;

        const report = await pensionService.generatePensionReport(filters);

        res.json({
            success: true,
            message: 'Pension report generated successfully',
            data: { report }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Generate employee report
 */
const generateEmployeeReport = async (req, res, next) => {
    try {
        const {
            includeInactive = false,
            includeTerminated = false,
            position,
            employmentType,
            minSalary,
            maxSalary
        } = req.body;

        let query = {};

        // Status filter
        const statusFilter = ['ACTIVE'];
        if (includeInactive) statusFilter.push('INACTIVE');
        if (includeTerminated) statusFilter.push('TERMINATED');
        query.status = { $in: statusFilter };

        // Other filters
        if (position) query.position = { $regex: position, $options: 'i' };
        if (employmentType) query.employmentType = employmentType;
        if (minSalary || maxSalary) {
            query.basicSalary = {};
            if (minSalary) query.basicSalary.$gte = minSalary;
            if (maxSalary) query.basicSalary.$lte = maxSalary;
        }

        const employees = await Employee.find(query).sort({ fullName: 1 });

        // Calculate statistics
        const statistics = {
            totalEmployees: employees.length,
            byStatus: {},
            byEmploymentType: {},
            byPosition: {},
            salaryStatistics: {
                total: 0,
                average: 0,
                min: 0,
                max: 0
            }
        };

        // Group by status
        employees.forEach(emp => {
            statistics.byStatus[emp.status] = (statistics.byStatus[emp.status] || 0) + 1;
            statistics.byEmploymentType[emp.employmentType] = (statistics.byEmploymentType[emp.employmentType] || 0) + 1;
            statistics.byPosition[emp.position] = (statistics.byPosition[emp.position] || 0) + 1;
            statistics.salaryStatistics.total += emp.basicSalary;
        });

        if (employees.length > 0) {
            const salaries = employees.map(emp => emp.basicSalary);
            statistics.salaryStatistics.average = statistics.salaryStatistics.total / employees.length;
            statistics.salaryStatistics.min = Math.min(...salaries);
            statistics.salaryStatistics.max = Math.max(...salaries);
        }

        res.json({
            success: true,
            message: 'Employee report generated successfully',
            data: {
                employees,
                statistics,
                filters: req.body,
                generatedAt: new Date()
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Generate transaction report
 */
const generateTransactionReport = async (req, res, next) => {
    try {
        const {
            fromDate,
            toDate,
            transactionType,
            status = 'SUCCESS',
            accountType
        } = req.body;

        let query = { status };

        if (transactionType) query.transactionType = transactionType;

        if (fromDate || toDate) {
            query.createdAt = {};
            if (fromDate) query.createdAt.$gte = new Date(fromDate);
            if (toDate) query.createdAt.$lte = new Date(toDate);
        }

        let transactions = await Transaction.find(query)
            .populate('fromAccount', 'accountNumber accountHolder accountType')
            .populate('toAccount', 'accountNumber accountHolder accountType')
            .populate('payroll', 'employee payPeriod')
            .sort({ createdAt: -1 });

        // Filter by account type if specified
        if (accountType) {
            transactions = transactions.filter(txn =>
                txn.fromAccount.accountType === accountType ||
                txn.toAccount.accountType === accountType
            );
        }

        // Calculate statistics
        const statistics = {
            totalTransactions: transactions.length,
            totalAmount: 0,
            byType: {},
            byAccountType: {},
            dailyVolume: {}
        };

        transactions.forEach(txn => {
            statistics.totalAmount += txn.amount;
            statistics.byType[txn.transactionType] = (statistics.byType[txn.transactionType] || 0) + 1;

            const date = txn.createdAt.toISOString().split('T')[0];
            if (!statistics.dailyVolume[date]) {
                statistics.dailyVolume[date] = { count: 0, amount: 0 };
            }
            statistics.dailyVolume[date].count++;
            statistics.dailyVolume[date].amount += txn.amount;
        });

        res.json({
            success: true,
            message: 'Transaction report generated successfully',
            data: {
                transactions,
                statistics,
                filters: req.body,
                generatedAt: new Date()
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Generate individual payslip
 */
const generatePayslip = async (req, res, next) => {
    try {
        const { payrollId } = req.params;

        const payroll = await Payroll.findById(payrollId)
            .populate('employee', 'fullName employeeId position bankAccountNumber')
            .populate('preparedBy', 'fullName role')
            .populate('approvedBy', 'fullName role');

        if (!payroll) {
            return res.status(404).json({
                success: false,
                message: 'Payroll not found'
            });
        }

        // Get tax breakdown
        const taxBreakdown = taxService.getDetailedTaxBreakdown(payroll.taxableIncome);

        // Get pension rates
        const pensionRates = pensionService.getPensionRates();

        const payslip = {
            employee: payroll.employee,
            payPeriod: payroll.payPeriod,
            earnings: {
                basicSalary: payroll.basicSalary,
                earnedSalary: payroll.earnedSalary,
                overtimePay: payroll.overtimePay,
                allowances: payroll.allowances,
                totalAllowances: payroll.totalAllowances,
                grossPay: payroll.grossPay
            },
            deductions: {
                incomeTax: payroll.incomeTax,
                pensionEmployee: payroll.pensionEmployee,
                otherDeductions: payroll.otherDeductions,
                totalDeductions: payroll.totalDeductions
            },
            netPay: payroll.netPay,
            taxBreakdown,
            pensionRates,
            workingDays: payroll.workingDays,
            overtimeHours: payroll.overtimeHours,
            calculations: payroll.calculations,
            workflow: {
                preparedBy: payroll.preparedBy,
                approvedBy: payroll.approvedBy,
                status: payroll.status,
                createdAt: payroll.createdAt,
                approvedAt: payroll.approvedAt,
                paidAt: payroll.paidAt
            },
            generatedAt: new Date()
        };

        res.json({
            success: true,
            message: 'Payslip generated successfully',
            data: { payslip }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    generatePayrollReport,
    generateTaxReport,
    generatePensionReport,
    generateEmployeeReport,
    generateTransactionReport,
    generatePayslip
};