const Employee = require('../models/Employee');
const BankAccount = require('../models/BankAccount');

/**
 * Create a new employee
 */
const createEmployee = async (req, res, next) => {
    try {
        const employeeData = req.body;

        // Create employee
        const employee = await Employee.create(employeeData);

        // Create employee bank account
        await BankAccount.create({
            accountNumber: employee.bankAccountNumber,
            accountHolder: employee.fullName,
            accountType: 'EMPLOYEE',
            balance: 0,
            employee: employee._id
        });

        res.status(201).json({
            success: true,
            message: 'Employee created successfully',
            data: { employee }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all employees with pagination
 */
const getEmployees = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        const status = req.query.status || '';

        // Build query
        let query = {};

        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { employeeId: { $regex: search, $options: 'i' } },
                { position: { $regex: search, $options: 'i' } }
            ];
        }

        if (status) {
            query.status = status;
        }

        const employees = await Employee.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Employee.countDocuments(query);

        res.json({
            success: true,
            data: {
                employees,
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
 * Get employee by ID
 */
const getEmployeeById = async (req, res, next) => {
    try {
        const employee = await Employee.findById(req.params.id);

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        res.json({
            success: true,
            data: { employee }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update employee
 */
const updateEmployee = async (req, res, next) => {
    try {
        const employee = await Employee.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        // Update bank account if bank account number changed
        if (req.body.bankAccountNumber) {
            await BankAccount.findOneAndUpdate(
                { employee: employee._id },
                {
                    accountNumber: req.body.bankAccountNumber,
                    accountHolder: employee.fullName
                }
            );
        }

        res.json({
            success: true,
            message: 'Employee updated successfully',
            data: { employee }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete employee (soft delete)
 */
const deleteEmployee = async (req, res, next) => {
    try {
        const employee = await Employee.findByIdAndUpdate(
            req.params.id,
            { status: 'TERMINATED', terminationDate: new Date() },
            { new: true }
        );

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        // Deactivate bank account
        await BankAccount.findOneAndUpdate(
            { employee: employee._id },
            { isActive: false }
        );

        res.json({
            success: true,
            message: 'Employee terminated successfully',
            data: { employee }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Add allowance to employee
 */
const addAllowance = async (req, res, next) => {
    try {
        const { type, amount, isTaxable } = req.body;

        const employee = await Employee.findByIdAndUpdate(
            req.params.id,
            {
                $push: {
                    allowances: { type, amount, isTaxable, isActive: true }
                }
            },
            { new: true, runValidators: true }
        );

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        res.json({
            success: true,
            message: 'Allowance added successfully',
            data: { employee }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Add deduction to employee
 */
const addDeduction = async (req, res, next) => {
    try {
        const { type, amount, remainingBalance } = req.body;

        const employee = await Employee.findByIdAndUpdate(
            req.params.id,
            {
                $push: {
                    deductions: {
                        type,
                        amount,
                        remainingBalance: remainingBalance || amount,
                        isActive: true
                    }
                }
            },
            { new: true, runValidators: true }
        );

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        res.json({
            success: true,
            message: 'Deduction added successfully',
            data: { employee }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createEmployee,
    getEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee,
    addAllowance,
    addDeduction
};