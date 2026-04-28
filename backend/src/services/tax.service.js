const { calculateEthiopianTax } = require('../utils/calculateTax');

/**
 * Ethiopian Tax Service
 * Handles tax calculations and tax-related operations
 */

/**
 * Calculate tax for multiple income levels
 * @param {Array} incomes - Array of taxable incomes
 * @returns {Array} - Array of tax calculations
 */
const calculateBulkTax = (incomes) => {
    return incomes.map(income => ({
        taxableIncome: income,
        tax: calculateEthiopianTax(income),
        effectiveRate: income > 0 ? (calculateEthiopianTax(income) / income) * 100 : 0
    }));
};

/**
 * Get tax bracket information
 * @returns {Array} - Tax bracket details
 */
const getTaxBrackets = () => {
    return [
        { min: 0, max: 600, rate: 0, description: 'Tax-free bracket' },
        { min: 600, max: 1650, rate: 0.10, description: '10% tax bracket' },
        { min: 1650, max: 3200, rate: 0.15, description: '15% tax bracket' },
        { min: 3200, max: 5250, rate: 0.20, description: '20% tax bracket' },
        { min: 5250, max: 7800, rate: 0.25, description: '25% tax bracket' },
        { min: 7800, max: 10900, rate: 0.30, description: '30% tax bracket' },
        { min: 10900, max: Infinity, rate: 0.35, description: '35% tax bracket (highest)' }
    ];
};

/**
 * Calculate tax breakdown by bracket
 * @param {number} taxableIncome - The taxable income
 * @returns {Object} - Detailed tax breakdown
 */
const getDetailedTaxBreakdown = (taxableIncome) => {
    const brackets = getTaxBrackets();
    const breakdown = [];
    let remainingIncome = taxableIncome;
    let totalTax = 0;

    for (const bracket of brackets) {
        if (remainingIncome <= 0) break;

        const taxableAtThisBracket = Math.min(
            remainingIncome,
            bracket.max - bracket.min
        );

        if (taxableAtThisBracket > 0) {
            const taxAtThisBracket = Math.round(taxableAtThisBracket * bracket.rate * 100) / 100;

            breakdown.push({
                bracket: `${bracket.min} - ${bracket.max === Infinity ? 'above' : bracket.max}`,
                rate: bracket.rate,
                ratePercentage: `${(bracket.rate * 100).toFixed(1)}%`,
                taxableAmount: taxableAtThisBracket,
                tax: taxAtThisBracket,
                description: bracket.description
            });

            totalTax += taxAtThisBracket;
        }

        remainingIncome -= taxableAtThisBracket;
    }

    return {
        taxableIncome,
        totalTax: Math.round(totalTax * 100) / 100,
        effectiveRate: taxableIncome > 0 ? (totalTax / taxableIncome) * 100 : 0,
        marginalRate: getMarginalTaxRate(taxableIncome) * 100,
        breakdown
    };
};

/**
 * Get marginal tax rate for a given income
 * @param {number} taxableIncome - The taxable income
 * @returns {number} - Marginal tax rate (as decimal)
 */
const getMarginalTaxRate = (taxableIncome) => {
    const brackets = getTaxBrackets();

    for (const bracket of brackets) {
        if (taxableIncome >= bracket.min && taxableIncome < bracket.max) {
            return bracket.rate;
        }
    }

    // If income is above the highest bracket
    return brackets[brackets.length - 1].rate;
};

/**
 * Calculate tax savings from allowances
 * @param {number} grossIncome - Gross income before allowances
 * @param {Array} allowances - Array of allowances with taxable status
 * @returns {Object} - Tax savings calculation
 */
const calculateTaxSavings = (grossIncome, allowances) => {
    const taxableAllowances = allowances
        .filter(allowance => allowance.isTaxable)
        .reduce((sum, allowance) => sum + allowance.amount, 0);

    const nonTaxableAllowances = allowances
        .filter(allowance => !allowance.isTaxable)
        .reduce((sum, allowance) => sum + allowance.amount, 0);

    const taxWithAllAllowances = calculateEthiopianTax(grossIncome + taxableAllowances);
    const taxWithTaxableAllowancesOnly = calculateEthiopianTax(grossIncome + taxableAllowances);
    const taxWithoutAllowances = calculateEthiopianTax(grossIncome);

    return {
        grossIncome,
        taxableAllowances,
        nonTaxableAllowances,
        totalAllowances: taxableAllowances + nonTaxableAllowances,
        taxWithAllAllowances,
        taxWithoutAllowances,
        taxSavings: taxWithoutAllowances - taxWithAllAllowances,
        effectiveTaxRate: grossIncome > 0 ? (taxWithAllAllowances / (grossIncome + taxableAllowances)) * 100 : 0
    };
};

/**
 * Generate tax report for multiple employees
 * @param {Array} payrolls - Array of payroll records
 * @returns {Object} - Tax report summary
 */
const generateTaxReport = (payrolls) => {
    const report = {
        totalEmployees: payrolls.length,
        totalTaxableIncome: 0,
        totalTaxCollected: 0,
        averageTaxRate: 0,
        taxByBracket: {},
        employeeBreakdown: []
    };

    // Initialize tax brackets
    const brackets = getTaxBrackets();
    brackets.forEach(bracket => {
        const key = `${bracket.min}-${bracket.max === Infinity ? 'above' : bracket.max}`;
        report.taxByBracket[key] = {
            employees: 0,
            totalIncome: 0,
            totalTax: 0,
            rate: bracket.rate
        };
    });

    payrolls.forEach(payroll => {
        const taxBreakdown = getDetailedTaxBreakdown(payroll.taxableIncome);

        report.totalTaxableIncome += payroll.taxableIncome;
        report.totalTaxCollected += payroll.incomeTax;

        // Find which bracket this employee falls into (highest bracket they reach)
        const marginalRate = getMarginalTaxRate(payroll.taxableIncome);
        const bracketKey = brackets.find(b => b.rate === marginalRate);
        const key = `${bracketKey.min}-${bracketKey.max === Infinity ? 'above' : bracketKey.max}`;

        report.taxByBracket[key].employees++;
        report.taxByBracket[key].totalIncome += payroll.taxableIncome;
        report.taxByBracket[key].totalTax += payroll.incomeTax;

        report.employeeBreakdown.push({
            employeeId: payroll.employee.employeeId,
            fullName: payroll.employee.fullName,
            taxableIncome: payroll.taxableIncome,
            incomeTax: payroll.incomeTax,
            effectiveRate: taxBreakdown.effectiveRate,
            marginalRate: taxBreakdown.marginalRate
        });
    });

    report.averageTaxRate = report.totalTaxableIncome > 0
        ? (report.totalTaxCollected / report.totalTaxableIncome) * 100
        : 0;

    return report;
};

/**
 * Calculate year-to-date tax for an employee
 * @param {string} employeeId - Employee ID
 * @param {number} currentYear - Current year
 * @returns {Object} - YTD tax calculation
 */
const calculateYTDTax = async (employeeId, currentYear) => {
    const Payroll = require('../models/Payroll');

    const ytdPayrolls = await Payroll.find({
        employee: employeeId,
        'payPeriod.year': currentYear,
        status: { $in: ['APPROVED', 'PAID'] }
    }).sort({ 'payPeriod.month': 1 });

    let ytdTaxableIncome = 0;
    let ytdTaxPaid = 0;
    const monthlyBreakdown = [];

    ytdPayrolls.forEach(payroll => {
        ytdTaxableIncome += payroll.taxableIncome;
        ytdTaxPaid += payroll.incomeTax;

        monthlyBreakdown.push({
            month: payroll.payPeriod.month,
            taxableIncome: payroll.taxableIncome,
            incomeTax: payroll.incomeTax,
            cumulativeTaxableIncome: ytdTaxableIncome,
            cumulativeTax: ytdTaxPaid
        });
    });

    return {
        employeeId,
        year: currentYear,
        ytdTaxableIncome,
        ytdTaxPaid,
        averageMonthlyTax: ytdPayrolls.length > 0 ? ytdTaxPaid / ytdPayrolls.length : 0,
        effectiveYTDRate: ytdTaxableIncome > 0 ? (ytdTaxPaid / ytdTaxableIncome) * 100 : 0,
        monthlyBreakdown
    };
};

module.exports = {
    calculateBulkTax,
    getTaxBrackets,
    getDetailedTaxBreakdown,
    getMarginalTaxRate,
    calculateTaxSavings,
    generateTaxReport,
    calculateYTDTax
};