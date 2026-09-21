const PricingRule = require('../models/PricingRule');
const dynamicPricingService = require('../services/dynamicPricingService');

/**
 * @desc Get active effective tariff for a station/charger at target time
 * @route GET /api/pricing/active
 * @access Public (or authenticated)
 */
const getActiveTariff = async (req, res, next) => {
  try {
    const { stationId, chargerId, date } = req.query;
    if (!stationId) {
      return res.status(400).json({
        success: false,
        message: 'Station ID is required',
      });
    }

    const data = await dynamicPricingService.getEffectiveTariff(
      stationId,
      chargerId,
      date ? new Date(date) : new Date()
    );

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get all pricing rules (Admin)
 * @route GET /api/admin/pricing
 * @access Admin
 */
const getPricingRules = async (req, res, next) => {
  try {
    const rules = await PricingRule.find()
      .populate('stationId', 'name city')
      .sort({ priority: -1, createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: rules,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Create new pricing rule (Admin)
 * @route POST /api/admin/pricing
 * @access Admin
 */
const createPricingRule = async (req, res, next) => {
  try {
    const rule = await PricingRule.create(req.body);
    const populated = await PricingRule.findById(rule._id).populate('stationId', 'name city');
    res.status(201).json({
      success: true,
      message: 'Pricing rule created successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update pricing rule (Admin)
 * @route PUT /api/admin/pricing/:id
 * @access Admin
 */
const updatePricingRule = async (req, res, next) => {
  try {
    const updated = await PricingRule.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('stationId', 'name city');

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Pricing rule not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Pricing rule updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Toggle pricing rule status (Admin)
 * @route PATCH /api/admin/pricing/:id/status
 * @access Admin
 */
const updatePricingRuleStatus = async (req, res, next) => {
  try {
    const { active } = req.body;
    const updated = await PricingRule.findByIdAndUpdate(
      req.params.id,
      { active: Boolean(active) },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Pricing rule not found',
      });
    }

    res.status(200).json({
      success: true,
      message: `Pricing rule ${updated.active ? 'activated' : 'deactivated'}`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Delete pricing rule (Admin)
 * @route DELETE /api/admin/pricing/:id
 * @access Admin
 */
const deletePricingRule = async (req, res, next) => {
  try {
    const deleted = await PricingRule.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Pricing rule not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Pricing rule deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActiveTariff,
  getPricingRules,
  createPricingRule,
  updatePricingRule,
  updatePricingRuleStatus,
  deletePricingRule,
};
