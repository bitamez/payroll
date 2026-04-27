/**
 * Calculate Ethiopian income tax based on tax brackets
 * @param {number} taxableIncome - The taxable income amount
 * @returns {number} - The calculated tax amount
 */
const calculateEthiopianTax = (taxableIncome) => {
    // Ethiopian tax brackets (in ETB)
    const taxBrackets = [
        { min: 0, max: 600, rate: 0 },
        { min: 600, max: 1650, rate: 0.10 },
        { min: 1650, max: 3200, rate: 0.15 },
        { min: 3200, max: 5250, rate: 0.20 },
        { min: 5250, max: 7800, rate: 0.25 },
        { min: 7800, max: 10900, rate: 0.30 },
        { min: 10900, max: Infinity, rate: 0.35 }
    ];

    let tax = 0;
    let remainingIncome = taxableIncome;

    for (const bracket of taxBrackets) {
        if (remainingIncome <= 0) break;

        const taxableAtThisBracket = Math.min(
            remainingIncome,
            bracket.max - bracket.min
        );

        tax += taxableAtThisBracket * bracket.rate;
        remainingIncome -= taxableAtThisBracket;
    }

    return Math.round(tax * 100) / 100; // Round to 2 decimal places
};

/**
 * Calculate pension contributions
 * @param {number} grossPay - The gross pay amount
 * @returns {object} - Employee and employer pension contributions
 */
const calculatePension = (grossPay) => {
    const employeeRate = parseFloat(process.env.EMPLOYEE_PENSION_RATE) || 0.07;
    const employerRate = parseFloat(process.env.EMPLOYER_PENSION_RATE) || 0.11;

    return {
        employee: Math.round(grossPay * employeeRate * 100) / 100,
        employer: Math.round(grossPay * employerRate * 100) / 100
    };
};

module.exports = {
    calculateEthiopianTax,
    calculatePension
};