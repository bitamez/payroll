const BankAccount = require('../models/BankAccount');

/**
 * Bank Repository
 * Handles database operations for bank accounts
 */

class BankRepository {
    /**
     * Create a new bank account
     * @param {Object} accountData - Bank account data
     * @returns {Promise<Object>} - Created bank account
     */
    async create(accountData) {
        return await BankAccount.create(accountData);
    }

    /**
     * Find bank account by ID
     * @param {string} id - Bank account ID
     * @param {boolean} populate - Whether to populate employee reference
     * @returns {Promise<Object|null>} - Bank account or null
     */
    async findById(id, populate = false) {
        let query = BankAccount.findById(id);

        if (populate) {
            query = query.populate('employee', 'fullName employeeId position');
        }

        return await query;
    }

    /**
     * Find bank account by account number
     * @param {string} accountNumber - Account number
     * @param {boolean} populate - Whether to populate employee reference
     * @returns {Promise<Object|null>} - Bank account or null
     */
    async findByAccountNumber(accountNumber, populate = false) {
        let query = BankAccount.findOne({ accountNumber });

        if (populate) {
            query = query.populate('employee', 'fullName employeeId position');
        }

        return await query;
    }

    /**
     * Find all bank accounts with filters
     * @param {Object} options - Query options
     * @returns {Promise<Array>} - Array of bank accounts
     */
    async findAll(options = {}) {
        const {
            accountType,
            isActive,
            sortBy = 'accountType',
            sortOrder = 'asc'
        } = options;

        let query = {};

        if (accountType) query.accountType = accountType;
        if (isActive !== undefined) query.isActive = isActive;

        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        return await BankAccount.find(query)
            .populate('employee', 'fullName employeeId position')
            .sort(sort);
    }

    /**
     * Find accounts by type
     * @param {string} accountType - Account type
     * @param {boolean} activeOnly - Whether to return only active accounts
     * @returns {Promise<Array>} - Array of bank accounts
     */
    async findByType(accountType, activeOnly = true) {
        let query = { accountType };

        if (activeOnly) {
            query.isActive = true;
        }

        return await BankAccount.find(query)
            .populate('employee', 'fullName employeeId position')
            .sort({ accountNumber: 1 });
    }

    /**
     * Find account by employee
     * @param {string} employeeId - Employee ID
     * @returns {Promise<Object|null>} - Bank account or null
     */
    async findByEmployee(employeeId) {
        return await BankAccount.findOne({
            employee: employeeId,
            accountType: 'EMPLOYEE',
            isActive: true
        }).populate('employee', 'fullName employeeId position');
    }

    /**
     * Update bank account by ID
     * @param {string} id - Bank account ID
     * @param {Object} updateData - Update data
     * @returns {Promise<Object|null>} - Updated bank account or null
     */
    async updateById(id, updateData) {
        return await BankAccount.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );
    }

    /**
     * Update account balance
     * @param {string} accountId - Account ID
     * @param {number} amount - Amount to add/subtract (positive for credit, negative for debit)
     * @returns {Promise<Object|null>} - Updated bank account or null
     */
    async updateBalance(accountId, amount) {
        return await BankAccount.findByIdAndUpdate(
            accountId,
            { $inc: { balance: amount } },
            { new: true, runValidators: true }
        );
    }

    /**
     * Update balance by account number
     * @param {string} accountNumber - Account number
     * @param {number} amount - Amount to add/subtract
     * @returns {Promise<Object|null>} - Updated bank account or null
     */
    async updateBalanceByAccountNumber(accountNumber, amount) {
        return await BankAccount.findOneAndUpdate(
            { accountNumber },
            { $inc: { balance: amount } },
            { new: true, runValidators: true }
        );
    }

    /**
     * Deactivate bank account
     * @param {string} id - Bank account ID
     * @returns {Promise<Object|null>} - Updated bank account or null
     */
    async deactivate(id) {
        return await BankAccount.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        );
    }

    /**
     * Activate bank account
     * @param {string} id - Bank account ID
     * @returns {Promise<Object|null>} - Updated bank account or null
     */
    async activate(id) {
        return await BankAccount.findByIdAndUpdate(
            id,
            { isActive: true },
            { new: true }
        );
    }

    /**
     * Get account balance
     * @param {string} accountNumber - Account number
     * @returns {Promise<number|null>} - Account balance or null
     */
    async getBalance(accountNumber) {
        const account = await BankAccount.findOne({ accountNumber });
        return account ? account.balance : null;
    }

    /**
     * Check if account has sufficient balance
     * @param {string} accountNumber - Account number
     * @param {number} amount - Amount to check
     * @returns {Promise<boolean>} - Whether account has sufficient balance
     */
    async hasSufficientBalance(accountNumber, amount) {
        const account = await BankAccount.findOne({ accountNumber });
        return account ? account.balance >= amount : false;
    }

    /**
     * Get account statistics
     * @returns {Promise<Object>} - Account statistics
     */
    async getStatistics() {
        const stats = await BankAccount.aggregate([
            {
                $group: {
                    _id: '$accountType',
                    count: { $sum: 1 },
                    totalBalance: { $sum: '$balance' },
                    avgBalance: { $avg: '$balance' },
                    activeCount: {
                        $sum: { $cond: ['$isActive', 1, 0] }
                    }
                }
            }
        ]);

        const overallStats = await BankAccount.aggregate([
            {
                $group: {
                    _id: null,
                    totalAccounts: { $sum: 1 },
                    totalBalance: { $sum: '$balance' },
                    activeAccounts: {
                        $sum: { $cond: ['$isActive', 1, 0] }
                    },
                    inactiveAccounts: {
                        $sum: { $cond: ['$isActive', 0, 1] }
                    }
                }
            }
        ]);

        return {
            byType: stats,
            overall: overallStats[0] || {}
        };
    }

    /**
     * Find accounts with low balance
     * @param {number} threshold - Balance threshold
     * @returns {Promise<Array>} - Array of accounts with low balance
     */
    async findLowBalanceAccounts(threshold = 1000) {
        return await BankAccount.find({
            balance: { $lt: threshold },
            isActive: true,
            accountType: { $in: ['COMPANY', 'EMPLOYEE'] }
        })
            .populate('employee', 'fullName employeeId')
            .sort({ balance: 1 });
    }

    /**
     * Get company account
     * @returns {Promise<Object|null>} - Company account or null
     */
    async getCompanyAccount() {
        return await BankAccount.findOne({
            accountType: 'COMPANY',
            isActive: true
        });
    }

    /**
     * Get government account
     * @returns {Promise<Object|null>} - Government account or null
     */
    async getGovernmentAccount() {
        return await BankAccount.findOne({
            accountType: 'GOVERNMENT',
            isActive: true
        });
    }

    /**
     * Get pension account
     * @returns {Promise<Object|null>} - Pension account or null
     */
    async getPensionAccount() {
        return await BankAccount.findOne({
            accountType: 'PENSION',
            isActive: true
        });
    }

    /**
     * Create employee account
     * @param {Object} employeeData - Employee data
     * @returns {Promise<Object>} - Created bank account
     */
    async createEmployeeAccount(employeeData) {
        return await BankAccount.create({
            accountNumber: employeeData.bankAccountNumber,
            accountHolder: employeeData.fullName,
            accountType: 'EMPLOYEE',
            balance: 0,
            employee: employeeData._id,
            isActive: true
        });
    }

    /**
     * Update employee account holder name
     * @param {string} employeeId - Employee ID
     * @param {string} newName - New account holder name
     * @returns {Promise<Object|null>} - Updated bank account or null
     */
    async updateEmployeeAccountHolder(employeeId, newName) {
        return await BankAccount.findOneAndUpdate(
            { employee: employeeId, accountType: 'EMPLOYEE' },
            { accountHolder: newName },
            { new: true }
        );
    }

    /**
     * Get account transaction summary
     * @param {string} accountId - Account ID
     * @param {Object} dateRange - Date range {from, to}
     * @returns {Promise<Object>} - Transaction summary
     */
    async getAccountTransactionSummary(accountId, dateRange = {}) {
        const Transaction = require('../models/Transaction');

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

        const summary = await Transaction.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalTransactions: { $sum: 1 },
                    totalCredits: {
                        $sum: {
                            $cond: [
                                { $eq: ['$toAccount', accountId] },
                                '$amount',
                                0
                            ]
                        }
                    },
                    totalDebits: {
                        $sum: {
                            $cond: [
                                { $eq: ['$fromAccount', accountId] },
                                '$amount',
                                0
                            ]
                        }
                    },
                    creditCount: {
                        $sum: {
                            $cond: [
                                { $eq: ['$toAccount', accountId] },
                                1,
                                0
                            ]
                        }
                    },
                    debitCount: {
                        $sum: {
                            $cond: [
                                { $eq: ['$fromAccount', accountId] },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        return summary[0] || {
            totalTransactions: 0,
            totalCredits: 0,
            totalDebits: 0,
            creditCount: 0,
            debitCount: 0
        };
    }
}

module.exports = new BankRepository();