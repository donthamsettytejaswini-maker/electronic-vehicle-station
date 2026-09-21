const demandPredictionService = require('../services/demandPredictionService');

/**
 * @desc Get predicted demand for a specific station
 * @route GET /api/stations/:stationId/demand
 * @access Public
 */
const getStationDemandPrediction = async (req, res, next) => {
  try {
    const { stationId } = req.params;
    const { date } = req.query;
    const data = await demandPredictionService.predictStationDemand(stationId, date);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get predicted network demand overview for admin
 * @route GET /api/admin/predictions/demand
 * @access Admin
 */
const getNetworkDemandPrediction = async (req, res, next) => {
  try {
    const { date } = req.query;
    const data = await demandPredictionService.predictNetworkDemandOverview(date);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStationDemandPrediction,
  getNetworkDemandPrediction,
};
