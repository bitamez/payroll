const express = require('express');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireHROrFinance } = require('../middlewares/role.middleware');
const {
    generatePayrollReport,
    generateTaxReport,
    generatePensionReport,
    generateEmployeeReport,
    generateTransactionReport,
    generatePayslip
} = require('../controllers/reports.controller');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);
router.use(requireHROrFinance);

// Report generation endpoints
router.post('/payroll', generatePayrollReport);
router.post('/tax', generateTaxReport);
router.post('/pension', generatePensionReport);
router.post('/employee', generateEmployeeReport);
router.post('/transaction', generateTransactionReport);
router.post('/payslip/:payrollId', generatePayslip);

module.exports = router;