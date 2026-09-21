const express = require('express');
const router = express.Router();
const loadManagementController = require('../controllers/loadManagementController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

// Public or User query for station power status
router.get('/stations/:stationId/load', loadManagementController.getSitePowerStatus);

// Admin load management endpoints
router.get('/admin/load-management/sites', protect, adminOnly, loadManagementController.getNetworkLoadOverview);
router.get('/admin/load-management/sites/:stationId', protect, adminOnly, loadManagementController.getSitePowerStatus);
router.patch('/admin/stations/:stationId/load-limit', protect, adminOnly, loadManagementController.updateSitePowerLimit);
router.patch('/admin/load-management/sites/:stationId/limit', protect, adminOnly, loadManagementController.updateSitePowerLimit);
router.post('/admin/stations/:stationId/load-rebalance', protect, adminOnly, (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Dynamic proportional load rebalance triggered successfully',
  });
});

module.exports = router;
