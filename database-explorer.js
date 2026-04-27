/**
 * Database Explorer Script
 * This script helps you understand your payroll database structure and data
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import all models
const User = require('./src/models/User');
const Employee = require('./src/models/Employee');
const Payroll = require('./src/models/Payroll');
const BankAccount = require('./src/models/BankAccount');
const Transaction = require('./src/models/Transaction');
const AuditLog = require('./src/models/AuditLog');

const exploreDatabase = async () => {
    try {
        console.log('🔍 Exploring Ethiopian Payroll Database');
        console.log('=====================================\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // 1. Show all collections
        console.log('📊 DATABASE COLLECTIONS:');
        console.log('========================');
        const collections = await mongoose.connection.db.listCollections().toArray();
        collections.forEach(collection => {
            console.log(`   📁 ${collection.name}`);
        });
        console.log('');

        // 2. Users Analysis
        console.log('👥 USERS ANALYSIS:');
        console.log('==================');
        const users = await User.find({});
        console.log(`   Total Users: ${users.length}`);
        users.forEach(user => {
            console.log(`   • ${user.fullName} (${user.role}) - ${user.email}`);
        });
        console.log('');

        // 3. Employees Analysis
        console.log('👨‍💼 EMPLOYEES ANALYSIS:');
        console.log('=======================');
        const employees = await Employee.find({});
        console.log(`   Total Employees: ${employees.length}`);

        const employeeStats = {
            byStatus: {},
            byEmploymentType: {},
            byPosition: {},
            totalSalary: 0
        };

        employees.forEach(emp => {
            employeeStats.byStatus[emp.status] = (employeeStats.byStatus[emp.status] || 0) + 1;
            employeeStats.byEmploymentType[emp.employmentType] = (employeeStats.byEmploymentType[emp.employmentType] || 0) + 1;
            employeeStats.byPosition[emp.position] = (employeeStats.byPosition[emp.position] || 0) + 1;
            employeeStats.totalSalary += emp.basicSalary;

            console.log(`   • ${emp.fullName} (${emp.employeeId})`);
            console.log(`     Position: ${emp.position}`);
            console.log(`     Salary: ${emp.basicSalary.toLocaleString()} ETB`);
            console.log(`     Status: ${emp.status}`);
            console.log(`     Allowances: ${emp.allowances.length}`);
            console.log('');
        });

        console.log('   📈 EMPLOYEE STATISTICS:');
        console.log('   By Status:', employeeStats.byStatus);
        console.log('   By Employment Type:', employeeStats.byEmploymentType);
        console.log('   By Position:', employeeStats.byPosition);
        console.log(`   Total Salary Budget: ${employeeStats.totalSalary.toLocaleString()} ETB\n`);

        // 4. Payroll Analysis
        console.log('💰 PAYROLL ANALYSIS:');
        console.log('====================');
        const payrolls = await Payroll.find({}).populate('employee', 'fullName employeeId');
        console.log(`   Total Payroll Records: ${payrolls.length}`);

        if (payrolls.length > 0) {
            const payrollStats = {
                byStatus: {},
                totalGrossPay: 0,
                totalNetPay: 0,
                totalTax: 0,
                totalPension: 0
            };

            payrolls.forEach(payroll => {
                payrollStats.byStatus[payroll.status] = (payrollStats.byStatus[payroll.status] || 0) + 1;
                payrollStats.totalGrossPay += payroll.grossPay;
                payrollStats.totalNetPay += payroll.netPay;
                payrollStats.totalTax += payroll.incomeTax;
                payrollStats.totalPension += (payroll.pensionEmployee + payroll.pensionEmployer);

                console.log(`   • ${payroll.employee.fullName} (${payroll.payPeriod.month}/${payroll.payPeriod.year})`);
                console.log(`     Gross Pay: ${payroll.grossPay.toLocaleString()} ETB`);
                console.log(`     Net Pay: ${payroll.netPay.toLocaleString()} ETB`);
                console.log(`     Tax: ${payroll.incomeTax.toLocaleString()} ETB`);
                console.log(`     Status: ${payroll.status}`);
                console.log('');
            });

            console.log('   📈 PAYROLL STATISTICS:');
            console.log('   By Status:', payrollStats.byStatus);
            console.log(`   Total Gross Pay: ${payrollStats.totalGrossPay.toLocaleString()} ETB`);
            console.log(`   Total Net Pay: ${payrollStats.totalNetPay.toLocaleString()} ETB`);
            console.log(`   Total Tax: ${payrollStats.totalTax.toLocaleString()} ETB`);
            console.log(`   Total Pension: ${payrollStats.totalPension.toLocaleString()} ETB\n`);
        }

        // 5. Bank Accounts Analysis
        console.log('🏦 BANK ACCOUNTS ANALYSIS:');
        console.log('==========================');
        const bankAccounts = await BankAccount.find({}).populate('employee', 'fullName employeeId');
        console.log(`   Total Bank Accounts: ${bankAccounts.length}`);

        const accountStats = {
            byType: {},
            totalBalance: 0
        };

        bankAccounts.forEach(account => {
            accountStats.byType[account.accountType] = (accountStats.byType[account.accountType] || 0) + 1;
            accountStats.totalBalance += account.balance;

            console.log(`   • ${account.accountNumber} - ${account.accountHolder}`);
            console.log(`     Type: ${account.accountType}`);
            console.log(`     Balance: ${account.balance.toLocaleString()} ETB`);
            console.log(`     Status: ${account.isActive ? 'Active' : 'Inactive'}`);
            console.log('');
        });

        console.log('   📈 ACCOUNT STATISTICS:');
        console.log('   By Type:', accountStats.byType);
        console.log(`   Total System Balance: ${accountStats.totalBalance.toLocaleString()} ETB\n`);

        // 6. Transactions Analysis
        console.log('💸 TRANSACTIONS ANALYSIS:');
        console.log('=========================');
        const transactions = await Transaction.find({})
            .populate('fromAccount', 'accountNumber accountHolder')
            .populate('toAccount', 'accountNumber accountHolder')
            .sort({ createdAt: -1 })
            .limit(10);

        console.log(`   Recent Transactions (Last 10):`);
        if (transactions.length === 0) {
            console.log('   No transactions found (Payment processing requires MongoDB replica set)\n');
        } else {
            transactions.forEach(txn => {
                console.log(`   • ${txn.transactionId} - ${txn.transactionType}`);
                console.log(`     Amount: ${txn.amount.toLocaleString()} ETB`);
                console.log(`     From: ${txn.fromAccount.accountHolder}`);
                console.log(`     To: ${txn.toAccount.accountHolder}`);
                console.log(`     Status: ${txn.status}`);
                console.log(`     Date: ${txn.createdAt.toLocaleDateString()}`);
                console.log('');
            });
        }

        // 7. Audit Logs Analysis
        console.log('📋 AUDIT LOGS ANALYSIS:');
        console.log('=======================');
        const auditLogs = await AuditLog.find({})
            .populate('userId', 'fullName role')
            .sort({ createdAt: -1 })
            .limit(10);

        console.log(`   Recent Audit Logs (Last 10):`);
        if (auditLogs.length === 0) {
            console.log('   No audit logs found\n');
        } else {
            auditLogs.forEach(log => {
                console.log(`   • ${log.action} on ${log.resourceType}`);
                console.log(`     User: ${log.userId?.fullName || 'Unknown'} (${log.userRole})`);
                console.log(`     Description: ${log.description}`);
                console.log(`     Date: ${log.createdAt.toLocaleDateString()}`);
                console.log('');
            });
        }

        // 8. Database Health Check
        console.log('🔍 DATABASE HEALTH CHECK:');
        console.log('=========================');
        const dbStats = await mongoose.connection.db.stats();
        console.log(`   Database: ${mongoose.connection.name}`);
        console.log(`   Collections: ${dbStats.collections}`);
        console.log(`   Documents: ${dbStats.objects.toLocaleString()}`);
        console.log(`   Data Size: ${(dbStats.dataSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Storage Size: ${(dbStats.storageSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Indexes: ${dbStats.indexes}`);
        console.log('');

        console.log('✅ Database exploration completed successfully!');

    } catch (error) {
        console.error('❌ Database exploration failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('📡 Disconnected from MongoDB');
        process.exit(0);
    }
};

// Run exploration if this file is executed directly
if (require.main === module) {
    exploreDatabase();
}

module.exports = exploreDatabase;