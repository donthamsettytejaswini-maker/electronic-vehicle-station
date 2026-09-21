const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

// All report routes require authenticated admin access
router.use(protect, adminOnly);

// Report summary
router.get('/summary', reportController.getSummary);

// Bookings report & CSV
router.get('/bookings', reportController.getBookingsReport);

// Sessions report & CSV
router.get('/sessions', reportController.getSessionsReport);

// Payments report & CSV
router.get('/payments', reportController.getPaymentsReport);

// Energy report & CSV
router.get('/energy', reportController.getEnergyReport);

module.exports = router;
