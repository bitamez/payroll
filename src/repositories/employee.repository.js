const Employee = require('../models/Employee');

/**
 * Employee Repository
 * Handles database operations for employees
 */

class EmployeeRepository {
    /**
     * Create a new employee
     * @param {Object} employeeData - Employee data
     * @returns {Promise<Object>} - Created employee
     */
    async create(employeeData) {
        return await Employee.create(employeeData);
    }

    /**
     * Find employee by ID
     * @param {string} id - Employee ID
     * @returns {Promise<Object|null>} - Employee or null
     */
    async findById(id) {
        return await Employee.findById(id);
    }

    /**
     * Find employee by employee ID
     * @param {string} employeeId - Employee ID string
     * @returns {Promise<Object|null>} - Employee or null
     */
    async findByEmployeeId(employeeId) {
        return await Employee.findOne({ employeeId });
    }

    /**
     * Find employee by bank account number
     * @param {string} bankAccountNumber - Bank account number
     * @returns {Promise<Object|null>} - Employee or null
     */
    async findByBankAccount(bankAccountNumber) {
        return await Employee.findOne({ bankAccountNumber });
    }

    /**
     * Find all employees with pagination and filters
     * @param {Object} options - Query options
     * @returns {Promise<Object>} - Employees with pagination info
     */
    async findAll(options = {}) {
        const {
            page = 1,
            limit = 10,
            search = '',
            status = '',
            position = '',
            employmentType = '',
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = options;

        const skip = (page - 1) * limit;
        let query = {};

        // Build search query
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { employeeId: { $regex: search, $options: 'i' } },
                { position: { $regex: search, $options: 'i' } }
            ];
        }

        // Add filters
        if (status) query.status = status;
        if (position) query.position = { $regex: position, $options: 'i' };
        if (employmentType) query.employmentType = employmentType;

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const [employees, total] = await Promise.all([
            Employee.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit),
            Employee.countDocuments(query)
        ]);

        return {
            employees,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Update employee by ID
     * @param {string} id - Employee ID
     * @param {Object} updateData - Update data
     * @returns {Promise<Object|null>} - Updated employee or null
     */
    async updateById(id, updateData) {
        return await Employee.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );
    }

    /**
     * Delete employee by ID (soft delete)
     * @param {string} id - Employee ID
     * @returns {Promise<Object|null>} - Updated employee or null
     */
    async deleteById(id) {
        return await Employee.findByIdAndUpdate(
            id,
            {
                status: 'TERMINATED',
                terminationDate: new Date()
            },
            { new: true }
        );
    }

    /**
     * Find active employees
     * @returns {Promise<Array>} - Array of active employees
     */
    async findActive() {
        return await Employee.find({ status: 'ACTIVE' });
    }

    /**
     * Find employees by position
     * @param {string} position - Position name
     * @returns {Promise<Array>} - Array of employees
     */
    async findByPosition(position) {
        return await Employee.find({
            position: { $regex: position, $options: 'i' },
            status: 'ACTIVE'
        });
    }

    /**
     * Find employees by employment type
     * @param {string} employmentType - Employment type
     * @returns {Promise<Array>} - Array of employees
     */
    async findByEmploymentType(employmentType) {
        return await Employee.find({
            employmentType,
            status: 'ACTIVE'
        });
    }

    /**
     * Add allowance to employee
     * @param {string} id - Employee ID
     * @param {Object} allowance - Allowance data
     * @returns {Promise<Object|null>} - Updated employee or null
     */
    async addAllowance(id, allowance) {
        return await Employee.findByIdAndUpdate(
            id,
            { $push: { allowances: { ...allowance, isActive: true } } },
            { new: true, runValidators: true }
        );
    }

    /**
     * Update allowance for employee
     * @param {string} employeeId - Employee ID
     * @param {string} allowanceId - Allowance ID
     * @param {Object} updateData - Update data
     * @returns {Promise<Object|null>} - Updated employee or null
     */
    async updateAllowance(employeeId, allowanceId, updateData) {
        return await Employee.findOneAndUpdate(
            { _id: employeeId, 'allowances._id': allowanceId },
            { $set: { 'allowances.$': { ...updateData } } },
            { new: true, runValidators: true }
        );
    }

    /**
     * Remove allowance from employee
     * @param {string} employeeId - Employee ID
     * @param {string} allowanceId - Allowance ID
     * @returns {Promise<Object|null>} - Updated employee or null
     */
    async removeAllowance(employeeId, allowanceId) {
        return await Employee.findByIdAndUpdate(
            employeeId,
            { $pull: { allowances: { _id: allowanceId } } },
            { new: true }
        );
    }

    /**
     * Add deduction to employee
     * @param {string} id - Employee ID
     * @param {Object} deduction - Deduction data
     * @returns {Promise<Object|null>} - Updated employee or null
     */
    async addDeduction(id, deduction) {
        return await Employee.findByIdAndUpdate(
            id,
            {
                $push: {
                    deductions: {
                        ...deduction,
                        remainingBalance: deduction.remainingBalance || deduction.amount,
                        isActive: true
                    }
                }
            },
            { new: true, runValidators: true }
        );
    }

    /**
     * Update deduction for employee
     * @param {string} employeeId - Employee ID
     * @param {string} deductionId - Deduction ID
     * @param {Object} updateData - Update data
     * @returns {Promise<Object|null>} - Updated employee or null
     */
    async updateDeduction(employeeId, deductionId, updateData) {
        return await Employee.findOneAndUpdate(
            { _id: employeeId, 'deductions._id': deductionId },
            { $set: { 'deductions.$': { ...updateData } } },
            { new: true, runValidators: true }
        );
    }

    /**
     * Remove deduction from employee
     * @param {string} employeeId - Employee ID
     * @param {string} deductionId - Deduction ID
     * @returns {Promise<Object|null>} - Updated employee or null
     */
    async removeDeduction(employeeId, deductionId) {
        return await Employee.findByIdAndUpdate(
            employeeId,
            { $pull: { deductions: { _id: deductionId } } },
            { new: true }
        );
    }

    /**
     * Get employee statistics
     * @returns {Promise<Object>} - Employee statistics
     */
    async getStatistics() {
        const stats = await Employee.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalSalary: { $sum: '$basicSalary' },
                    avgSalary: { $avg: '$basicSalary' }
                }
            }
        ]);

        const employmentTypeStats = await Employee.aggregate([
            {
                $match: { status: 'ACTIVE' }
            },
            {
                $group: {
                    _id: '$employmentType',
                    count: { $sum: 1 }
                }
            }
        ]);

        const positionStats = await Employee.aggregate([
            {
                $match: { status: 'ACTIVE' }
            },
            {
                $group: {
                    _id: '$position',
                    count: { $sum: 1 },
                    avgSalary: { $avg: '$basicSalary' }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: 10
            }
        ]);

        return {
            byStatus: stats,
            byEmploymentType: employmentTypeStats,
            topPositions: positionStats
        };
    }

    /**
     * Search employees with advanced filters
     * @param {Object} filters - Search filters
     * @returns {Promise<Array>} - Array of employees
     */
    async advancedSearch(filters) {
        const {
            fullName,
            employeeId,
            position,
            employmentType,
            status,
            minSalary,
            maxSalary,
            hiredAfter,
            hiredBefore
        } = filters;

        let query = {};

        if (fullName) {
            query.fullName = { $regex: fullName, $options: 'i' };
        }

        if (employeeId) {
            query.employeeId = { $regex: employeeId, $options: 'i' };
        }

        if (position) {
            query.position = { $regex: position, $options: 'i' };
        }

        if (employmentType) {
            query.employmentType = employmentType;
        }

        if (status) {
            query.status = status;
        }

        if (minSalary || maxSalary) {
            query.basicSalary = {};
            if (minSalary) query.basicSalary.$gte = minSalary;
            if (maxSalary) query.basicSalary.$lte = maxSalary;
        }

        if (hiredAfter || hiredBefore) {
            query.employmentDate = {};
            if (hiredAfter) query.employmentDate.$gte = new Date(hiredAfter);
            if (hiredBefore) query.employmentDate.$lte = new Date(hiredBefore);
        }

        return await Employee.find(query).sort({ fullName: 1 });
    }
}

module.exports = new EmployeeRepository();