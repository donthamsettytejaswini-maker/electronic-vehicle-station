const Booking = require('../models/Booking');
const ChargingSession = require('../models/ChargingSession');
const Payment = require('../models/Payment');
const {
  buildCommonMatchQuery,
  convertToCSV,
  roundMoney,
} = require('../utils/analyticsHelpers');

/**
 * Common pagination options parser
 */
const parsePagination = (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * 1. BOOKINGS REPORT (Paginated)
 */
const getPaginatedBookingsReport = async (params = {}) => {
  const match = buildCommonMatchQuery('createdAt', params);
  const { page, limit, skip } = parsePagination(params);

  const [total, items] = await Promise.all([
    Booking.countDocuments(match),
    Booking.find(match)
      .populate('userId', 'name email phone')
      .populate('stationId', 'name city address')
      .populate('chargerId', 'chargerNumber connectorType powerRating')
      .populate('vehicleId', 'vehicleNumber brand model')
      .populate('paymentId', 'amount paymentReference status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return {
    items,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    },
  };
};

/**
 * Generate Bookings CSV
 */
const generateBookingsCSV = async (params = {}) => {
  const match = buildCommonMatchQuery('createdAt', params);
  // Cap CSV export at 2000 records to prevent memory exhaustion
  const items = await Booking.find(match)
    .populate('userId', 'name email')
    .populate('stationId', 'name')
    .populate('chargerId', 'chargerNumber')
    .populate('vehicleId', 'vehicleNumber')
    .sort({ createdAt: -1 })
    .limit(2000)
    .lean();

  const fields = [
    { label: 'Booking Reference', key: 'bookingReference' },
    { label: 'User Name', value: (i) => i.userId?.name || 'N/A' },
    { label: 'User Email', value: (i) => i.userId?.email || 'N/A' },
    { label: 'Vehicle Number', value: (i) => i.vehicleId?.vehicleNumber || 'N/A' },
    { label: 'Station Name', value: (i) => i.stationId?.name || 'N/A' },
    { label: 'Charger Number', value: (i) => i.chargerId?.chargerNumber || 'N/A' },
    {
      label: 'Booking Date',
      value: (i) => (i.startTime ? new Date(i.startTime).toISOString().substring(0, 10) : ''),
    },
    {
      label: 'Start Time',
      value: (i) => (i.startTime ? new Date(i.startTime).toISOString() : ''),
    },
    {
      label: 'End Time',
      value: (i) => (i.endTime ? new Date(i.endTime).toISOString() : ''),
    },
    {
      label: 'Duration (min)',
      value: (i) =>
        i.startTime && i.endTime
          ? Math.round((new Date(i.endTime) - new Date(i.startTime)) / 60000)
          : '',
    },
    { label: 'Booking Status', key: 'status' },
    { label: 'Payment Status', key: 'paymentStatus' },
  ];

  return convertToCSV(items, fields);
};

/**
 * 2. CHARGING SESSIONS REPORT (Paginated)
 */
const getPaginatedSessionsReport = async (params = {}) => {
  const match = buildCommonMatchQuery('createdAt', params);
  const { page, limit, skip } = parsePagination(params);

  const [total, items] = await Promise.all([
    ChargingSession.countDocuments(match),
    ChargingSession.find(match)
      .populate('userId', 'name email')
      .populate('bookingId', 'bookingReference')
      .populate('stationId', 'name city')
      .populate('chargerId', 'chargerNumber powerRating')
      .populate('vehicleId', 'vehicleNumber brand model')
      .populate('paymentId', 'amount paymentReference status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return {
    items,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    },
  };
};

/**
 * Generate Sessions CSV
 */
const generateSessionsCSV = async (params = {}) => {
  const match = buildCommonMatchQuery('createdAt', params);
  const items = await ChargingSession.find(match)
    .populate('bookingId', 'bookingReference')
    .populate('stationId', 'name')
    .populate('chargerId', 'chargerNumber')
    .populate('vehicleId', 'vehicleNumber')
    .sort({ createdAt: -1 })
    .limit(2000)
    .lean();

  const fields = [
    { label: 'Session Reference', key: 'sessionReference' },
    { label: 'Booking Reference', value: (i) => i.bookingId?.bookingReference || 'N/A' },
    { label: 'Station', value: (i) => i.stationId?.name || 'N/A' },
    { label: 'Charger', value: (i) => i.chargerId?.chargerNumber || 'N/A' },
    { label: 'Vehicle', value: (i) => i.vehicleId?.vehicleNumber || 'N/A' },
    {
      label: 'Start Time',
      value: (i) => (i.startedAt ? new Date(i.startedAt).toISOString() : ''),
    },
    {
      label: 'End Time',
      value: (i) => (i.completedAt ? new Date(i.completedAt).toISOString() : ''),
    },
    { label: 'Duration (min)', value: (i) => i.actualDurationMinutes || 0 },
    { label: 'Initial Battery (%)', key: 'initialBatteryPercentage' },
    { label: 'Final Battery (%)', key: 'currentBatteryPercentage' },
    { label: 'Energy Consumed (kWh)', key: 'energyConsumedKwh' },
    { label: 'Status', key: 'status' },
  ];

  return convertToCSV(items, fields);
};

/**
 * 3. PAYMENTS REPORT (Paginated)
 */
const getPaginatedPaymentsReport = async (params = {}) => {
  const match = buildCommonMatchQuery('createdAt', params);
  const { page, limit, skip } = parsePagination(params);

  const [total, items] = await Promise.all([
    Payment.countDocuments(match),
    Payment.find(match)
      .populate('userId', 'name email')
      .populate('stationId', 'name city')
      .populate('sessionId', 'sessionReference energyConsumedKwh')
      .populate('bookingId', 'bookingReference')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return {
    items,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    },
  };
};

/**
 * Generate Payments CSV
 */
const generatePaymentsCSV = async (params = {}) => {
  const match = buildCommonMatchQuery('createdAt', params);
  const items = await Payment.find(match)
    .populate('userId', 'name email')
    .populate('stationId', 'name')
    .populate('sessionId', 'sessionReference')
    .sort({ createdAt: -1 })
    .limit(2000)
    .lean();

  const fields = [
    { label: 'Payment Reference', key: 'paymentReference' },
    { label: 'Invoice Number', key: 'invoiceNumber' },
    { label: 'User', value: (i) => i.userId?.name || 'N/A' },
    { label: 'Station', value: (i) => i.stationId?.name || 'N/A' },
    { label: 'Session', value: (i) => i.sessionId?.sessionReference || 'N/A' },
    { label: 'Energy Consumed (kWh)', key: 'energyConsumedKwh' },
    { label: 'Amount', key: 'amount' },
    { label: 'Currency', key: 'currency' },
    { label: 'Provider', key: 'provider' },
    { label: 'Payment Method', key: 'paymentMethod' },
    { label: 'Status', key: 'status' },
    {
      label: 'Paid Date',
      value: (i) => (i.paidAt ? new Date(i.paidAt).toISOString() : ''),
    },
  ];

  return convertToCSV(items, fields);
};

/**
 * 4. ENERGY REPORT (Paginated)
 */
const getPaginatedEnergyReport = async (params = {}) => {
  const match = buildCommonMatchQuery('createdAt', params);
  match.status = 'completed';
  const { page, limit, skip } = parsePagination(params);

  const [total, items] = await Promise.all([
    ChargingSession.countDocuments(match),
    ChargingSession.find(match)
      .populate('stationId', 'name city pricePerKwh')
      .populate('chargerId', 'chargerNumber connectorType powerRating pricePerKwh')
      .populate('userId', 'name email')
      .populate('paymentId', 'amount status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return {
    items,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    },
  };
};

/**
 * Generate Energy CSV
 */
const generateEnergyCSV = async (params = {}) => {
  const match = buildCommonMatchQuery('createdAt', params);
  match.status = 'completed';

  const items = await ChargingSession.find(match)
    .populate('stationId', 'name pricePerKwh')
    .populate('chargerId', 'chargerNumber pricePerKwh')
    .populate('paymentId', 'amount')
    .sort({ createdAt: -1 })
    .limit(2000)
    .lean();

  const fields = [
    { label: 'Session Reference', key: 'sessionReference' },
    { label: 'Station Name', value: (i) => i.stationId?.name || 'N/A' },
    { label: 'Charger Number', value: (i) => i.chargerId?.chargerNumber || 'N/A' },
    {
      label: 'Date',
      value: (i) => (i.completedAt ? new Date(i.completedAt).toISOString().substring(0, 10) : ''),
    },
    { label: 'Energy Consumed (kWh)', key: 'energyConsumedKwh' },
    { label: 'Duration (min)', value: (i) => i.actualDurationMinutes || 0 },
    {
      label: 'Rate per kWh',
      value: (i) => i.chargerId?.pricePerKwh || i.stationId?.pricePerKwh || 0,
    },
    { label: 'Total Billed Amount', value: (i) => i.finalBillAmount || i.paymentId?.amount || 0 },
  ];

  return convertToCSV(items, fields);
};

/**
 * Summary for Reports Hub
 */
const getReportSummary = async (params = {}) => {
  const match = buildCommonMatchQuery('createdAt', params);

  const [bookingCount, sessionCount, paymentData, energyData] = await Promise.all([
    Booking.countDocuments(match),
    ChargingSession.countDocuments(match),
    Payment.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]),
    ChargingSession.aggregate([
      { $match: { ...match, status: 'completed' } },
      {
        $group: {
          _id: null,
          totalKwh: { $sum: '$energyConsumedKwh' },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  let paidRevenue = 0;
  let paidCount = 0;
  paymentData.forEach((p) => {
    if (['paid', 'refunded', 'partially_refunded'].includes(p._id)) {
      paidRevenue += p.total;
      paidCount += p.count;
    }
  });

  return {
    totalBookings: bookingCount,
    totalSessions: sessionCount,
    paidTransactions: paidCount,
    totalRevenue: roundMoney(paidRevenue),
    totalEnergyKwh: roundMoney(energyData[0]?.totalKwh || 0),
  };
};

module.exports = {
  getPaginatedBookingsReport,
  generateBookingsCSV,
  getPaginatedSessionsReport,
  generateSessionsCSV,
  getPaginatedPaymentsReport,
  generatePaymentsCSV,
  getPaginatedEnergyReport,
  generateEnergyCSV,
  getReportSummary,
};
