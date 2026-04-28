const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Initialize default accounts
        await initializeDefaultAccounts();
    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1);
    }
};

const initializeDefaultAccounts = async () => {
    const BankAccount = require('../models/BankAccount');

    try {
        // Check if default accounts exist
        const companyAccount = await BankAccount.findOne({ accountNumber: 'COMPANY-001' });
        const govAccount = await BankAccount.findOne({ accountNumber: 'GOV-001' });

        if (!companyAccount) {
            await BankAccount.create({
                accountNumber: 'COMPANY-001',
                accountHolder: 'Orbit Mesh Technologies',
                balance: 1000000,
                accountType: 'COMPANY'
            });
            console.log('Company account initialized');
        }

        if (!govAccount) {
            await BankAccount.create({
                accountNumber: 'GOV-001',
                accountHolder: 'Ethiopian Revenue Authority',
                balance: 0,
                accountType: 'GOVERNMENT'
            });
            console.log('Government account initialized');
        }
    } catch (error) {
        console.error('Error initializing default accounts:', error);
    }
};

module.exports = connectDB;