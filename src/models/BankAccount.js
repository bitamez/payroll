const mongoose = require('mongoose');

const bankAccountSchema = new mongoose.Schema({
    accountNumber: {
        type: String,
        required: true,
        unique: true
    },
    accountHolder: {
        type: String,
        required: true
    },
    accountType: {
        type: String,
        enum: ['EMPLOYEE', 'COMPANY', 'GOVERNMENT', 'PENSION'],
        required: true
    },
    balance: {
        type: Number,
        default: 0,
        min: 0
    },
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('BankAccount', bankAccountSchema);