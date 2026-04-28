const express = require('express');
const { validate, schemas } = require('../utils/validator');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireHROrFinance, requireHR } = require('../middlewares/role.middleware');
const {
    createEmployee,
    getEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee,
    addAllowance,
    addDeduction
} = require('../controllers/employee.controller');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Routes accessible by both HR and Finance
router.get('/', requireHROrFinance, getEmployees);
router.get('/:id', requireHROrFinance, getEmployeeById);

// Routes accessible only by HR
router.post('/', requireHR, validate(schemas.employee), createEmployee);
router.put('/:id', requireHR, validate(schemas.updateEmployee), updateEmployee);
router.delete('/:id', requireHR, deleteEmployee);

// Allowance and deduction management (HR only)
router.post('/:id/allowances', requireHR, addAllowance);
router.post('/:id/deductions', requireHR, addDeduction);

module.exports = router;