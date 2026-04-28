const Transaction = require('../models/Transaction');
const BankAccount = require('../models/BankAccount');

/**
 * Get all transactions with pagination and filters
 */
const getTransactions = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const { status, type, fromDate, toDate, batchId } = req.query;

        // Build query
        let query = {};

        if (status) query.status = status;
        if (type) query.transactionType = type;
        if (batchId) query.batchId = batchId;

        if (fromDate || toDate) {
            query.createdAt = {};
            if (fromDate) query.createdAt.$gte = new Date(fromDate);
            if (toDate) query.createdAt.$lte = new Date(toDate);
        }

        const transactions = await Transaction.find(query)
            .populate('fromAccount', 'accountNumber accountHolder accountType')
            .populate('toAccount', 'accountNumber accountHolder accountType')
            .populate('payroll', 'employee payPeriod')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Transaction.countDocuments(query);

        res.json({
            success: true,
            data: {
                transactions,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get transaction by ID
 */
const getTransactionById = async (req, res, next) => {
    try {
        const transaction = await Transaction.findById(req.params.id)
            .populate('fromAccount', 'accountNumber accountHolder accountType balance')
            .populate('toAccount', 'accountNumber accountHolder accountType balance')
            .populate('payroll', 'employee payPeriod netPay');

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        res.json({
            success: true,
            data: { transaction }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get transactions by batch ID
 */
const getTransactionsByBatch = async (req, res, next) => {
    try {
        const { batchId } = req.params;

        const transactions = await Transaction.find({ batchId })
            .populate('fromAccount', 'accountNumber accountHolder accountType')
            .populate('toAccount', 'accountNumber accountHolder accountType')
            .populate('payroll', 'employee payPeriod')
            .sort({ createdAt: 1 });

        res.json({
            success: true,
            data: { transactions }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get account balance
 */
const getAccountBalance = async (req, res, next) => {
    try {
        const { accountNumber } = req.params;

        const account = await BankAccount.findOne({ accountNumber });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Account not found'
            });
        }

        res.json({
            success: true,
            data: {
                account: {
                    accountNumber: account.accountNumber,
                    accountHolder: account.accountHolder,
                    accountType: account.accountType,
                    balance: account.balance,
                    isActive: account.isActive
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all bank accounts
 */
const getBankAccounts = async (req, res, next) => {
    try {
        const { type, isActive } = req.query;

        let query = {};
        if (type) query.accountType = type;
        if (isActive !== undefined) query.isActive = isActive === 'true';

        const accounts = await BankAccount.find(query)
            .populate('employee', 'fullName employeeId')
            .sort({ accountType: 1, accountNumber: 1 });

        res.json({
            success: true,
            data: { accounts }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create manual transaction (for testing or corrections)
 */
const createManualTransaction = async (req, res, next) => {
    try {
        const { fromAccountNumber, toAccountNumber, amount, transactionType, description } = req.body;

        // Find accounts
        const fromAccount = await BankAccount.findOne({ accountNumber: fromAccountNumber });
        const toAccount = await BankAccount.findOne({ accountNumber: toAccountNumber });

        if (!fromAccount || !toAccount) {
            return res.status(404).json({
                success: false,
                message: 'One or both accounts not found'
            });
        }

        // Check sufficient balance
        if (fromAccount.balance < amount) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient balance in source account'
            });
        }

        // Create transaction
        const transaction = await Transaction.create({
            fromAccount: fromAccount._id,
            toAccount: toAccount._id,
            amount,
            transactionType,
            description,
            status: 'PENDING'
        });

        // Update balances
        fromAccount.balance -= amount;
        toAccount.balance += amount;

        await fromAccount.save();
        await toAccount.save();

        transaction.status = 'SUCCESS';
        await transaction.save();

        await transaction.populate('fromAccount', 'accountNumber accountHolder');
        await transaction.populate('toAccount', 'accountNumber accountHolder');

        res.status(201).json({
            success: true,
            message: 'Manual transaction created successfully',
            data: { transaction }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get transaction summary/statistics
 */
const getTransactionSummary = async (req, res, next) => {
    try {
        const { fromDate, toDate } = req.query;

        let dateFilter = {};
        if (fromDate || toDate) {
            dateFilter.createdAt = {};
            if (fromDate) dateFilter.createdAt.$gte = new Date(fromDate);
            if (toDate) dateFilter.createdAt.$lte = new Date(toDate);
        }

        const summary = await Transaction.aggregate([
            { $match: { status: 'SUCCESS', ...dateFilter } },
            {
                $group: {
                    _id: '$transactionType',
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const totalTransactions = await Transaction.countDocuments({
            status: 'SUCCESS',
            ...dateFilter
        });

        const totalAmount = await Transaction.aggregate([
            { $match: { status: 'SUCCESS', ...dateFilter } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        res.json({
            success: true,
            data: {
                summary,
                totalTransactions,
                totalAmount: totalAmount[0]?.total || 0
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getTransactions,
    getTransactionById,
    getTransactionsByBatch,
    getAccountBalance,
    getBankAccounts,
    createManualTransaction,
    getTransactionSummary
};