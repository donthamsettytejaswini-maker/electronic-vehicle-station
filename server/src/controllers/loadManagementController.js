const loadManagementService = require('../services/loadManagementService');

/**
 * @desc Get network load overview across all stations
 * @route GET /api/admin/load-management/sites
 * @access Admin
 */
const getNetworkLoadOverview = async (req, res, next) => {
  try {
    const data = await loadManagementService.getNetworkLoadOverview();
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get site power status & charger allocations for a station
 * @route GET /api/admin/load-management/sites/:stationId
 * @access Admin
 */
const getSitePowerStatus = async (req, res, next) => {
  try {
    const data = await loadManagementService.getSitePowerStatus(req.params.stationId);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update station max power limit
 * @route PATCH /api/admin/load-management/sites/:stationId/limit
 * @access Admin
 */
const updateSitePowerLimit = async (req, res, next) => {
  try {
    const { limitKw } = req.body;
    const data = await loadManagementService.updateSitePowerLimit(
      req.params.stationId,
      limitKw
    );
    res.status(200).json({
      success: true,
      message: 'Site power limit updated successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNetworkLoadOverview,
  getSitePowerStatus,
  updateSitePowerLimit,
};
