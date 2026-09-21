const recommendationService = require('../services/recommendationService');

/**
 * @desc Get smart station recommendations
 * @route GET /api/recommendations/stations
 * @access Public (or authenticated)
 */
const getRecommendations = async (req, res, next) => {
  try {
    const data = await recommendationService.getStationRecommendations(req.query);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRecommendations,
};
