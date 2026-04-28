/**
 * Setup script for Ethiopian Payroll Backend System
 * This script initializes the database and creates default data
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('./src/models/User');
const BankAccount = require('./src/models/BankAccount');
const Employee = require('./src/models/Employee');

const setup = async () => {
    try {
        console.log('🚀 Starting Ethiopian Payroll System Setup...\n');

        // Connect to MongoDB
        console.log('📡 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB\n');

        // Clear existing data (optional - comment out for production)
        console.log('🧹 Clearing existing data...');
        await User.deleteMany({});
        await BankAccount.deleteMany({});
        await Employee.deleteMany({});
        console.log('✅ Existing data cleared\n');

        // Create default users
        console.log('👥 Creating default users...');

        const defaultUsers = [
            {
                fullName: 'HR Manager',
                email: 'hr@company.com',
                password: 'password123',
                role: 'HR'
            },
            {
                fullName: 'Finance Manager',
                email: 'finance@company.com',
                password: 'password123',
                role: 'FINANCE'
            },
            {
                fullName: 'System Administrator',
                email: 'admin@company.com',
                password: 'admin123',
                role: 'HR'
            }
        ];

        for (const userData of defaultUsers) {
            const user = await User.create(userData);
            console.log(`   ✓ Created user: ${user.fullName} (${user.role})`);
        }

        // Create default bank accounts
        console.log('\n🏦 Creating default bank accounts...');

        const defaultAccounts = [
            {
                accountNumber: 'COMPANY-001',
                accountHolder: 'Orbit Mesh Technologies',
                accountType: 'COMPANY',
                balance: 1000000
            },
            {
                accountNumber: 'GOV-001',
                accountHolder: 'Ethiopian Revenue Authority',
                accountType: 'GOVERNMENT',
                balance: 0
            },
            {
                accountNumber: 'PENSION-001',
                accountHolder: 'Ethiopian Pension Fund',
                accountType: 'PENSION',
                balance: 0
            }
        ];

        for (const accountData of defaultAccounts) {
            const account = await BankAccount.create(accountData);
            console.log(`   ✓ Created account: ${account.accountNumber} - ${account.accountHolder}`);
        }

        // Create sample employees
        console.log('\n👨‍💼 Creating sample employees...');

        const sampleEmployees = [
            {
                fullName: 'Abebe Kebede',
                gender: 'MALE',
                employmentType: 'FULL_TIME',
                position: 'Senior Developer',
                employmentDate: new Date('2022-01-15'),
                basicSalary: 15000,
                bankAccountNumber: 'EMP-001-BANK',
                allowances: [
                    { type: 'POSITION', amount: 2000, isTaxable: true },
                    { type: 'TRANSPORT', amount: 800, isTaxable: false }
                ]
            },
            {
                fullName: 'Almaz Tadesse',
                gender: 'FEMALE',
                employmentType: 'FULL_TIME',
                position: 'Project Manager',
                employmentDate: new Date('2021-06-01'),
                basicSalary: 18000,
                bankAccountNumber: 'EMP-002-BANK',
                allowances: [
                    { type: 'POSITION', amount: 3000, isTaxable: true },
                    { type: 'TRANSPORT', amount: 1000, isTaxable: false },
                    { type: 'HOUSING', amount: 2000, isTaxable: false }
                ]
            },
            {
                fullName: 'Dawit Haile',
                gender: 'MALE',
                employmentType: 'FULL_TIME',
                position: 'Accountant',
                employmentDate: new Date('2023-03-01'),
                basicSalary: 12000,
                bankAccountNumber: 'EMP-003-BANK',
                allowances: [
                    { type: 'POSITION', amount: 1500, isTaxable: true },
                    { type: 'TRANSPORT', amount: 600, isTaxable: false }
                ]
            },
            {
                fullName: 'Hanan Mohammed',
                gender: 'FEMALE',
                employmentType: 'PART_TIME',
                position: 'Consultant',
                employmentDate: new Date('2023-08-15'),
                basicSalary: 8000,
                bankAccountNumber: 'EMP-004-BANK',
                allowances: [
                    { type: 'TRANSPORT', amount: 400, isTaxable: false }
                ]
            }
        ];

        for (const employeeData of sampleEmployees) {
            const employee = await Employee.create(employeeData);

            // Create corresponding bank account
            await BankAccount.create({
                accountNumber: employee.bankAccountNumber,
                accountHolder: employee.fullName,
                accountType: 'EMPLOYEE',
                balance: 0,
                employee: employee._id
            });

            console.log(`   ✓ Created employee: ${employee.fullName} (${employee.employeeId}) - ${employee.position}`);
        }

        console.log('\n✅ Setup completed successfully!\n');

        console.log('📋 Default Login Credentials:');
        console.log('   HR Manager:');
        console.log('     Email: hr@company.com');
        console.log('     Password: password123');
        console.log('   Finance Manager:');
        console.log('     Email: finance@company.com');
        console.log('     Password: password123');
        console.log('   System Administrator:');
        console.log('     Email: admin@company.com');
        console.log('     Password: admin123\n');

        console.log('🏦 Default Bank Accounts:');
        console.log('   Company Account: COMPANY-001 (Balance: 1,000,000 ETB)');
        console.log('   Government Account: GOV-001 (Balance: 0 ETB)');
        console.log('   Pension Account: PENSION-001 (Balance: 0 ETB)\n');

        console.log('👥 Sample Employees Created: 4 employees with various positions and allowances\n');

        console.log('🚀 You can now start the server with: npm run dev');
        console.log('🧪 Run API tests with: npm run test:api\n');

    } catch (error) {
        console.error('❌ Setup failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('📡 Disconnected from MongoDB');
        process.exit(0);
    }
};

// Run setup if this file is executed directly
if (require.main === module) {
    setup();
}

module.exports = setup;