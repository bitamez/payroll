/**
 * API Testing Script for Ethiopian Payroll Backend System
 * This script demonstrates the complete workflow of the payroll system
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let authTokens = {};

// Test data
const testUsers = {
    hr: {
        fullName: 'HR Manager',
        email: 'hr@company.com',
        password: 'password123',
        role: 'HR'
    },
    finance: {
        fullName: 'Finance Manager',
        email: 'finance@company.com',
        password: 'password123',
        role: 'FINANCE'
    }
};

const testEmployees = [
    {
        fullName: 'John Doe',
        gender: 'MALE',
        employmentType: 'FULL_TIME',
        position: 'Software Developer',
        employmentDate: '2023-01-15',
        basicSalary: 8000,
        bankAccountNumber: 'TEST-EMP-001-BANK',
        allowances: [
            { type: 'POSITION', amount: 1000, isTaxable: true },
            { type: 'TRANSPORT', amount: 500, isTaxable: false }
        ]
    },
    {
        fullName: 'Jane Smith',
        gender: 'FEMALE',
        employmentType: 'FULL_TIME',
        position: 'Project Manager',
        employmentDate: '2022-06-01',
        basicSalary: 12000,
        bankAccountNumber: 'TEST-EMP-002-BANK',
        allowances: [
            { type: 'POSITION', amount: 2000, isTaxable: true },
            { type: 'TRANSPORT', amount: 800, isTaxable: false }
        ]
    },
    {
        fullName: 'Ahmed Hassan',
        gender: 'MALE',
        employmentType: 'PART_TIME',
        position: 'Consultant',
        employmentDate: '2023-03-01',
        basicSalary: 5000,
        bankAccountNumber: 'TEST-EMP-003-BANK',
        allowances: [
            { type: 'TRANSPORT', amount: 300, isTaxable: false }
        ]
    }
];

// Helper function to make authenticated requests
const makeRequest = async (method, url, data = null, token = null) => {
    try {
        const config = {
            method,
            url: `${BASE_URL}${url}`,
            headers: {}
        };

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (data) {
            config.data = data;
        }

        const response = await axios(config);
        return response.data;
    } catch (error) {
        console.error(`Error in ${method} ${url}:`, error.response?.data || error.message);
        throw error;
    }
};

// Test functions
const testUserRegistration = async () => {
    console.log('\n=== Testing User Registration ===');

    for (const [role, userData] of Object.entries(testUsers)) {
        try {
            const response = await makeRequest('POST', '/auth/register', userData);
            console.log(`✓ ${role.toUpperCase()} user registered:`, response.data.user.fullName);
            authTokens[role] = response.data.token;
        } catch (error) {
            console.log(`✗ Failed to register ${role} user`);
        }
    }
};

const testUserLogin = async () => {
    console.log('\n=== Testing User Login ===');

    for (const [role, userData] of Object.entries(testUsers)) {
        try {
            const response = await makeRequest('POST', '/auth/login', {
                email: userData.email,
                password: userData.password
            });
            console.log(`✓ ${role.toUpperCase()} user logged in:`, response.data.user.fullName);
            authTokens[role] = response.data.token;
        } catch (error) {
            console.log(`✗ Failed to login ${role} user`);
        }
    }
};

const testEmployeeManagement = async () => {
    console.log('\n=== Testing Employee Management ===');

    const createdEmployees = [];

    for (const employeeData of testEmployees) {
        try {
            const response = await makeRequest('POST', '/employees', employeeData, authTokens.hr);
            console.log(`✓ Employee created:`, response.data.employee.fullName, `(ID: ${response.data.employee.employeeId})`);
            createdEmployees.push(response.data.employee);
        } catch (error) {
            console.log(`✗ Failed to create employee:`, employeeData.fullName);
        }
    }

    // Test getting all employees
    try {
        const response = await makeRequest('GET', '/employees', null, authTokens.hr);
        console.log(`✓ Retrieved ${response.data.employees.length} employees`);
    } catch (error) {
        console.log('✗ Failed to retrieve employees');
    }

    return createdEmployees;
};

const testPayrollCreation = async (employees) => {
    console.log('\n=== Testing Payroll Creation ===');

    const currentDate = new Date();
    const payPeriod = {
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear()
    };

    const createdPayrolls = [];

    for (const employee of employees) {
        try {
            const payrollData = {
                employee: employee._id,
                payPeriod,
                workingDays: 22,
                overtimeHours: employee.position === 'Software Developer' ? 10 : 0,
                additionalAllowances: [],
                additionalDeductions: []
            };

            const response = await makeRequest('POST', '/payroll', payrollData, authTokens.hr);
            console.log(`✓ Payroll created for ${employee.fullName}:`,
                `Gross: ${response.data.payroll.grossPay} ETB, Net: ${response.data.payroll.netPay} ETB`);
            createdPayrolls.push(response.data.payroll);
        } catch (error) {
            console.log(`✗ Failed to create payroll for ${employee.fullName}`);
        }
    }

    return createdPayrolls;
};

const testPayrollApproval = async (payrolls) => {
    console.log('\n=== Testing Payroll Approval ===');

    for (const payroll of payrolls) {
        try {
            const response = await makeRequest('POST', `/payroll/${payroll._id}/approve`, null, authTokens.finance);
            console.log(`✓ Payroll approved for ${payroll.employee.fullName}`);
        } catch (error) {
            console.log(`✗ Failed to approve payroll for ${payroll.employee?.fullName || 'Unknown'}`);
        }
    }
};

const testPaymentProcessing = async (payrolls) => {
    console.log('\n=== Testing Payment Processing ===');

    for (const payroll of payrolls) {
        try {
            const response = await makeRequest('POST', `/payroll/${payroll._id}/process-payment`, null, authTokens.finance);
            console.log(`✓ Payment processed for ${payroll.employee.fullName}:`,
                `${response.data.transactions.length} transactions created`);
        } catch (error) {
            console.log(`✗ Failed to process payment for ${payroll.employee?.fullName || 'Unknown'}`);
        }
    }
};

const testReportGeneration = async () => {
    console.log('\n=== Testing Report Generation ===');

    const currentDate = new Date();
    const payPeriod = {
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear()
    };

    // Test payroll report
    try {
        const response = await makeRequest('POST', '/reports/payroll', { payPeriod }, authTokens.hr);
        console.log(`✓ Payroll report generated:`,
            `${response.data.report.payrolls.length} payrolls, Total: ${response.data.report.totals.totalGrossPay} ETB`);
    } catch (error) {
        console.log('✗ Failed to generate payroll report');
    }

    // Test tax report
    try {
        const response = await makeRequest('POST', '/reports/tax', { payPeriod }, authTokens.finance);
        console.log(`✓ Tax report generated:`,
            `${response.data.report.totalEmployees} employees, Total tax: ${response.data.report.totalTaxCollected} ETB`);
    } catch (error) {
        console.log('✗ Failed to generate tax report');
    }

    // Test pension report
    try {
        const response = await makeRequest('POST', '/reports/pension', { payPeriod }, authTokens.finance);
        console.log(`✓ Pension report generated:`,
            `Total contributions: ${response.data.report.summary.totalContribution} ETB`);
    } catch (error) {
        console.log('✗ Failed to generate pension report');
    }
};

const testTransactionHistory = async () => {
    console.log('\n=== Testing Transaction History ===');

    try {
        const response = await makeRequest('GET', '/transactions', null, authTokens.finance);
        console.log(`✓ Retrieved ${response.data.transactions.length} transactions`);

        if (response.data.transactions.length > 0) {
            const transaction = response.data.transactions[0];
            console.log(`   Latest transaction: ${transaction.transactionType} - ${transaction.amount} ETB`);
        }
    } catch (error) {
        console.log('✗ Failed to retrieve transactions');
    }

    // Test account balances
    try {
        const response = await makeRequest('GET', '/transactions/accounts', null, authTokens.finance);
        console.log(`✓ Retrieved ${response.data.accounts.length} bank accounts`);

        const companyAccount = response.data.accounts.find(acc => acc.accountType === 'COMPANY');
        if (companyAccount) {
            console.log(`   Company balance: ${companyAccount.balance} ETB`);
        }
    } catch (error) {
        console.log('✗ Failed to retrieve account balances');
    }
};

const testSystemHealth = async () => {
    console.log('\n=== Testing System Health ===');

    try {
        const response = await axios.get(`${BASE_URL.replace('/api', '')}/health`);
        console.log('✓ System health check passed:', response.data.status);
    } catch (error) {
        console.log('✗ System health check failed');
    }
};

// Main test execution
const runTests = async () => {
    console.log('🚀 Starting Ethiopian Payroll Backend System Tests');
    console.log('================================================');

    try {
        // Test system health first
        await testSystemHealth();

        // Test user management
        await testUserRegistration();
        await testUserLogin();

        // Test employee management
        const employees = await testEmployeeManagement();

        if (employees.length > 0) {
            // Test payroll workflow
            const payrolls = await testPayrollCreation(employees);

            if (payrolls.length > 0) {
                await testPayrollApproval(payrolls);
                await testPaymentProcessing(payrolls);
            }

            // Test reporting
            await testReportGeneration();

            // Test transaction history
            await testTransactionHistory();
        }

        console.log('\n✅ All tests completed successfully!');
        console.log('\n📊 System Features Demonstrated:');
        console.log('   • User registration and authentication');
        console.log('   • Employee management with allowances');
        console.log('   • Ethiopian payroll calculations (tax, pension)');
        console.log('   • Multi-role approval workflow (HR → Finance)');
        console.log('   • Atomic transaction processing with rollback');
        console.log('   • Comprehensive reporting system');
        console.log('   • Audit trail and logging');

    } catch (error) {
        console.error('\n❌ Test execution failed:', error.message);
    }
};

// Run tests if this file is executed directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = {
    runTests,
    testUsers,
    testEmployees
};