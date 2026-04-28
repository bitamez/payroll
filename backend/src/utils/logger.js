const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = 'logs';
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.prettyPrint()
);

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: {
        service: 'payroll-backend',
        environment: process.env.NODE_ENV || 'development'
    },
    transports: [
        // Error log file
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),

        // Combined log file
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),

        // Audit log file for sensitive operations
        new winston.transports.File({
            filename: path.join(logsDir, 'audit.log'),
            level: 'info',
            maxsize: 5242880, // 5MB
            maxFiles: 10,
        })
    ],

    // Handle exceptions and rejections
    exceptionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'exceptions.log')
        })
    ],

    rejectionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'rejections.log')
        })
    ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

// Audit logging function for sensitive operations
const auditLog = (action, userId, details = {}) => {
    logger.info('AUDIT', {
        action,
        userId,
        timestamp: new Date().toISOString(),
        details,
        type: 'audit'
    });
};

// Security logging function
const securityLog = (event, details = {}) => {
    logger.warn('SECURITY', {
        event,
        timestamp: new Date().toISOString(),
        details,
        type: 'security'
    });
};

// Performance logging function
const performanceLog = (operation, duration, details = {}) => {
    logger.info('PERFORMANCE', {
        operation,
        duration,
        timestamp: new Date().toISOString(),
        details,
        type: 'performance'
    });
};

// Transaction logging function
const transactionLog = (transactionId, action, details = {}) => {
    logger.info('TRANSACTION', {
        transactionId,
        action,
        timestamp: new Date().toISOString(),
        details,
        type: 'transaction'
    });
};

// Payroll logging function
const payrollLog = (payrollId, action, userId, details = {}) => {
    logger.info('PAYROLL', {
        payrollId,
        action,
        userId,
        timestamp: new Date().toISOString(),
        details,
        type: 'payroll'
    });
};

// Employee logging function
const employeeLog = (employeeId, action, userId, details = {}) => {
    logger.info('EMPLOYEE', {
        employeeId,
        action,
        userId,
        timestamp: new Date().toISOString(),
        details,
        type: 'employee'
    });
};

// Error logging with context
const errorLog = (error, context = {}) => {
    logger.error('APPLICATION_ERROR', {
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
        type: 'error'
    });
};

// Request logging middleware
const requestLogger = (req, res, next) => {
    const start = Date.now();

    // Log request
    logger.info('REQUEST', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user ? req.user._id : null,
        timestamp: new Date().toISOString(),
        type: 'request'
    });

    // Log response
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info('RESPONSE', {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration,
            userId: req.user ? req.user._id : null,
            timestamp: new Date().toISOString(),
            type: 'response'
        });
    });

    next();
};

module.exports = {
    logger,
    auditLog,
    securityLog,
    performanceLog,
    transactionLog,
    payrollLog,
    employeeLog,
    errorLog,
    requestLogger
};