const express = require('express');
const { validate, schemas } = require('../utils/validator');
const { authenticateToken } = require('../middlewares/auth.middleware');
const {
    register,
    login,
    getProfile,
    updateProfile
} = require('../controllers/auth.controller');

const router = express.Router();

// Public routes
router.post('/register', validate(schemas.user), register);
router.post('/login', validate(schemas.login), login);

// Protected routes
router.use(authenticateToken);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

module.exports = router;