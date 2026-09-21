const reportService = require('../services/reportService');

/**
 * @desc Get reports overview summary
 * @route GET /api/admin/reports/summary
 * @access Admin
 */
const getSummary = async (req, res, next) => {
  try {
    const data = await reportService.getReportSummary(req.query);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get paginated bookings report or export CSV
 * @route GET /api/admin/reports/bookings
 * @access Admin
 */
const getBookingsReport = async (req, res, next) => {
  try {
    if (req.query.format === 'csv' || req.query.export === 'csv') {
      const csv = await reportService.generateBookingsCSV(req.query);
      const filename = `bookings-report-${Date.now()}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(csv);
    }

    const data = await reportService.getPaginatedBookingsReport(req.query);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get paginated sessions report or export CSV
 * @route GET /api/admin/reports/sessions
 * @access Admin
 */
const getSessionsReport = async (req, res, next) => {
  try {
    if (req.query.format === 'csv' || req.query.export === 'csv') {
      const csv = await reportService.generateSessionsCSV(req.query);
      const filename = `sessions-report-${Date.now()}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(csv);
    }

    const data = await reportService.getPaginatedSessionsReport(req.query);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get paginated payments report or export CSV
 * @route GET /api/admin/reports/payments
 * @access Admin
 */
const getPaymentsReport = async (req, res, next) => {
  try {
    if (req.query.format === 'csv' || req.query.export === 'csv') {
      const csv = await reportService.generatePaymentsCSV(req.query);
      const filename = `payments-report-${Date.now()}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(csv);
    }

    const data = await reportService.getPaginatedPaymentsReport(req.query);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get paginated energy report or export CSV
 * @route GET /api/admin/reports/energy
 * @access Admin
 */
const getEnergyReport = async (req, res, next) => {
  try {
    if (req.query.format === 'csv' || req.query.export === 'csv') {
      const csv = await reportService.generateEnergyCSV(req.query);
      const filename = `energy-report-${Date.now()}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(csv);
    }

    const data = await reportService.getPaginatedEnergyReport(req.query);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSummary,
  getBookingsReport,
  getSessionsReport,
  getPaymentsReport,
  getEnergyReport,
};
