const express = require('express');
const { body } = require('express-validator');
const {
  getProfile,
  updateProfile,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router
  .route('/profile')
  .get(protect, getProfile)
  .put(
    protect,
    [
      body('name')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Name cannot be empty')
        .isLength({ min: 2 })
        .withMessage('Name must be at least 2 characters long'),
      body('phone').optional().trim(),
      body('avatar')
        .optional()
        .trim()
        .custom((val) => {
          if (!val) return true;
          try {
            new URL(val);
            return true;
          } catch (err) {
            throw new Error('Avatar must be a valid URL');
          }
        }),
    ],
    updateProfile
  );

module.exports = router;
