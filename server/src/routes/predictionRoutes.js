const express = require('express');
const router = express.Router();
const predictionController = require('../controllers/predictionController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

// Public station demand prediction
router.get('/stations/:stationId/demand', predictionController.getStationDemandPrediction);

// Admin network demand predictions
router.get('/admin/predictions/demand', protect, adminOnly, predictionController.getNetworkDemandPrediction);

module.exports = router;
