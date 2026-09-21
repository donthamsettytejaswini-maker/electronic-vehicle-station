const express = require('express');
const router = express.Router();
const ocppController = require('../controllers/ocppController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

// Admin only routes for OCPP Simulator & Status
router.get('/status', protect, adminOnly, ocppController.getOcppStatus);
router.post('/simulate', protect, adminOnly, ocppController.simulateOcppAction);

// Direct endpoint simulator actions for developer console
router.post('/chargers/:chargerId/boot-notification', protect, adminOnly, (req, res, next) => {
  req.body = { ...req.body, chargerId: req.params.chargerId, action: 'BootNotification' };
  return ocppController.simulateOcppAction(req, res, next);
});

router.post('/chargers/:chargerId/heartbeat', protect, adminOnly, (req, res, next) => {
  req.body = { ...req.body, chargerId: req.params.chargerId, action: 'Heartbeat' };
  return ocppController.simulateOcppAction(req, res, next);
});

router.post('/chargers/:chargerId/status-notification', protect, adminOnly, (req, res, next) => {
  req.body = { ...req.body, chargerId: req.params.chargerId, action: 'StatusNotification' };
  return ocppController.simulateOcppAction(req, res, next);
});

router.post('/chargers/:chargerId/meter-values', protect, adminOnly, (req, res, next) => {
  req.body = { ...req.body, chargerId: req.params.chargerId, action: 'MeterValues' };
  return ocppController.simulateOcppAction(req, res, next);
});

module.exports = router;
