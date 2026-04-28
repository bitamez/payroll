/**
 * Helper utility functions
 */

/**
 * Generate a random string
 * @param {number} length - Length of the string
 * @returns {string} - Random string
 */
const generateRandomString = (length = 10) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

/**
 * Generate employee ID
 * @param {number} count - Current employee count
 * @returns {string} - Employee ID
 */
const generateEmployeeId = (count) => {
    return `EMP${String(count + 1).padStart(4, '0')}`;
};

/**
 * Generate transaction ID
 * @returns {string} - Transaction ID
 */
const generateTransactionId = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `TXN${timestamp}${String(random).padStart(4, '0')}`;
};

/**
 * Generate batch ID
 * @param {string} prefix - Prefix for batch ID
 * @returns {string} - Batch ID
 */
const generateBatchId = (prefix = 'BATCH') => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${prefix}_${timestamp}_${String(random).padStart(3, '0')}`;
};

/**
 * Format currency amount
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency symbol
 * @returns {string} - Formatted currency
 */
const formatCurrency = (amount, currency = 'ETB') => {
    return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Round to 2 decimal places
 * @param {number} number - Number to round
 * @returns {number} - Rounded number
 */
const roundToTwo = (number) => {
    return Math.round(number * 100) / 100;
};

/**
 * Calculate percentage
 * @param {number} value - Value
 * @param {number} total - Total
 * @returns {number} - Percentage
 */
const calculatePercentage = (value, total) => {
    if (total === 0) return 0;
    return roundToTwo((value / total) * 100);
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Is valid email
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate phone number format (Ethiopian)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - Is valid phone number
 */
const isValidEthiopianPhone = (phone) => {
    const phoneRegex = /^(\+251|0)?[79]\d{8}$/;
    return phoneRegex.test(phone);
};

/**
 * Format date to Ethiopian format
 * @param {Date} date - Date to format
 * @returns {string} - Formatted date
 */
const formatEthiopianDate = (date) => {
    return new Intl.DateTimeFormat('en-ET', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(new Date(date));
};

/**
 * Get month name
 * @param {number} month - Month number (1-12)
 * @returns {string} - Month name
 */
const getMonthName = (month) => {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || '';
};

/**
 * Get Ethiopian month name
 * @param {number} month - Month number (1-12)
 * @returns {string} - Ethiopian month name
 */
const getEthiopianMonthName = (month) => {
    const ethiopianMonths = [
        'Meskerem', 'Tikemt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit',
        'Megabit', 'Miazia', 'Ginbot', 'Sene', 'Hamle', 'Nehase'
    ];
    return ethiopianMonths[month - 1] || '';
};

/**
 * Calculate age from birth date
 * @param {Date} birthDate - Birth date
 * @returns {number} - Age in years
 */
const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return age;
};

/**
 * Calculate years of service
 * @param {Date} employmentDate - Employment start date
 * @returns {number} - Years of service
 */
const calculateYearsOfService = (employmentDate) => {
    return calculateAge(employmentDate);
};

/**
 * Sanitize string for database storage
 * @param {string} str - String to sanitize
 * @returns {string} - Sanitized string
 */
const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str.trim().replace(/[<>]/g, '');
};

/**
 * Generate pagination metadata
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {Object} - Pagination metadata
 */
const generatePaginationMeta = (page, limit, total) => {
    const totalPages = Math.ceil(total / limit);
    return {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total),
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null
    };
};

/**
 * Create success response
 * @param {string} message - Success message
 * @param {Object} data - Response data
 * @param {Object} meta - Additional metadata
 * @returns {Object} - Success response
 */
const createSuccessResponse = (message, data = null, meta = null) => {
    const response = {
        success: true,
        message
    };

    if (data !== null) response.data = data;
    if (meta !== null) response.meta = meta;

    return response;
};

/**
 * Create error response
 * @param {string} message - Error message
 * @param {Array} errors - Validation errors
 * @param {number} statusCode - HTTP status code
 * @returns {Object} - Error response
 */
const createErrorResponse = (message, errors = null, statusCode = 400) => {
    const response = {
        success: false,
        message,
        statusCode
    };

    if (errors !== null) response.errors = errors;

    return response;
};

/**
 * Mask sensitive data
 * @param {string} data - Data to mask
 * @param {number} visibleChars - Number of visible characters at start and end
 * @returns {string} - Masked data
 */
const maskSensitiveData = (data, visibleChars = 2) => {
    if (!data || data.length <= visibleChars * 2) return data;

    const start = data.substring(0, visibleChars);
    const end = data.substring(data.length - visibleChars);
    const middle = '*'.repeat(data.length - visibleChars * 2);

    return `${start}${middle}${end}`;
};

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object} - Cloned object
 */
const deepClone = (obj) => {
    return JSON.parse(JSON.stringify(obj));
};

/**
 * Check if object is empty
 * @param {Object} obj - Object to check
 * @returns {boolean} - Is empty
 */
const isEmpty = (obj) => {
    return Object.keys(obj).length === 0;
};

/**
 * Convert string to title case
 * @param {string} str - String to convert
 * @returns {string} - Title case string
 */
const toTitleCase = (str) => {
    return str.replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
};

/**
 * Generate random password
 * @param {number} length - Password length
 * @returns {string} - Random password
 */
const generateRandomPassword = (length = 12) => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';

    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    return password;
};

/**
 * Validate Ethiopian Birr amount
 * @param {number} amount - Amount to validate
 * @returns {boolean} - Is valid amount
 */
const isValidBirrAmount = (amount) => {
    return typeof amount === 'number' && amount >= 0 && Number.isFinite(amount);
};

/**
 * Convert number to words (Ethiopian Birr)
 * @param {number} amount - Amount to convert
 * @returns {string} - Amount in words
 */
const numberToWords = (amount) => {
    // Simplified implementation - can be expanded for full Ethiopian Birr conversion
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if (amount === 0) return 'Zero Birr';

    const birr = Math.floor(amount);
    const cents = Math.round((amount - birr) * 100);

    let result = '';

    if (birr > 0) {
        // Simplified conversion for amounts up to 999
        if (birr < 10) {
            result = ones[birr];
        } else if (birr < 20) {
            result = teens[birr - 10];
        } else if (birr < 100) {
            result = tens[Math.floor(birr / 10)] + (birr % 10 > 0 ? ' ' + ones[birr % 10] : '');
        } else {
            result = ones[Math.floor(birr / 100)] + ' Hundred' + (birr % 100 > 0 ? ' ' + numberToWords(birr % 100).replace(' Birr', '') : '');
        }

        result += ' Birr';
    }

    if (cents > 0) {
        result += (result ? ' and ' : '') + cents + ' Cents';
    }

    return result || 'Zero Birr';
};

module.exports = {
    generateRandomString,
    generateEmployeeId,
    generateTransactionId,
    generateBatchId,
    formatCurrency,
    roundToTwo,
    calculatePercentage,
    isValidEmail,
    isValidEthiopianPhone,
    formatEthiopianDate,
    getMonthName,
    getEthiopianMonthName,
    calculateAge,
    calculateYearsOfService,
    sanitizeString,
    generatePaginationMeta,
    createSuccessResponse,
    createErrorResponse,
    maskSensitiveData,
    deepClone,
    isEmpty,
    toTitleCase,
    generateRandomPassword,
    isValidBirrAmount,
    numberToWords
};