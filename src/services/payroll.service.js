const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const { calculatePayroll } = require('../utils/calculateSalary');

/**
 * Calculate and create payroll for multiple employees
 * @param {Array} employeeIds - Array of employee IDs
 * @param {Object} payPeriod - Pay period (month, year)
 * @param {Object} defaultValues - Default working days, overtime hours
 * @param {String} preparedBy - User ID who prepared the payroll
 * @returns {Object} - Result with created payrolls and errors
 */
const createBulkPayroll = async (employeeIds, payPeriod, defaultValues, preparedBy) => {
    const results = {
        success: [],
        errors: [],
        summary: {
            totalEmployees: employeeIds.length,
            successCount: 0,
            errorCount: 0,
            totalGrossPay: 0,
            totalNetPay: 0,
            totalTax: 0,
            totalPension: 0
        }
    };

    for (const employeeId of employeeIds) {
        try {
            // Check if payroll already exists
            const existingPayroll = await Payroll.findOne({
                employee: employeeId,
                'payPeriod.month': payPeriod.month,
                'payPeriod.year': payPeriod.year
            });

            if (existingPayroll) {
                results.errors.push({
                    employeeId,
                    error: 'Payroll already exists for this period'
                });
                continue;
            }

            // Get employee data
            const employee = await Employee.findById(employeeId);
            if (!employee || employee.status !== 'ACTIVE') {
                results.errors.push({
                    employeeId,
                    error: 'Employee not found or inactive'
                });
                continue;
            }

            // Calculate payroll
            const calculation = calculatePayroll(
                employee,
                defaultValues.workingDays || 30,
                defaultValues.overtimeHours || 0
            );

            // Create payroll record
            const payroll = await Payroll.create({
                employee: employeeId,
                payPeriod,
                workingDays: defaultValues.workingDays || 30,
                overtimeHours: defaultValues.overtimeHours || 0,
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
                preparedBy,
                calculations: calculation.calculations
            });

            results.success.push(payroll);
            results.summary.successCount++;
            results.summary.totalGrossPay += calculation.grossPay;
            results.summary.totalNetPay += calculation.netPay;
            results.summary.totalTax += calculation.incomeTax;
            results.summary.totalPension += calculation.pensionEmployee + calculation.pensionEmployer;

        } catch (error) {
            results.errors.push({
                employeeId,
                error: error.message
            });
            results.summary.errorCount++;
        }
    }

    return results;
};

/**
 * Get payroll summary for a specific period
 * @param {Object} payPeriod - Pay period (month, year)
 * @returns {Object} - Payroll summary statistics
 */
const getPayrollSummary = async (payPeriod) => {
    const query = {
        'payPeriod.month': payPeriod.month,
        'payPeriod.year': payPeriod.year
    };

    const summary = await Payroll.aggregate([
        { $match: query },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalGrossPay: { $sum: '$grossPay' },
                totalNetPay: { $sum: '$netPay' },
                totalTax: { $sum: '$incomeTax' },
                totalPensionEmployee: { $sum: '$pensionEmployee' },
                totalPensionEmployer: { $sum: '$pensionEmployer' }
            }
        }
    ]);

    const overallSummary = await Payroll.aggregate([
        { $match: query },
        {
            $group: {
                _id: null,
                totalEmployees: { $sum: 1 },
                totalGrossPay: { $sum: '$grossPay' },
                totalNetPay: { $sum: '$netPay' },
                totalTax: { $sum: '$incomeTax' },
                totalPensionEmployee: { $sum: '$pensionEmployee' },
                totalPensionEmployer: { $sum: '$pensionEmployer' },
                totalDeductions: { $sum: '$totalDeductions' }
            }
        }
    ]);

    return {
        period: payPeriod,
        byStatus: summary,
        overall: overallSummary[0] || {
            totalEmployees: 0,
            totalGrossPay: 0,
            totalNetPay: 0,
            totalTax: 0,
            totalPensionEmployee: 0,
            totalPensionEmployer: 0,
            totalDeductions: 0
        }
    };
};

/**
 * Approve multiple payrolls
 * @param {Array} payrollIds - Array of payroll IDs
 * @param {String} approvedBy - User ID who approved
 * @returns {Object} - Result with approved payrolls and errors
 */
const approveBulkPayroll = async (payrollIds, approvedBy) => {
    const results = {
        success: [],
        errors: []
    };

    for (const payrollId of payrollIds) {
        try {
            const payroll = await Payroll.findById(payrollId);

            if (!payroll) {
                results.errors.push({
                    payrollId,
                    error: 'Payroll not found'
                });
                continue;
            }

            if (payroll.status !== 'PENDING') {
                results.errors.push({
                    payrollId,
                    error: 'Can only approve payroll with PENDING status'
                });
                continue;
            }

            payroll.status = 'APPROVED';
            payroll.approvedBy = approvedBy;
            payroll.approvedAt = new Date();

            await payroll.save();
            results.success.push(payroll);

        } catch (error) {
            results.errors.push({
                payrollId,
                error: error.message
            });
        }
    }

    return results;
};

/**
 * Generate payroll report data
 * @param {Object} filters - Report filters
 * @returns {Object} - Report data
 */
const generatePayrollReport = async (filters = {}) => {
    const {
        payPeriod,
        status,
        department,
        employeeIds,
        includeCalculations = false
    } = filters;

    let query = {};

    if (payPeriod) {
        if (payPeriod.month) query['payPeriod.month'] = payPeriod.month;
        if (payPeriod.year) query['payPeriod.year'] = payPeriod.year;
    }

    if (status) query.status = status;
    if (employeeIds && employeeIds.length > 0) query.employee = { $in: employeeIds };

    let payrollQuery = Payroll.find(query)
        .populate('employee', 'fullName employeeId position bankAccountNumber')
        .populate('preparedBy', 'fullName')
        .populate('approvedBy', 'fullName')
        .sort({ 'employee.fullName': 1 });

    if (!includeCalculations) {
        payrollQuery = payrollQuery.select('-calculations');
    }

    const payrolls = await payrollQuery;

    // Calculate totals
    const totals = payrolls.reduce((acc, payroll) => {
        acc.totalEmployees++;
        acc.totalGrossPay += payroll.grossPay;
        acc.totalNetPay += payroll.netPay;
        acc.totalTax += payroll.incomeTax;
        acc.totalPensionEmployee += payroll.pensionEmployee;
        acc.totalPensionEmployer += payroll.pensionEmployer;
        acc.totalDeductions += payroll.totalDeductions;
        return acc;
    }, {
        totalEmployees: 0,
        totalGrossPay: 0,
        totalNetPay: 0,
        totalTax: 0,
        totalPensionEmployee: 0,
        totalPensionEmployer: 0,
        totalDeductions: 0
    });

    return {
        payrolls,
        totals,
        filters,
        generatedAt: new Date()
    };
};

module.exports = {
    createBulkPayroll,
    getPayrollSummary,
    approveBulkPayroll,
    generatePayrollReport
};