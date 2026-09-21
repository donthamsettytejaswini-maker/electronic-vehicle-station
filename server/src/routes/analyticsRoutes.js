const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

// All analytics routes require authenticated admin access
router.use(protect, adminOnly);

// 1. Overview
router.get('/overview', analyticsController.getOverview);

// 2. Revenue Analytics
router.get('/revenue', analyticsController.getRevenue);
router.get('/revenue/daily', analyticsController.getDailyRevenue);
router.get('/revenue/monthly', analyticsController.getMonthlyRevenue);
router.get('/revenue/by-station', analyticsController.getRevenueByStation);
router.get('/revenue/by-payment-method', analyticsController.getRevenueByPaymentMethod);

// 3. Booking Analytics
router.get('/bookings', analyticsController.getBookings);
router.get('/bookings/daily', analyticsController.getDailyBookings);
router.get('/bookings/by-station', analyticsController.getBookingsByStation);
router.get('/bookings/by-status', analyticsController.getBookingsByStatus);
router.get('/bookings/peak-hours', analyticsController.getPeakHours);

// 4. Session Analytics
router.get('/sessions', analyticsController.getSessions);
router.get('/sessions/daily', analyticsController.getDailySessions);
router.get('/sessions/by-station', analyticsController.getSessionsByStation);

// 5. Energy Analytics
router.get('/energy', analyticsController.getEnergy);
router.get('/energy/daily', analyticsController.getDailyEnergy);
router.get('/energy/monthly', analyticsController.getMonthlyEnergy);
router.get('/energy/by-station', analyticsController.getEnergyByStation);
router.get('/energy/by-charger', analyticsController.getEnergyByCharger);

// 6. Charger Utilization Analytics
router.get('/chargers', analyticsController.getChargers);
router.get('/chargers/status', analyticsController.getChargers);
router.get('/chargers/utilization', analyticsController.getChargers);
router.get('/chargers/top-used', analyticsController.getChargers);

// 7. Station Performance Analytics
router.get('/stations', analyticsController.getStations);

// 8. Payment Analytics
router.get('/payments', analyticsController.getPayments);
router.get('/payments/status', analyticsController.getPayments);
router.get('/payments/methods', analyticsController.getPayments);
router.get('/payments/providers', analyticsController.getPayments);

// 9. User Analytics
router.get('/users', analyticsController.getUsers);
router.get('/users/daily', analyticsController.getUsers);

module.exports = router;
