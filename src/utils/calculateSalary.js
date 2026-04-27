const { calculateEthiopianTax, calculatePension } = require('./calculateTax');

/**
 * Calculate complete payroll for an employee
 * @param {object} employee - Employee data
 * @param {number} workingDays - Number of working days
 * @param {number} overtimeHours - Overtime hours worked
 * @param {array} additionalAllowances - Additional allowances for this period
 * @param {array} additionalDeductions - Additional deductions for this period
 * @returns {object} - Complete payroll calculation
 */
const calculatePayroll = (employee, workingDays, overtimeHours = 0, additionalAllowances = [], additionalDeductions = []) => {
    const standardWorkingDays = 30;
    const standardWorkingHours = 8;
    const overtimeMultiplier = parseFloat(process.env.OVERTIME_MULTIPLIER) || 1.5;

    // Calculate earned salary based on working days
    const earnedSalary = Math.round((employee.basicSalary / standardWorkingDays) * workingDays * 100) / 100;

    // Calculate overtime pay
    const hourlyRate = employee.basicSalary / (standardWorkingDays * standardWorkingHours);
    const overtimePay = Math.round(hourlyRate * overtimeHours * overtimeMultiplier * 100) / 100;

    // Process allowances
    const allowances = [...(employee.allowances || []), ...additionalAllowances];
    let totalAllowances = 0;
    let taxableAllowances = 0;

    allowances.forEach(allowance => {
        if (allowance.isActive !== false) {
            totalAllowances += allowance.amount;
            if (allowance.isTaxable) {
                taxableAllowances += allowance.amount;
            }
        }
    });

    // Calculate gross pay
    const grossPay = Math.round((earnedSalary + overtimePay + totalAllowances) * 100) / 100;

    // Calculate taxable income (earned salary + overtime + taxable allowances)
    const taxableIncome = Math.round((earnedSalary + overtimePay + taxableAllowances) * 100) / 100;

    // Calculate tax
    const incomeTax = calculateEthiopianTax(taxableIncome);

    // Calculate pension
    const pension = calculatePension(grossPay);

    // Process other deductions
    const otherDeductions = [...(employee.deductions || []), ...additionalDeductions];
    let totalOtherDeductions = 0;

    otherDeductions.forEach(deduction => {
        if (deduction.isActive !== false) {
            totalOtherDeductions += deduction.amount;
        }
    });

    // Calculate total deductions
    const totalDeductions = Math.round((incomeTax + pension.employee + totalOtherDeductions) * 100) / 100;

    // Calculate net pay
    const netPay = Math.round((grossPay - totalDeductions) * 100) / 100;

    return {
        basicSalary: employee.basicSalary,
        earnedSalary,
        overtimePay,
        allowances: allowances.filter(a => a.isActive !== false),
        totalAllowances,
        taxableAllowances,
        grossPay,
        taxableIncome,
        incomeTax,
        pensionEmployee: pension.employee,
        pensionEmployer: pension.employer,
        otherDeductions: otherDeductions.filter(d => d.isActive !== false),
        totalDeductions,
        netPay,
        calculations: {
            workingDays,
            standardWorkingDays,
            overtimeHours,
            hourlyRate,
            overtimeMultiplier,
            taxBreakdown: getDetailedTaxCalculation(taxableIncome),
            pensionRates: {
                employee: parseFloat(process.env.EMPLOYEE_PENSION_RATE) || 0.07,
                employer: parseFloat(process.env.EMPLOYER_PENSION_RATE) || 0.11
            }
        }
    };
};

/**
 * Get detailed tax calculation breakdown
 * @param {number} taxableIncome - The taxable income
 * @returns {array} - Tax calculation breakdown by bracket
 */
const getDetailedTaxCalculation = (taxableIncome) => {
    const taxBrackets = [
        { min: 0, max: 600, rate: 0 },
        { min: 600, max: 1650, rate: 0.10 },
        { min: 1650, max: 3200, rate: 0.15 },
        { min: 3200, max: 5250, rate: 0.20 },
        { min: 5250, max: 7800, rate: 0.25 },
        { min: 7800, max: 10900, rate: 0.30 },
        { min: 10900, max: Infinity, rate: 0.35 }
    ];

    const breakdown = [];
    let remainingIncome = taxableIncome;

    for (const bracket of taxBrackets) {
        if (remainingIncome <= 0) break;

        const taxableAtThisBracket = Math.min(
            remainingIncome,
            bracket.max - bracket.min
        );

        if (taxableAtThisBracket > 0) {
            breakdown.push({
                bracket: `${bracket.min} - ${bracket.max === Infinity ? 'above' : bracket.max}`,
                rate: bracket.rate,
                taxableAmount: taxableAtThisBracket,
                tax: Math.round(taxableAtThisBracket * bracket.rate * 100) / 100
            });
        }

        remainingIncome -= taxableAtThisBracket;
    }

    return breakdown;
};

module.exports = {
    calculatePayroll,
    getDetailedTaxCalculation
};