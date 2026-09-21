const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
  getStations,
  getStationById,
  createStation,
  updateStation,
  deleteStation,
  updateStationStatus,
  getNearbyStations,
} = require('../controllers/stationController');
const {
  getChargersByStation,
  createCharger,
} = require('../controllers/chargerController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');
const {
  validate,
  stationValidationRules,
  chargerValidationRules,
} = require('../middleware/validationMiddleware');

const router = express.Router();

// Optional auth middleware so admins can request all station statuses on GET /api/stations
const optionalAuth = async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (e) {
      // Ignore token decode errors for public routes
    }
  }
  next();
};

router
  .route('/')
  .get(optionalAuth, getStations)
  .post(protect, adminOnly, stationValidationRules, validate, createStation);

router.get('/nearby', optionalAuth, getNearbyStations);

router
  .route('/:id')
  .get(optionalAuth, getStationById)
  .put(protect, adminOnly, stationValidationRules, validate, updateStation)
  .delete(protect, adminOnly, deleteStation);

router.patch('/:id/status', protect, adminOnly, updateStationStatus);

// Nested routes for chargers within a station
router
  .route('/:stationId/chargers')
  .get(optionalAuth, getChargersByStation)
  .post(protect, adminOnly, chargerValidationRules, validate, createCharger);

module.exports = router;
