const express = require('express');
const {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  getAllBookings,
  getAvailableSlots,
} = require('../controllers/bookingController');
const {
  generateBookingQr,
  getQrStatus,
} = require('../controllers/qrController');
const { completeCheckIn } = require('../controllers/checkInController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

const router = express.Router();

// Public / Authenticated slot check
router.get('/slots', getAvailableSlots);

// Admin all bookings
router.get('/admin/all', protect, adminOnly, getAllBookings);

// User bookings
router
  .route('/')
  .post(protect, createBooking)
  .get(protect, getUserBookings);

router
  .route('/:id')
  .get(protect, getBookingById);

router.patch('/:id/cancel', protect, cancelBooking);

// QR routes nested under booking
router.post('/:bookingId/qr', protect, generateBookingQr);
router.get('/:bookingId/qr/status', protect, getQrStatus);

// Check-in nested endpoint
router.post('/:bookingId/check-in', protect, completeCheckIn);

module.exports = router;
