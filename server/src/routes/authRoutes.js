const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  getCurrentUser,
  logout,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Register route with validation
router.post(
  '/register',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2 })
      .withMessage('Name must be at least 2 characters long'),
    body('email')
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('confirmPassword')
      .notEmpty()
      .withMessage('Confirm password is required'),
    body('phone')
      .optional({ checkFalsy: true })
      .trim(),
  ],
  register
);

// Login route with validation
router.post(
  '/login',
  [
    body('email')
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login
);

// Get current user route
router.get('/me', protect, getCurrentUser);

// Logout route
router.post('/logout', protect, logout);

module.exports = router;
