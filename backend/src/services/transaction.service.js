const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const BankAccount = require('../models/BankAccount');

/**
 * Process payroll payment with rollback capability
 * @param {Object} payroll - Payroll object with populated employee
 * @returns {Object} - Result object with success status and transaction details
 */
const processPayrollPayment = async (payroll) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const batchId = `BATCH_${Date.now()}_${payroll._id}`;
        const transactions = [];

        // Get required accounts
        const companyAccount = await BankAccount.findOne({ accountNumber: 'COMPANY-001' }).session(session);
        const govAccount = await BankAccount.findOne({ accountNumber: 'GOV-001' }).session(session);
        const employeeAccount = await BankAccount.findOne({
            accountNumber: payroll.employee.bankAccountNumber
        }).session(session);

        if (!companyAccount || !govAccount || !employeeAccount) {
            throw new Error('Required accounts not found');
        }

        // Check company account has sufficient balance
        const totalRequired = payroll.netPay + payroll.incomeTax + payroll.pensionEmployer;
        if (companyAccount.balance < totalRequired) {
            throw new Error(`Insufficient company balance. Required: ${totalRequired}, Available: ${companyAccount.balance}`);
        }

        // 1. Transfer net pay to employee
        if (payroll.netPay > 0) {
            const salaryTransaction = new Transaction({
                fromAccount: companyAccount._id,
                toAccount: employeeAccount._id,
                amount: payroll.netPay,
                transactionType: 'SALARY',
                payroll: payroll._id,
                batchId,
                description: `Salary payment for ${payroll.employee.fullName} - ${payroll.payPeriod.month}/${payroll.payPeriod.year}`,
                status: 'SUCCESS'
            });

            await salaryTransaction.save({ session });
            transactions.push(salaryTransaction);

            // Update balances
            companyAccount.balance -= payroll.netPay;
            employeeAccount.balance += payroll.netPay;
        }

        // 2. Transfer income tax to government
        if (payroll.incomeTax > 0) {
            const taxTransaction = new Transaction({
                fromAccount: companyAccount._id,
                toAccount: govAccount._id,
                amount: payroll.incomeTax,
                transactionType: 'TAX',
                payroll: payroll._id,
                batchId,
                description: `Income tax for ${payroll.employee.fullName} - ${payroll.payPeriod.month}/${payroll.payPeriod.year}`,
                status: 'SUCCESS'
            });

            await taxTransaction.save({ session });
            transactions.push(taxTransaction);

            // Update balances
            companyAccount.balance -= payroll.incomeTax;
            govAccount.balance += payroll.incomeTax;
        }

        // 3. Transfer employer pension contribution
        if (payroll.pensionEmployer > 0) {
            // Find or create pension account
            let pensionAccount = await BankAccount.findOne({ accountNumber: 'PENSION-001' }).session(session);
            if (!pensionAccount) {
                pensionAccount = new BankAccount({
                    accountNumber: 'PENSION-001',
                    accountHolder: 'Ethiopian Pension Fund',
                    accountType: 'PENSION',
                    balance: 0
                });
                await pensionAccount.save({ session });
            }

            const pensionTransaction = new Transaction({
                fromAccount: companyAccount._id,
                toAccount: pensionAccount._id,
                amount: payroll.pensionEmployer,
                transactionType: 'PENSION',
                payroll: payroll._id,
                batchId,
                description: `Employer pension contribution for ${payroll.employee.fullName} - ${payroll.payPeriod.month}/${payroll.payPeriod.year}`,
                status: 'SUCCESS'
            });

            await pensionTransaction.save({ session });
            transactions.push(pensionTransaction);

            // Update balances
            companyAccount.balance -= payroll.pensionEmployer;
            pensionAccount.balance += payroll.pensionEmployer;
        }

        // Save all account balance updates
        await companyAccount.save({ session });
        await employeeAccount.save({ session });
        await govAccount.save({ session });

        // Commit transaction
        await session.commitTransaction();

        return {
            success: true,
            transactions,
            batchId
        };

    } catch (error) {
        // Rollback transaction
        await session.abortTransaction();

        // Mark all transactions in this batch as failed
        await Transaction.updateMany(
            { batchId: `BATCH_${Date.now()}_${payroll._id}` },
            { status: 'ROLLED_BACK', errorMessage: error.message }
        );

        return {
            success: false,
            error: error.message
        };
    } finally {
        session.endSession();
    }
};

/**
 * Rollback a batch of transactions
 * @param {string} batchId - Batch ID to rollback
 * @returns {Object} - Result object with success status
 */
const rollbackTransactionBatch = async (batchId) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        // Get all successful transactions in the batch
        const transactions = await Transaction.find({
            batchId,
            status: 'SUCCESS'
        }).populate('fromAccount toAccount').session(session);

        if (transactions.length === 0) {
            throw new Error('No successful transactions found for this batch');
        }

        // Reverse each transaction
        for (const transaction of transactions) {
            // Reverse the balance changes
            transaction.fromAccount.balance += transaction.amount;
            transaction.toAccount.balance -= transaction.amount;

            // Save account updates
            await transaction.fromAccount.save({ session });
            await transaction.toAccount.save({ session });

            // Update transaction status
            transaction.status = 'ROLLED_BACK';
            await transaction.save({ session });
        }

        await session.commitTransaction();

        return {
            success: true,
            message: `Successfully rolled back ${transactions.length} transactions`,
            transactions
        };

    } catch (error) {
        await session.abortTransaction();

        return {
            success: false,
            error: error.message
        };
    } finally {
        session.endSession();
    }
};

/**
 * Get account transaction history
 * @param {string} accountNumber - Account number
 * @param {Object} options - Query options (limit, skip, fromDate, toDate)
 * @returns {Array} - Array of transactions
 */
const getAccountTransactionHistory = async (accountNumber, options = {}) => {
    try {
        const account = await BankAccount.findOne({ accountNumber });
        if (!account) {
            throw new Error('Account not found');
        }

        const { limit = 50, skip = 0, fromDate, toDate } = options;

        let query = {
            $or: [
                { fromAccount: account._id },
                { toAccount: account._id }
            ],
            status: 'SUCCESS'
        };

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

        return transactions;
    } catch (error) {
        throw error;
    }
};

/**
 * Calculate account balance at a specific date
 * @param {string} accountNumber - Account number
 * @param {Date} date - Date to calculate balance for
 * @returns {number} - Account balance at the specified date
 */
const getAccountBalanceAtDate = async (accountNumber, date) => {
    try {
        const account = await BankAccount.findOne({ accountNumber });
        if (!account) {
            throw new Error('Account not found');
        }

        // Get all transactions up to the specified date
        const transactions = await Transaction.find({
            $or: [
                { fromAccount: account._id },
                { toAccount: account._id }
            ],
            status: 'SUCCESS',
            createdAt: { $lte: date }
        }).sort({ createdAt: 1 });

        let balance = 0;

        transactions.forEach(transaction => {
            if (transaction.toAccount.toString() === account._id.toString()) {
                balance += transaction.amount; // Credit
            } else {
                balance -= transaction.amount; // Debit
            }
        });

        return balance;
    } catch (error) {
        throw error;
    }
};

module.exports = {
    processPayrollPayment,
    rollbackTransactionBatch,
    getAccountTransactionHistory,
    getAccountBalanceAtDate
};