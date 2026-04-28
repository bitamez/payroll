const Transaction = require('../models/Transaction');

/**
 * Transaction Repository
 * Handles database operations for transactions
 */

class TransactionRepository {
    /**
     * Create a new transaction
     * @param {Object} transactionData - Transaction data
     * @returns {Promise<Object>} - Created transaction
     */
    async create(transactionData) {
        return await Transaction.create(transactionData);
    }

    /**
     * Find transaction by ID
     * @param {string} id - Transaction ID
     * @param {boolean} populate - Whether to populate references
     * @returns {Promise<Object|null>} - Transaction or null
     */
    async findById(id, populate = true) {
        let query = Transaction.findById(id);

        if (populate) {
            query = query
                .populate('fromAccount', 'accountNumber accountHolder accountType')
                .populate('toAccount', 'accountNumber accountHolder accountType')
                .populate('payroll', 'employee payPeriod netPay');
        }

        return await query;
    }

    /**
     * Find transaction by transaction ID
     * @param {string} transactionId - Transaction ID string
     * @returns {Promise<Object|null>} - Transaction or null
     */
    async findByTransactionId(transactionId) {
        return await Transaction.findOne({ transactionId })
            .populate('fromAccount', 'accountNumber accountHolder accountType')
            .populate('toAccount', 'accountNumber accountHolder accountType')
            .populate('payroll', 'employee payPeriod');
    }

    /**
     * Find all transactions with pagination and filters
     * @param {Object} options - Query options
     * @returns {Promise<Object>} - Transactions with pagination info
     */
    async findAll(options = {}) {
        const {
            page = 1,
            limit = 10,
            status,
            transactionType,
            fromDate,
            toDate,
            batchId,
            fromAccount,
            toAccount,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = options;

        const skip = (page - 1) * limit;
        let query = {};

        // Add filters
        if (status) query.status = status;
        if (transactionType) query.transactionType = transactionType;
        if (batchId) query.batchId = batchId;
        if (fromAccount) query.fromAccount = fromAccount;
        if (toAccount) query.toAccount = toAccount;

        if (fromDate || toDate) {
            query.createdAt = {};
            if (fromDate) query.createdAt.$gte = new Date(fromDate);
            if (toDate) query.createdAt.$lte = new Date(toDate);
        }

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const [transactions, total] = await Promise.all([
            Transaction.find(query)
                .populate('fromAccount', 'accountNumber accountHolder accountType')
                .populate('toAccount', 'accountNumber accountHolder accountType')
                .populate('payroll', 'employee payPeriod')
                .sort(sort)
                .skip(skip)
                .limit(limit),
            Transaction.countDocuments(query)
        ]);

        return {
            transactions,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Find transactions by batch ID
     * @param {string} batchId - Batch ID
     * @param {boolean} populate - Whether to populate references
     * @returns {Promise<Array>} - Array of transactions
     */
    async findByBatchId(batchId, populate = true) {
        let query = Transaction.find({ batchId });

        if (populate) {
            query = query
                .populate('fromAccount', 'accountNumber accountHolder accountType')
                .populate('toAccount', 'accountNumber accountHolder accountType')
                .populate('payroll', 'employee payPeriod');
        }

        return await query.sort({ createdAt: 1 });
    }

    /**
     * Find transactions by account
     * @param {string} accountId - Account ID
     * @param {Object} options - Query options
     * @returns {Promise<Array>} - Array of transactions
     */
    async findByAccount(accountId, options = {}) {
        const {
            status = 'SUCCESS',
            fromDate,
            toDate,
            limit,
            transactionType
        } = options;

        let query = {
            $or: [
                { fromAccount: accountId },
                { toAccount: accountId }
            ],
            status
        };

        if (transactionType) query.transactionType = transactionType;

        if (fromDate || toDate) {
            query.createdAt = {};
            if (fromDate) query.createdAt.$gte = new Date(fromDate);
            if (toDate) query.createdAt.$lte = new Date(toDate);
        }

        let transactionQuery = Transaction.find(query)
            .populate('fromAccount', 'accountNumber accountHolder accountType')
            .populate('toAccount', 'accountNumber accountHolder accountType')
            .populate('payroll', 'employee payPeriod')
            .sort({ createdAt: -1 });

        if (limit) {
            transactionQuery = transactionQuery.limit(limit);
        }

        return await transactionQuery;
    }

    /**
     * Find transactions by payroll
     * @param {string} payrollId - Payroll ID
     * @returns {Promise<Array>} - Array of transactions
     */
    async findByPayroll(payrollId) {
        return await Transaction.find({ payroll: payrollId })
            .populate('fromAccount', 'accountNumber accountHolder accountType')
            .populate('toAccount', 'accountNumber accountHolder accountType')
            .sort({ createdAt: 1 });
    }

    /**
     * Update transaction by ID
     * @param {string} id - Transaction ID
     * @param {Object} updateData - Update data
     * @returns {Promise<Object|null>} - Updated transaction or null
     */
    async updateById(id, updateData) {
        return await Transaction.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );
    }

    /**
     * Update transaction status
     * @param {string} id - Transaction ID
     * @param {string} status - New status
     * @param {string} errorMessage - Error message (optional)
     * @returns {Promise<Object|null>} - Updated transaction or null
     */
    async updateStatus(id, status, errorMessage = null) {
        const updateData = { status };
        if (errorMessage) {
            updateData.errorMessage = errorMessage;
        }

        return await Transaction.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );
    }

    /**
     * Bulk update transaction status by batch ID
     * @param {string} batchId - Batch ID
     * @param {string} status - New status
     * @param {string} errorMessage - Error message (optional)
     * @returns {Promise<Object>} - Update result
     */
    async bulkUpdateStatusByBatch(batchId, status, errorMessage = null) {
        const updateData = { status };
        if (errorMessage) {
            updateData.errorMessage = errorMessage;
        }

        return await Transaction.updateMany(
            { batchId },
            updateData
        );
    }

    /**
     * Get transaction statistics
     * @param {Object} filters - Optional filters
     * @returns {Promise<Object>} - Transaction statistics
     */
    async getStatistics(filters = {}) {
        let matchStage = {};

        if (filters.fromDate || filters.toDate) {
            matchStage.createdAt = {};
            if (filters.fromDate) matchStage.createdAt.$gte = new Date(filters.fromDate);
            if (filters.toDate) matchStage.createdAt.$lte = new Date(filters.toDate);
        }

        if (filters.status) matchStage.status = filters.status;

        const stats = await Transaction.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$transactionType',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' },
                    avgAmount: { $avg: '$amount' },
                    successCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'SUCCESS'] }, 1, 0] }
                    },
                    failedCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] }
                    }
                }
            }
        ]);

        const statusStats = await Transaction.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        const overallStats = await Transaction.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalTransactions: { $sum: 1 },
                    totalAmount: { $sum: '$amount' },
                    avgAmount: { $avg: '$amount' },
                    successRate: {
                        $avg: { $cond: [{ $eq: ['$status', 'SUCCESS'] }, 1, 0] }
                    }
                }
            }
        ]);

        return {
            byType: stats,
            byStatus: statusStats,
            overall: overallStats[0] || {}
        };
    }

    /**
     * Get daily transaction summary
     * @param {Object} dateRange - Date range {from, to}
     * @returns {Promise<Array>} - Daily transaction summary
     */
    async getDailySummary(dateRange = {}) {
        let matchStage = { status: 'SUCCESS' };

        if (dateRange.from || dateRange.to) {
            matchStage.createdAt = {};
            if (dateRange.from) matchStage.createdAt.$gte = new Date(dateRange.from);
            if (dateRange.to) matchStage.createdAt.$lte = new Date(dateRange.to);
        }

        return await Transaction.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' },
                    salaryTransactions: {
                        $sum: { $cond: [{ $eq: ['$transactionType', 'SALARY'] }, 1, 0] }
                    },
                    taxTransactions: {
                        $sum: { $cond: [{ $eq: ['$transactionType', 'TAX'] }, 1, 0] }
                    },
                    pensionTransactions: {
                        $sum: { $cond: [{ $eq: ['$transactionType', 'PENSION'] }, 1, 0] }
                    }
                }
            },
            {
                $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 }
            },
            {
                $limit: 30
            }
        ]);
    }

    /**
     * Find failed transactions
     * @param {Object} options - Query options
     * @returns {Promise<Array>} - Array of failed transactions
     */
    async findFailedTransactions(options = {}) {
        const { limit = 50, fromDate, toDate } = options;

        let query = { status: 'FAILED' };

        if (fromDate || toDate) {
            query.createdAt = {};
            if (fromDate) query.createdAt.$gte = new Date(fromDate);
            if (toDate) query.createdAt.$lte = new Date(toDate);
        }

        return await Transaction.find(query)
            .populate('fromAccount', 'accountNumber accountHolder accountType')
            .populate('toAccount', 'accountNumber accountHolder accountType')
            .populate('payroll', 'employee payPeriod')
            .sort({ createdAt: -1 })
            .limit(limit);
    }

    /**
     * Find pending transactions
     * @param {number} limit - Limit number of results
     * @returns {Promise<Array>} - Array of pending transactions
     */
    async findPendingTransactions(limit = 50) {
        return await Transaction.find({ status: 'PENDING' })
            .populate('fromAccount', 'accountNumber accountHolder accountType')
            .populate('toAccount', 'accountNumber accountHolder accountType')
            .populate('payroll', 'employee payPeriod')
            .sort({ createdAt: 1 })
            .limit(limit);
    }

    /**
     * Get account balance changes over time
     * @param {string} accountId - Account ID
     * @param {Object} dateRange - Date range {from, to}
     * @returns {Promise<Array>} - Balance changes over time
     */
    async getAccountBalanceHistory(accountId, dateRange = {}) {
        let matchStage = {
            $or: [
                { fromAccount: accountId },
                { toAccount: accountId }
            ],
            status: 'SUCCESS'
        };

        if (dateRange.from || dateRange.to) {
            matchStage.createdAt = {};
            if (dateRange.from) matchStage.createdAt.$gte = new Date(dateRange.from);
            if (dateRange.to) matchStage.createdAt.$lte = new Date(dateRange.to);
        }

        const transactions = await Transaction.find(matchStage)
            .sort({ createdAt: 1 })
            .select('amount createdAt fromAccount toAccount transactionType');

        let runningBalance = 0;
        const balanceHistory = [];

        transactions.forEach(transaction => {
            const isCredit = transaction.toAccount.toString() === accountId.toString();
            const change = isCredit ? transaction.amount : -transaction.amount;
            runningBalance += change;

            balanceHistory.push({
                date: transaction.createdAt,
                transactionType: transaction.transactionType,
                change,
                balance: runningBalance,
                isCredit
            });
        });

        return balanceHistory;
    }

    /**
     * Get transaction volume by hour
     * @param {Date} date - Specific date
     * @returns {Promise<Array>} - Transaction volume by hour
     */
    async getHourlyVolume(date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        return await Transaction.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfDay, $lte: endOfDay },
                    status: 'SUCCESS'
                }
            },
            {
                $group: {
                    _id: { $hour: '$createdAt' },
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            },
            {
                $sort: { '_id': 1 }
            }
        ]);
    }
}

module.exports = new TransactionRepository();