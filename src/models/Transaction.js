const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
        unique: true
    },
    fromAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BankAccount',
        required: true
    },
    toAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BankAccount',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    transactionType: {
        type: String,
        enum: ['SALARY', 'TAX', 'PENSION', 'ALLOWANCE', 'DEDUCTION'],
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'SUCCESS', 'FAILED', 'ROLLED_BACK'],
        default: 'PENDING'
    },
    payroll: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payroll'
    },
    batchId: {
        type: String
    },
    description: {
        type: String
    },
    errorMessage: {
        type: String
    }
}, {
    timestamps: true
});

// Generate transaction ID before saving
transactionSchema.pre('save', async function (next) {
    if (!this.transactionId) {
        const count = await mongoose.model('Transaction').countDocuments();
        this.transactionId = `TXN${Date.now()}${String(count + 1).padStart(4, '0')}`;
    }
    next();
});

module.exports = mongoose.model('Transaction', transactionSchema);