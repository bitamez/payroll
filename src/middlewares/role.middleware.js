/**
 * Role-based access control middleware
 * @param {string|array} allowedRoles - Single role or array of allowed roles
 * @returns {function} - Express middleware function
 */
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role(s): ${roles.join(', ')}`
            });
        }

        next();
    };
};

/**
 * Check if user has HR role
 */
const requireHR = requireRole('HR');

/**
 * Check if user has Finance role
 */
const requireFinance = requireRole('FINANCE');

/**
 * Check if user has either HR or Finance role
 */
const requireHROrFinance = requireRole(['HR', 'FINANCE']);

module.exports = {
    requireRole,
    requireHR,
    requireFinance,
    requireHROrFinance
};