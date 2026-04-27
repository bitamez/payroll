const Payroll = require('../models/Payroll');

/**
 * Payroll Repository
 * Handles database operations for payrolls
 */

class PayrollRepository {
    /**
     * Create a new payroll
     * @param {Object} payrollData - Payroll data
     * @returns {Promise<Object>} - Created payroll
     */
    async create(payrollData) {
        return await Payroll.create(payrollData);
    }

    /**
     * Find payroll by ID
     * @param {string} id - Payroll ID
     * @param {boolean} populate - Whether to populate references
     * @returns {Promise<Object|null>} - Payroll or null
     */
    async findById(id, populate = true) {
        let query = Payroll.findById(id);

        if (populate) {
            query = query
                .populate('employee', 'fullName employeeId position bankAccountNumber')
                .populate('preparedBy', 'fullName role')
                .populate('approvedBy', 'fullName role');
        }

        return await query;
    }

    /**
     * Find payroll by employee and period
     * @param {string} employeeId - Employee ID
     * @param {Object} payPeriod - Pay period {month, year}
     * @returns {Promise<Object|null>} - Payroll or null
     */
    async findByEmployeeAndPeriod(employeeId, payPeriod) {
        return await Payroll.findOne({
            employee: employeeId,
            'payPeriod.month': payPeriod.month,
            'payPeriod.year': payPeriod.year
        }).populate('employee', 'fullName employeeId');
    }

    /**
     * Find all payrolls with pagination and filters
     * @param {Object} options - Query options
     * @returns {Promise<Object>} - Payrolls with pagination info
     */
    async findAll(options = {}) {
        const {
            page = 1,
            limit = 10,
            status,
            month,
            year,
            employee,
            preparedBy,
            approvedBy,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = options;

        const skip = (page - 1) * limit;
        let query = {};

        // Add filters
        if (status) query.status = status;
        if (month) query['payPeriod.month'] = parseInt(month);
        if (year) query['payPeriod.year'] = parseInt(year);
        if (employee) query.employee = employee;
        if (preparedBy) query.preparedBy = preparedBy;
        if (approvedBy) query.approvedBy = approvedBy;

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const [payrolls, total] = await Promise.all([
            Payroll.find(query)
                .populate('employee', 'fullName employeeId position')
                .populate('preparedBy', 'fullName role')
                .populate('approvedBy', 'fullName role')
                .sort(sort)
                .skip(skip)
                .limit(limit),
            Payroll.countDocuments(query)
        ]);

        return {
            payrolls,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Update payroll by ID
     * @param {string} id - Payroll ID
     * @param {Object} updateData - Update data
     * @returns {Promise<Object|null>} - Updated payroll or null
     */
    async updateById(id, updateData) {
        return await Payroll.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );
    }

    /**
     * Delete payroll by ID
     * @param {string} id - Payroll ID
     * @returns {Promise<Object|null>} - Deleted payroll or null
     */
    async deleteById(id) {
        return await Payroll.findByIdAndDelete(id);
    }

    /**
     * Find payrolls by status
     * @param {string} status - Payroll status
     * @param {boolean} populate - Whether to populate references
     * @returns {Promise<Array>} - Array of payrolls
     */
    async findByStatus(status, populate = true) {
        let query = Payroll.find({ status });

        if (populate) {
            query = query
                .populate('employee', 'fullName employeeId position bankAccountNumber')
                .populate('preparedBy', 'fullName role')
                .populate('approvedBy', 'fullName role');
        }

        return await query.sort({ createdAt: -1 });
    }

    /**
     * Find payrolls by employee
     * @param {string} employeeId - Employee ID
     * @param {Object} options - Query options
     * @returns {Promise<Array>} - Array of payrolls
     */
    async findByEmployee(employeeId, options = {}) {
        const { year, status, limit } = options;

        let query = { employee: employeeId };

        if (year) query['payPeriod.year'] = year;
        if (status) query.status = status;

        let payrollQuery = Payroll.find(query)
            .populate('preparedBy', 'fullName role')
            .populate('approvedBy', 'fullName role')
            .sort({ 'payPeriod.year': -1, 'payPeriod.month': -1 });

        if (limit) {
            payrollQuery = payrollQuery.limit(limit);
        }

        return await payrollQuery;
    }

    /**
     * Find payrolls by period
     * @param {Object} payPeriod - Pay period {month, year}
     * @param {boolean} populate - Whether to populate references
     * @returns {Promise<Array>} - Array of payrolls
     */
    async findByPeriod(payPeriod, populate = true) {
        let query = Payroll.find({
            'payPeriod.month': payPeriod.month,
            'payPeriod.year': payPeriod.year
        });

        if (populate) {
            query = query
                .populate('employee', 'fullName employeeId position')
                .populate('preparedBy', 'fullName role')
                .populate('approvedBy', 'fullName role');
        }

        return await query.sort({ 'employee.fullName': 1 });
    }

    /**
     * Get payroll statistics
     * @param {Object} filters - Optional filters
     * @returns {Promise<Object>} - Payroll statistics
     */
    async getStatistics(filters = {}) {
        let matchStage = {};

        if (filters.year) {
            matchStage['payPeriod.year'] = filters.year;
        }

        if (filters.month) {
            matchStage['payPeriod.month'] = filters.month;
        }

        const stats = await Payroll.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalGrossPay: { $sum: '$grossPay' },
                    totalNetPay: { $sum: '$netPay' },
                    totalTax: { $sum: '$incomeTax' },
                    totalPensionEmployee: { $sum: '$pensionEmployee' },
                    totalPensionEmployer: { $sum: '$pensionEmployer' },
                    avgGrossPay: { $avg: '$grossPay' },
                    avgNetPay: { $avg: '$netPay' }
                }
            }
        ]);

        const monthlyStats = await Payroll.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: {
                        year: '$payPeriod.year',
                        month: '$payPeriod.month'
                    },
                    count: { $sum: 1 },
                    totalGrossPay: { $sum: '$grossPay' },
                    totalNetPay: { $sum: '$netPay' },
                    totalTax: { $sum: '$incomeTax' }
                }
            },
            {
                $sort: { '_id.year': -1, '_id.month': -1 }
            },
            {
                $limit: 12
            }
        ]);

        return {
            byStatus: stats,
            monthlyTrends: monthlyStats
        };
    }

    /**
     * Bulk approve payrolls
     * @param {Array} payrollIds - Array of payroll IDs
     * @param {string} approvedBy - User ID who approved
     * @returns {Promise<Object>} - Update result
     */
    async bulkApprove(payrollIds, approvedBy) {
        return await Payroll.updateMany(
            {
                _id: { $in: payrollIds },
                status: 'PENDING'
            },
            {
                status: 'APPROVED',
                approvedBy,
                approvedAt: new Date()
            }
        );
    }

    /**
     * Get payroll summary for a period
     * @param {Object} payPeriod - Pay period {month, year}
     * @returns {Promise<Object>} - Payroll summary
     */
    async getPeriodSummary(payPeriod) {
        const summary = await Payroll.aggregate([
            {
                $match: {
                    'payPeriod.month': payPeriod.month,
                    'payPeriod.year': payPeriod.year
                }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalGrossPay: { $sum: '$grossPay' },
                    totalNetPay: { $sum: '$netPay' },
                    totalTax: { $sum: '$incomeTax' },
                    totalPensionEmployee: { $sum: '$pensionEmployee' },
                    totalPensionEmployer: { $sum: '$pensionEmployer' },
                    totalDeductions: { $sum: '$totalDeductions' }
                }
            }
        ]);

        const overallSummary = await Payroll.aggregate([
            {
                $match: {
                    'payPeriod.month': payPeriod.month,
                    'payPeriod.year': payPeriod.year
                }
            },
            {
                $group: {
                    _id: null,
                    totalEmployees: { $sum: 1 },
                    totalGrossPay: { $sum: '$grossPay' },
                    totalNetPay: { $sum: '$netPay' },
                    totalTax: { $sum: '$incomeTax' },
                    totalPensionEmployee: { $sum: '$pensionEmployee' },
                    totalPensionEmployer: { $sum: '$pensionEmployer' },
                    totalDeductions: { $sum: '$totalDeductions' },
                    avgGrossPay: { $avg: '$grossPay' },
                    avgNetPay: { $avg: '$netPay' }
                }
            }
        ]);

        return {
            period: payPeriod,
            byStatus: summary,
            overall: overallSummary[0] || {}
        };
    }

    /**
     * Find pending payrolls for approval
     * @param {number} limit - Limit number of results
     * @returns {Promise<Array>} - Array of pending payrolls
     */
    async findPendingForApproval(limit = 50) {
        return await Payroll.find({ status: 'PENDING' })
            .populate('employee', 'fullName employeeId position')
            .populate('preparedBy', 'fullName role')
            .sort({ createdAt: 1 })
            .limit(limit);
    }

    /**
     * Find approved payrolls ready for payment
     * @param {number} limit - Limit number of results
     * @returns {Promise<Array>} - Array of approved payrolls
     */
    async findApprovedForPayment(limit = 50) {
        return await Payroll.find({ status: 'APPROVED' })
            .populate('employee', 'fullName employeeId position bankAccountNumber')
            .populate('approvedBy', 'fullName role')
            .sort({ approvedAt: 1 })
            .limit(limit);
    }

    /**
     * Get year-to-date summary for an employee
     * @param {string} employeeId - Employee ID
     * @param {number} year - Year
     * @returns {Promise<Object>} - YTD summary
     */
    async getEmployeeYTDSummary(employeeId, year) {
        const ytdData = await Payroll.aggregate([
            {
                $match: {
                    employee: employeeId,
                    'payPeriod.year': year,
                    status: { $in: ['APPROVED', 'PAID'] }
                }
            },
            {
                $group: {
                    _id: null,
                    totalMonths: { $sum: 1 },
                    totalGrossPay: { $sum: '$grossPay' },
                    totalNetPay: { $sum: '$netPay' },
                    totalTax: { $sum: '$incomeTax' },
                    totalPensionEmployee: { $sum: '$pensionEmployee' },
                    totalPensionEmployer: { $sum: '$pensionEmployer' },
                    totalDeductions: { $sum: '$totalDeductions' },
                    avgGrossPay: { $avg: '$grossPay' },
                    avgNetPay: { $avg: '$netPay' }
                }
            }
        ]);

        const monthlyBreakdown = await Payroll.find({
            employee: employeeId,
            'payPeriod.year': year,
            status: { $in: ['APPROVED', 'PAID'] }
        }).sort({ 'payPeriod.month': 1 });

        return {
            employeeId,
            year,
            ytdSummary: ytdData[0] || {},
            monthlyBreakdown
        };
    }
}

module.exports = new PayrollRepository();