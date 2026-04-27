const express = require('express');
const { validate, schemas } = require('../utils/validator');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireHROrFinance, requireFinance } = require('../middlewares/role.middleware');
const {
    getTransactions,
    getTransactionById,
    getTransactionsByBatch,
    getAccountBalance,
    getBankAccounts,
    createManualTransaction,
    getTransactionSummary
} = require('../controllers/transaction.controller');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Routes accessible by both HR and Finance
router.get('/', requireHROrFinance, getTransactions);
router.get('/summary', requireHROrFinance, getTransactionSummary);
router.get('/batch/:batchId', requireHROrFinance, getTransactionsByBatch);
router.get('/accounts', requireHROrFinance, getBankAccounts);
router.get('/accounts/:accountNumber/balance', requireHROrFinance, getAccountBalance);
router.get('/:id', requireHROrFinance, getTransactionById);

// Routes accessible only by Finance
router.post('/manual', requireFinance, validate(schemas.transaction), createManualTransaction);

module.exports = router;