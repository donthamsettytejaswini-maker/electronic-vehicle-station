const analyticsService = require('../services/analyticsService');

/**
 * @desc Get high-level overview analytics
 * @route GET /api/admin/analytics/overview
 * @access Admin
 */
const getOverview = async (req, res, next) => {
  try {
    const data = await analyticsService.getOverviewAnalytics(req.query);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get revenue summary and KPIs
 * @route GET /api/admin/analytics/revenue
 * @access Admin
 */
const getRevenue = async (req, res, next) => {
  try {
    const data = await analyticsService.getRevenueOverview(req.query);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get daily revenue breakdown
 * @route GET /api/admin/analytics/revenue/daily
 * @access Admin
 */
const getDailyRevenue = async (req, res, next) => {
  try {
    const data = await analyticsService.getDailyRevenue(req.query);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get monthly revenue breakdown
 * @route GET /api/admin/analytics/revenue/monthly
 * @access Admin
 */
const getMonthlyRevenue = async (req, res, next) => {
  try {
    const data = await analyticsService.getMonthlyRevenue(req.query);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get revenue breakdown by station
 * @route GET /api/admin/analytics/revenue/by-station
 * @access Admin
 */
const getRevenueByStation = async (req, res, next) => {
  try {
    const data = await analyticsService.getRevenueByStation(req.query);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get revenue breakdown by payment method
 * @route GET /api/admin/analytics/revenue/by-payment-method
 * @access Admin
 */
const getRevenueByPaymentMethod = async (req, res, next) => {
  try {
    const data = await analyticsService.getRevenueByPaymentMethod(req.query);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get booking metrics & summary
 * @route GET /api/admin/analytics/bookings
 * @access Admin
 */
const getBookings = async (req, res, next) => {
  try {
    const data = await analyticsService.getBookingAnalytics(req.query);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get daily bookings trend
 * @route GET /api/admin/analytics/bookings/daily
 * @access Admin
 */
const getDailyBookings = async (req, res, next) => {
  try {
    const data = await analyticsService.getDailyBookings(req.query);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get bookings grouped by station
 * @route GET /api/admin/analytics/bookings/by-station
 * @access Admin
 */
const getBookingsByStation = async (req, res, next) => {
  try {
    const data = await analyticsService.getBookingsByStation(req.query);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get bookings distribution by status
 * @route GET /api/admin/analytics/bookings/by-status
 * @access Admin
 */
const getBookingsByStatus = async (req, res, next) => {
  try {
    const data = await analyticsService.getBookingsByStatus(req.query);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get peak hours distribution (0-23 hours)
 * @route GET /api/admin/analytics/bookings/peak-hours
 * @access Admin
 */
const getPeakHours = async (req, res, next) => {
  try {
    const data = await analyticsService.getPeakHours(req.query);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get charging session analytics
 * @route GET /api/admin/analytics/sessions
 * @access Admin
 */
const getSessions = async (req, res, next) => {
  try {
    const data = await analyticsService.getSessionAnalytics(req.query);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get daily session trend
 * @route GET /api/admin/analytics/sessions/daily
 * @access Admin
 */
const getDailySessions = async (req, res, next) => {
  try {
    const data = await analyticsService.getDailySessions(req.query);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get sessions by station
 * @route GET /api/admin/analytics/sessions/by-station
 * @access Admin
 */
const getSessionsByStation = async (req, res, next) => {
  try {
    const data = await analyticsService.getSessionsByStation(req.query);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get energy summary
 * @route GET /api/admin/analytics/energy
 * @access Admin
 */
const getEnergy = async (req, res, next) => {
  try {
    const data = await analyticsService.getEnergyAnalytics(req.query);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get daily energy consumption trend
 * @route GET /api/admin/analytics/energy/daily
 * @access Admin
 */
const getDailyEnergy = async (req, res, next) => {
  try {
    const data = await analyticsService.getDailyEnergy(req.query);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get monthly energy consumption
 * @route GET /api/admin/analytics/energy/monthly
 * @access Admin
 */
const getMonthlyEnergy = async (req, res, next) => {
  try {
    const data = await analyticsService.getMonthlyEnergy(req.query);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get energy by station
 * @route GET /api/admin/analytics/energy/by-station
 * @access Admin
 */
const getEnergyByStation = async (req, res, next) => {
  try {
    const data = await analyticsService.getEnergyByStation(req.query);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get energy by charger
 * @route GET /api/admin/analytics/energy/by-charger
 * @access Admin
 */
const getEnergyByCharger = async (req, res, next) => {
  try {
    const data = await analyticsService.getEnergyByCharger(req.query);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get charger utilization & status analytics
 * @route GET /api/admin/analytics/chargers
 * @access Admin
 */
const getChargers = async (req, res, next) => {
  try {
    const data = await analyticsService.getChargerAnalytics(req.query);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get station performance matrix
 * @route GET /api/admin/analytics/stations
 * @access Admin
 */
const getStations = async (req, res, next) => {
  try {
    const data = await analyticsService.getStationPerformance(req.query);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get payment status and breakdown analytics
 * @route GET /api/admin/analytics/payments/status
 * @access Admin
 */
const getPayments = async (req, res, next) => {
  try {
    const data = await analyticsService.getPaymentAnalytics(req.query);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get user analytics
 * @route GET /api/admin/analytics/users
 * @access Admin
 */
const getUsers = async (req, res, next) => {
  try {
    const data = await analyticsService.getUserAnalytics(req.query);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverview,
  getRevenue,
  getDailyRevenue,
  getMonthlyRevenue,
  getRevenueByStation,
  getRevenueByPaymentMethod,
  getBookings,
  getDailyBookings,
  getBookingsByStation,
  getBookingsByStatus,
  getPeakHours,
  getSessions,
  getDailySessions,
  getSessionsByStation,
  getEnergy,
  getDailyEnergy,
  getMonthlyEnergy,
  getEnergyByStation,
  getEnergyByCharger,
  getChargers,
  getStations,
  getPayments,
  getUsers,
};
