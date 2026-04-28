const express = require('express');
const { validate, schemas } = require('../utils/validator');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireHROrFinance, requireHR, requireFinance } = require('../middlewares/role.middleware');
const {
    createPayroll,
    getPayrolls,
    getPayrollById,
    updatePayroll,
    approvePayroll,
    processPayment,
    deletePayroll
} = require('../controllers/payroll.controller');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Routes accessible by both HR and Finance
router.get('/', requireHROrFinance, getPayrolls);
router.get('/:id', requireHROrFinance, getPayrollById);

// Routes accessible only by HR
router.post('/', requireHR, validate(schemas.payroll), createPayroll);
router.put('/:id', requireHR, updatePayroll);
router.delete('/:id', requireHR, deletePayroll);

// Routes accessible only by Finance
router.post('/:id/approve', requireFinance, approvePayroll);
router.post('/:id/process-payment', requireFinance, processPayment);

module.exports = router;