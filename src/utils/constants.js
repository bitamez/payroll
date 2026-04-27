/**
 * Application Constants
 */

// Employee Status
const EMPLOYEE_STATUS = {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    TERMINATED: 'TERMINATED'
};

// Employment Types
const EMPLOYMENT_TYPE = {
    FULL_TIME: 'FULL_TIME',
    PART_TIME: 'PART_TIME'
};

// User Roles
const USER_ROLES = {
    HR: 'HR',
    FINANCE: 'FINANCE'
};

// Payroll Status
const PAYROLL_STATUS = {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    PAID: 'PAID',
    FAILED: 'FAILED'
};

// Transaction Status
const TRANSACTION_STATUS = {
    PENDING: 'PENDING',
    SUCCESS: 'SUCCESS',
    FAILED: 'FAILED',
    ROLLED_BACK: 'ROLLED_BACK'
};

// Transaction Types
const TRANSACTION_TYPE = {
    SALARY: 'SALARY',
    TAX: 'TAX',
    PENSION: 'PENSION',
    ALLOWANCE: 'ALLOWANCE',
    DEDUCTION: 'DEDUCTION'
};

// Account Types
const ACCOUNT_TYPE = {
    EMPLOYEE: 'EMPLOYEE',
    COMPANY: 'COMPANY',
    GOVERNMENT: 'GOVERNMENT',
    PENSION: 'PENSION'
};

// Allowance Types
const ALLOWANCE_TYPE = {
    POSITION: 'POSITION',
    TRANSPORT: 'TRANSPORT',
    HOUSING: 'HOUSING',
    MEAL: 'MEAL',
    OTHER: 'OTHER'
};

// Deduction Types
const DEDUCTION_TYPE = {
    TAX: 'TAX',
    PENSION: 'PENSION',
    LOAN: 'LOAN',
    ADVANCE: 'ADVANCE',
    OTHER: 'OTHER'
};

// Gender Options
const GENDER = {
    MALE: 'MALE',
    FEMALE: 'FEMALE'
};

// Ethiopian Tax Brackets (in ETB)
const TAX_BRACKETS = [
    { min: 0, max: 600, rate: 0.00 },
    { min: 600, max: 1650, rate: 0.10 },
    { min: 1650, max: 3200, rate: 0.15 },
    { min: 3200, max: 5250, rate: 0.20 },
    { min: 5250, max: 7800, rate: 0.25 },
    { min: 7800, max: 10900, rate: 0.30 },
    { min: 10900, max: Infinity, rate: 0.35 }
];

// Default Pension Rates
const PENSION_RATES = {
    EMPLOYEE: 0.07, // 7%
    EMPLOYER: 0.11  // 11%
};

// Default Working Parameters
const WORKING_PARAMETERS = {
    STANDARD_WORKING_DAYS: 30,
    STANDARD_WORKING_HOURS: 8,
    OVERTIME_MULTIPLIER: 1.5
};

// Default Account Numbers
const DEFAULT_ACCOUNTS = {
    COMPANY: 'COMPANY-001',
    GOVERNMENT: 'GOV-001',
    PENSION: 'PENSION-001'
};

// API Response Messages
const RESPONSE_MESSAGES = {
    SUCCESS: {
        CREATED: 'Resource created successfully',
        UPDATED: 'Resource updated successfully',
        DELETED: 'Resource deleted successfully',
        RETRIEVED: 'Resource retrieved successfully',
        LOGIN: 'Login successful',
        LOGOUT: 'Logout successful'
    },
    ERROR: {
        NOT_FOUND: 'Resource not found',
        UNAUTHORIZED: 'Unauthorized access',
        FORBIDDEN: 'Access forbidden',
        VALIDATION: 'Validation error',
        DUPLICATE: 'Resource already exists',
        SERVER_ERROR: 'Internal server error',
        INVALID_CREDENTIALS: 'Invalid credentials',
        TOKEN_EXPIRED: 'Token expired',
        INSUFFICIENT_BALANCE: 'Insufficient account balance',
        PAYROLL_EXISTS: 'Payroll already exists for this period',
        INVALID_STATUS: 'Invalid status for this operation'
    }
};

// HTTP Status Codes
const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500
};

// Pagination Defaults
const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100
};

// Date Formats
const DATE_FORMATS = {
    ISO: 'YYYY-MM-DDTHH:mm:ss.sssZ',
    DATE_ONLY: 'YYYY-MM-DD',
    DISPLAY: 'DD/MM/YYYY',
    MONTH_YEAR: 'MM/YYYY'
};

// Validation Rules
const VALIDATION_RULES = {
    PASSWORD_MIN_LENGTH: 6,
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 100,
    POSITION_MAX_LENGTH: 50,
    ACCOUNT_NUMBER_MIN_LENGTH: 5,
    ACCOUNT_NUMBER_MAX_LENGTH: 50,
    MAX_WORKING_DAYS: 31,
    MIN_SALARY: 0
};

// File Upload Limits
const FILE_LIMITS = {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'application/pdf', 'application/vnd.ms-excel']
};

// Rate Limiting
const RATE_LIMITS = {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
    LOGIN_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    LOGIN_MAX_ATTEMPTS: 5
};

// Cache TTL (Time To Live) in seconds
const CACHE_TTL = {
    SHORT: 300,    // 5 minutes
    MEDIUM: 1800,  // 30 minutes
    LONG: 3600,    // 1 hour
    VERY_LONG: 86400 // 24 hours
};

// Audit Actions
const AUDIT_ACTIONS = {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
    APPROVE: 'APPROVE',
    PROCESS_PAYMENT: 'PROCESS_PAYMENT',
    ROLLBACK: 'ROLLBACK'
};

// Security Events
const SECURITY_EVENTS = {
    FAILED_LOGIN: 'FAILED_LOGIN',
    MULTIPLE_FAILED_LOGINS: 'MULTIPLE_FAILED_LOGINS',
    UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
    SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
    PASSWORD_CHANGE: 'PASSWORD_CHANGE'
};

// Report Types
const REPORT_TYPES = {
    PAYROLL_SUMMARY: 'PAYROLL_SUMMARY',
    TAX_REPORT: 'TAX_REPORT',
    PENSION_REPORT: 'PENSION_REPORT',
    EMPLOYEE_REPORT: 'EMPLOYEE_REPORT',
    TRANSACTION_REPORT: 'TRANSACTION_REPORT',
    PAYSLIP: 'PAYSLIP'
};

// Export Formats
const EXPORT_FORMATS = {
    PDF: 'PDF',
    EXCEL: 'EXCEL',
    CSV: 'CSV',
    JSON: 'JSON'
};

module.exports = {
    EMPLOYEE_STATUS,
    EMPLOYMENT_TYPE,
    USER_ROLES,
    PAYROLL_STATUS,
    TRANSACTION_STATUS,
    TRANSACTION_TYPE,
    ACCOUNT_TYPE,
    ALLOWANCE_TYPE,
    DEDUCTION_TYPE,
    GENDER,
    TAX_BRACKETS,
    PENSION_RATES,
    WORKING_PARAMETERS,
    DEFAULT_ACCOUNTS,
    RESPONSE_MESSAGES,
    HTTP_STATUS,
    PAGINATION,
    DATE_FORMATS,
    VALIDATION_RULES,
    FILE_LIMITS,
    RATE_LIMITS,
    CACHE_TTL,
    AUDIT_ACTIONS,
    SECURITY_EVENTS,
    REPORT_TYPES,
    EXPORT_FORMATS
};