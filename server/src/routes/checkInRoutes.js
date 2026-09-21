const express = require('express');
const {
  verifyQrCheckIn,
  verifyReferenceCheckIn,
} = require('../controllers/checkInController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/verify', protect, verifyQrCheckIn);
router.post('/reference', protect, verifyReferenceCheckIn);

module.exports = router;
