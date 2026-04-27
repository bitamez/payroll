const { calculatePension } = require('../utils/calculateTax');

/**
 * Ethiopian Pension Service
 * Handles pension calculations and pension-related operations
 */

/**
 * Calculate pension contributions for multiple employees
 * @param {Array} payrolls - Array of payroll records
 * @returns {Object} - Pension calculation summary
 */
const calculateBulkPension = (payrolls) => {
    const summary = {
        totalEmployees: payrolls.length,
        totalEmployeeContribution: 0,
        totalEmployerContribution: 0,
        totalContribution: 0,
        averageEmployeeContribution: 0,
        averageEmployerContribution: 0,
        employeeBreakdown: []
    };

    payrolls.forEach(payroll => {
        const pension = calculatePension(payroll.grossPay);

        summary.totalEmployeeContribution += pension.employee;
        summary.totalEmployerContribution += pension.employer;
        summary.totalContribution += (pension.employee + pension.employer);

        summary.employeeBreakdown.push({
            employeeId: payroll.employee.employeeId,
            fullName: payroll.employee.fullName,
            grossPay: payroll.grossPay,
            employeeContribution: pension.employee,
            employerContribution: pension.employer,
            totalContribution: pension.employee + pension.employer,
            contributionRate: {
                employee: parseFloat(process.env.EMPLOYEE_PENSION_RATE) || 0.07,
                employer: parseFloat(process.env.EMPLOYER_PENSION_RATE) || 0.11
            }
        });
    });

    summary.averageEmployeeContribution = summary.totalEmployees > 0
        ? summary.totalEmployeeContribution / summary.totalEmployees
        : 0;

    summary.averageEmployerContribution = summary.totalEmployees > 0
        ? summary.totalEmployerContribution / summary.totalEmployees
        : 0;

    return summary;
};

/**
 * Get pension contribution rates
 * @returns {Object} - Current pension rates
 */
const getPensionRates = () => {
    return {
        employee: {
            rate: parseFloat(process.env.EMPLOYEE_PENSION_RATE) || 0.07,
            percentage: `${((parseFloat(process.env.EMPLOYEE_PENSION_RATE) || 0.07) * 100).toFixed(1)}%`,
            description: 'Employee pension contribution rate'
        },
        employer: {
            rate: parseFloat(process.env.EMPLOYER_PENSION_RATE) || 0.11,
            percentage: `${((parseFloat(process.env.EMPLOYER_PENSION_RATE) || 0.11) * 100).toFixed(1)}%`,
            description: 'Employer pension contribution rate'
        },
        total: {
            rate: (parseFloat(process.env.EMPLOYEE_PENSION_RATE) || 0.07) + (parseFloat(process.env.EMPLOYER_PENSION_RATE) || 0.11),
            percentage: `${(((parseFloat(process.env.EMPLOYEE_PENSION_RATE) || 0.07) + (parseFloat(process.env.EMPLOYER_PENSION_RATE) || 0.11)) * 100).toFixed(1)}%`,
            description: 'Total pension contribution rate'
        }
    };
};

/**
 * Calculate year-to-date pension for an employee
 * @param {string} employeeId - Employee ID
 * @param {number} currentYear - Current year
 * @returns {Object} - YTD pension calculation
 */
const calculateYTDPension = async (employeeId, currentYear) => {
    const Payroll = require('../models/Payroll');

    const ytdPayrolls = await Payroll.find({
        employee: employeeId,
        'payPeriod.year': currentYear,
        status: { $in: ['APPROVED', 'PAID'] }
    }).sort({ 'payPeriod.month': 1 });

    let ytdGrossPay = 0;
    let ytdEmployeePension = 0;
    let ytdEmployerPension = 0;
    const monthlyBreakdown = [];

    ytdPayrolls.forEach(payroll => {
        ytdGrossPay += payroll.grossPay;
        ytdEmployeePension += payroll.pensionEmployee;
        ytdEmployerPension += payroll.pensionEmployer;

        monthlyBreakdown.push({
            month: payroll.payPeriod.month,
            grossPay: payroll.grossPay,
            employeePension: payroll.pensionEmployee,
            employerPension: payroll.pensionEmployer,
            totalPension: payroll.pensionEmployee + payroll.pensionEmployer,
            cumulativeGrossPay: ytdGrossPay,
            cumulativeEmployeePension: ytdEmployeePension,
            cumulativeEmployerPension: ytdEmployerPension
        });
    });

    const rates = getPensionRates();

    return {
        employeeId,
        year: currentYear,
        ytdGrossPay,
        ytdEmployeePension,
        ytdEmployerPension,
        ytdTotalPension: ytdEmployeePension + ytdEmployerPension,
        averageMonthlyEmployeePension: ytdPayrolls.length > 0 ? ytdEmployeePension / ytdPayrolls.length : 0,
        averageMonthlyEmployerPension: ytdPayrolls.length > 0 ? ytdEmployerPension / ytdPayrolls.length : 0,
        rates,
        monthlyBreakdown
    };
};

/**
 * Generate pension report for a specific period
 * @param {Object} filters - Report filters
 * @returns {Object} - Pension report
 */
const generatePensionReport = async (filters = {}) => {
    const Payroll = require('../models/Payroll');

    const { payPeriod, status = ['APPROVED', 'PAID'], employeeIds } = filters;

    let query = { status: { $in: status } };

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

    const pensionSummary = calculateBulkPension(payrolls);
    const rates = getPensionRates();

    // Calculate additional statistics
    const statistics = {
        highestEmployeeContribution: Math.max(...pensionSummary.employeeBreakdown.map(e => e.employeeContribution)),
        lowestEmployeeContribution: Math.min(...pensionSummary.employeeBreakdown.map(e => e.employeeContribution)),
        highestEmployerContribution: Math.max(...pensionSummary.employeeBreakdown.map(e => e.employerContribution)),
        lowestEmployerContribution: Math.min(...pensionSummary.employeeBreakdown.map(e => e.employerContribution)),
        medianEmployeeContribution: calculateMedian(pensionSummary.employeeBreakdown.map(e => e.employeeContribution)),
        medianEmployerContribution: calculateMedian(pensionSummary.employeeBreakdown.map(e => e.employerContribution))
    };

    return {
        period: payPeriod,
        rates,
        summary: pensionSummary,
        statistics,
        generatedAt: new Date(),
        filters
    };
};

/**
 * Calculate pension projection for an employee
 * @param {Object} employee - Employee data
 * @param {number} projectionYears - Number of years to project
 * @param {number} annualSalaryIncrease - Annual salary increase percentage (default 5%)
 * @returns {Object} - Pension projection
 */
const calculatePensionProjection = (employee, projectionYears = 10, annualSalaryIncrease = 0.05) => {
    const rates = getPensionRates();
    const projection = [];
    let currentSalary = employee.basicSalary;
    let totalEmployeeContribution = 0;
    let totalEmployerContribution = 0;

    for (let year = 1; year <= projectionYears; year++) {
        // Apply annual salary increase
        if (year > 1) {
            currentSalary = currentSalary * (1 + annualSalaryIncrease);
        }

        const annualGrossPay = currentSalary * 12; // Assuming 12 months
        const pension = calculatePension(annualGrossPay);

        totalEmployeeContribution += pension.employee;
        totalEmployerContribution += pension.employer;

        projection.push({
            year,
            annualSalary: Math.round(currentSalary * 100) / 100,
            annualGrossPay: Math.round(annualGrossPay * 100) / 100,
            employeeContribution: Math.round(pension.employee * 100) / 100,
            employerContribution: Math.round(pension.employer * 100) / 100,
            totalAnnualContribution: Math.round((pension.employee + pension.employer) * 100) / 100,
            cumulativeEmployeeContribution: Math.round(totalEmployeeContribution * 100) / 100,
            cumulativeEmployerContribution: Math.round(totalEmployerContribution * 100) / 100,
            cumulativeTotalContribution: Math.round((totalEmployeeContribution + totalEmployerContribution) * 100) / 100
        });
    }

    return {
        employee: {
            id: employee._id,
            fullName: employee.fullName,
            currentSalary: employee.basicSalary
        },
        projectionParameters: {
            years: projectionYears,
            annualSalaryIncrease: annualSalaryIncrease * 100 + '%'
        },
        rates,
        projection,
        summary: {
            totalEmployeeContribution: Math.round(totalEmployeeContribution * 100) / 100,
            totalEmployerContribution: Math.round(totalEmployerContribution * 100) / 100,
            totalContribution: Math.round((totalEmployeeContribution + totalEmployerContribution) * 100) / 100,
            averageAnnualEmployeeContribution: Math.round((totalEmployeeContribution / projectionYears) * 100) / 100,
            averageAnnualEmployerContribution: Math.round((totalEmployerContribution / projectionYears) * 100) / 100
        }
    };
};

/**
 * Helper function to calculate median
 * @param {Array} numbers - Array of numbers
 * @returns {number} - Median value
 */
const calculateMedian = (numbers) => {
    if (numbers.length === 0) return 0;

    const sorted = numbers.slice().sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
        return (sorted[middle - 1] + sorted[middle]) / 2;
    } else {
        return sorted[middle];
    }
};

module.exports = {
    calculateBulkPension,
    getPensionRates,
    calculateYTDPension,
    generatePensionReport,
    calculatePensionProjection
};