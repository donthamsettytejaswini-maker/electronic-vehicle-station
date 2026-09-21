const express = require('express');
const router = express.Router();
const pricingController = require('../controllers/pricingController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

// Public: Query active effective tariff
router.get('/pricing/active', pricingController.getActiveTariff);

// Admin Dynamic Pricing CRUD (matches prompt /api/admin/pricing)
router.get('/admin/pricing', protect, adminOnly, pricingController.getPricingRules);
router.post('/admin/pricing', protect, adminOnly, pricingController.createPricingRule);
router.put('/admin/pricing/:id', protect, adminOnly, pricingController.updatePricingRule);
router.patch('/admin/pricing/:id/status', protect, adminOnly, pricingController.updatePricingRuleStatus);
router.delete('/admin/pricing/:id', protect, adminOnly, pricingController.deletePricingRule);

module.exports = router;
