const mongoose = require('mongoose');
const User = require('../models/User');
const ChargingStation = require('../models/ChargingStation');
const Charger = require('../models/Charger');
const Booking = require('../models/Booking');
const ChargingSession = require('../models/ChargingSession');
const Payment = require('../models/Payment');
const {
  TIMEZONE,
  roundMoney,
  calculatePercentage,
  parseDateRange,
  buildCommonMatchQuery,
  buildIdMatch,
} = require('../utils/analyticsHelpers');

/**
 * 1. OVERVIEW ANALYTICS
 * Returns comprehensive system summary for the selected period
 */
const getOverviewAnalytics = async (params = {}) => {
  const dateInfo = parseDateRange(params);
  const { startUTC, endUTC, fromDateStr, toDateStr } = dateInfo;

  // Station filter if applied
  const stationFilter = params.stationId ? buildIdMatch('stationId', params.stationId) : null;
  const chargerFilter = params.chargerId ? buildIdMatch('chargerId', params.chargerId) : null;

  // Build match filters
  const bookingMatch = {
    createdAt: { $gte: startUTC, $lte: endUTC },
    ...(stationFilter || {}),
    ...(chargerFilter || {}),
  };

  const sessionMatch = {
    createdAt: { $gte: startUTC, $lte: endUTC },
    ...(stationFilter || {}),
    ...(chargerFilter || {}),
  };

  const paymentMatch = {
    createdAt: { $gte: startUTC, $lte: endUTC },
    ...(stationFilter || {}),
    ...(chargerFilter || {}),
  };

  // Run aggregations in parallel
  const [
    userStats,
    stationStats,
    chargerStats,
    bookingStats,
    sessionStats,
    paymentStats,
  ] = await Promise.all([
    // User metrics
    User.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          newInPeriod: [
            { $match: { createdAt: { $gte: startUTC, $lte: endUTC }, role: 'user' } },
            { $count: 'count' },
          ],
        },
      },
    ]),

    // Station metrics
    ChargingStation.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          active: [{ $match: { status: 'active' } }, { $count: 'count' }],
        },
      },
    ]),

    // Charger metrics
    Charger.aggregate([
      ...(params.stationId ? [{ $match: { stationId: new mongoose.Types.ObjectId(params.stationId) } }] : []),
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),

    // Booking metrics
    Booking.aggregate([
      { $match: bookingMatch },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),

    // Session & Energy metrics
    ChargingSession.aggregate([
      { $match: sessionMatch },
      {
        $facet: {
          byStatus: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
              },
            },
          ],
          completedMetrics: [
            { $match: { status: 'completed' } },
            {
              $group: {
                _id: null,
                totalKwh: { $sum: '$energyConsumedKwh' },
                avgKwh: { $avg: '$energyConsumedKwh' },
                avgDuration: { $avg: '$actualDurationMinutes' },
                completedCount: { $sum: 1 },
              },
            },
          ],
          activeCount: [
            { $match: { status: { $in: ['initiated', 'charging', 'paused'] } } },
            { $count: 'count' },
          ],
        },
      },
    ]),

    // Payment & Revenue metrics
    Payment.aggregate([
      { $match: paymentMatch },
      {
        $group: {
          _id: '$status',
          totalAmount: { $sum: '$amount' },
          refundAmount: { $sum: '$refundAmount' },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  // Process Users
  const totalUsers = userStats[0]?.total[0]?.count || 0;
  const newUsers = userStats[0]?.newInPeriod[0]?.count || 0;

  // Process Stations
  const totalStations = stationStats[0]?.total[0]?.count || 0;
  const activeStations = stationStats[0]?.active[0]?.count || 0;

  // Process Chargers
  let totalChargers = 0;
  const chargerStatusMap = {
    available: 0,
    reserved: 0,
    charging: 0,
    maintenance: 0,
    offline: 0,
  };
  (chargerStats || []).forEach((c) => {
    if (c._id && chargerStatusMap[c._id] !== undefined) {
      chargerStatusMap[c._id] = c.count;
    }
    totalChargers += c.count;
  });

  // Process Bookings
  let totalBookings = 0;
  const bookingStatusMap = {
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    expired: 0,
    active: 0,
  };
  (bookingStats || []).forEach((b) => {
    totalBookings += b.count;
    if (b._id === 'confirmed') bookingStatusMap.confirmed += b.count;
    else if (b._id === 'completed') bookingStatusMap.completed += b.count;
    else if (b._id === 'cancelled') bookingStatusMap.cancelled += b.count;
    else if (b._id === 'expired') bookingStatusMap.expired += b.count;
    else if (b._id === 'checked_in' || b._id === 'charging') {
      bookingStatusMap.active += b.count;
    }
  });

  // Process Sessions & Energy
  const sessionFacet = sessionStats[0] || {};
  let totalSessions = 0;
  (sessionFacet.byStatus || []).forEach((s) => {
    totalSessions += s.count;
  });
  const completedSessionData = sessionFacet.completedMetrics?.[0] || {};
  const activeSessionsCount = sessionFacet.activeCount?.[0]?.count || 0;
  const completedSessionsCount = completedSessionData.completedCount || 0;
  const totalEnergyKwh = roundMoney(completedSessionData.totalKwh || 0);
  const avgEnergyPerSession = roundMoney(completedSessionData.avgKwh || 0);
  const avgDurationMinutes = roundMoney(completedSessionData.avgDuration || 0);

  // Process Revenue
  let grossRevenue = 0;
  let totalRefunds = 0;
  let pendingAmount = 0;
  let paidTransactions = 0;

  (paymentStats || []).forEach((p) => {
    if (p._id === 'paid' || p._id === 'refunded' || p._id === 'partially_refunded') {
      grossRevenue += p.totalAmount;
      totalRefunds += p.refundAmount || 0;
      paidTransactions += p.count;
    } else if (p._id === 'pending' || p._id === 'created' || p._id === 'processing') {
      pendingAmount += p.totalAmount;
    }
  });

  grossRevenue = roundMoney(grossRevenue);
  totalRefunds = roundMoney(totalRefunds);
  const netRevenue = roundMoney(grossRevenue - totalRefunds);
  pendingAmount = roundMoney(pendingAmount);
  const avgTransactionValue = paidTransactions > 0 ? roundMoney(grossRevenue / paidTransactions) : 0;

  return {
    period: {
      fromDate: fromDateStr,
      toDate: toDateStr,
    },
    users: {
      total: totalUsers,
      new: newUsers,
    },
    stations: {
      total: totalStations,
      active: activeStations,
    },
    chargers: {
      total: totalChargers,
      ...chargerStatusMap,
    },
    bookings: {
      total: totalBookings,
      ...bookingStatusMap,
    },
    sessions: {
      total: totalSessions,
      active: activeSessionsCount,
      completed: completedSessionsCount,
      averageDurationMinutes: avgDurationMinutes,
    },
    energy: {
      totalKwh: totalEnergyKwh,
      averageKwhPerSession: avgEnergyPerSession,
    },
    revenue: {
      grossRevenue,
      refunds: totalRefunds,
      netRevenue,
      pendingAmount,
      averageTransactionValue: avgTransactionValue,
      paidTransactions,
    },
  };
};

/**
 * 2. REVENUE ANALYTICS
 */
const getRevenueOverview = async (params = {}) => {
  const match = buildCommonMatchQuery('createdAt', params);

  const stats = await Payment.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        totalAmount: { $sum: '$amount' },
        refundAmount: { $sum: '$refundAmount' },
        count: { $sum: 1 },
      },
    },
  ]);

  let grossRevenue = 0;
  let refunds = 0;
  let pendingAmount = 0;
  let paidCount = 0;
  let failedCount = 0;

  stats.forEach((s) => {
    if (['paid', 'refunded', 'partially_refunded'].includes(s._id)) {
      grossRevenue += s.totalAmount;
      refunds += s.refundAmount || 0;
      paidCount += s.count;
    } else if (['pending', 'created', 'processing'].includes(s._id)) {
      pendingAmount += s.totalAmount;
    } else if (s._id === 'failed') {
      failedCount += s.count;
    }
  });

  grossRevenue = roundMoney(grossRevenue);
  refunds = roundMoney(refunds);
  const netRevenue = roundMoney(grossRevenue - refunds);

  return {
    grossRevenue,
    refunds,
    netRevenue,
    pendingAmount: roundMoney(pendingAmount),
    paidTransactions: paidCount,
    failedTransactions: failedCount,
    averageTransactionValue: paidCount > 0 ? roundMoney(grossRevenue / paidCount) : 0,
  };
};

/**
 * Daily Revenue Grouping (Asia/Kolkata timezone)
 */
const getDailyRevenue = async (params = {}) => {
  const match = buildCommonMatchQuery('createdAt', {
    ...params,
    // Include paid and refund records
  });
  match.status = { $in: ['paid', 'refunded', 'partially_refunded'] };

  const data = await Payment.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$createdAt',
            timezone: TIMEZONE,
          },
        },
        grossRevenue: { $sum: '$amount' },
        refunds: { $sum: '$refundAmount' },
        transactions: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        date: '$_id',
        grossRevenue: { $round: ['$grossRevenue', 2] },
        refunds: { $round: ['$refunds', 2] },
        netRevenue: { $round: [{ $subtract: ['$grossRevenue', '$refunds'] }, 2] },
        transactions: 1,
      },
    },
  ]);

  return data;
};

/**
 * Monthly Revenue Grouping (Asia/Kolkata timezone)
 */
const getMonthlyRevenue = async (params = {}) => {
  const match = buildCommonMatchQuery('createdAt', params);
  match.status = { $in: ['paid', 'refunded', 'partially_refunded'] };

  const data = await Payment.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m',
            date: '$createdAt',
            timezone: TIMEZONE,
          },
        },
        grossRevenue: { $sum: '$amount' },
        refunds: { $sum: '$refundAmount' },
        transactions: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        month: '$_id',
        grossRevenue: { $round: ['$grossRevenue', 2] },
        refunds: { $round: ['$refunds', 2] },
        netRevenue: { $round: [{ $subtract: ['$grossRevenue', '$refunds'] }, 2] },
        transactions: 1,
      },
    },
  ]);

  return data;
};

/**
 * Revenue by Station
 */
const getRevenueByStation = async (params = {}) => {
  const match = buildCommonMatchQuery('createdAt', params);
  match.status = { $in: ['paid', 'refunded', 'partially_refunded'] };

  const data = await Payment.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$stationId',
        grossRevenue: { $sum: '$amount' },
        refunds: { $sum: '$refundAmount' },
        transactions: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'chargingstations',
        localField: '_id',
        foreignField: '_id',
        as: 'station',
      },
    },
    { $unwind: { path: '$station', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        stationId: '$_id',
        stationName: { $ifNull: ['$station.name', 'Unknown Station'] },
        city: { $ifNull: ['$station.city', ''] },
        grossRevenue: { $round: ['$grossRevenue', 2] },
        refunds: { $round: ['$refunds', 2] },
        netRevenue: { $round: [{ $subtract: ['$grossRevenue', '$refunds'] }, 2] },
        transactions: 1,
      },
    },
    { $sort: { grossRevenue: -1 } },
  ]);

  return data;
};

/**
 * Revenue by Payment Method
 */
const getRevenueByPaymentMethod = async (params = {}) => {
  const match = buildCommonMatchQuery('createdAt', params);
  match.status = { $in: ['paid', 'refunded', 'partially_refunded'] };

  const data = await Payment.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$paymentMethod',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { totalAmount: -1 } },
    {
      $project: {
        _id: 0,
        method: '$_id',
        totalAmount: { $round: ['$totalAmount', 2] },
        count: 1,
      },
    },
  ]);

  return data;
};

/**
 * 3. BOOKING ANALYTICS
 */
const getBookingAnalytics = async (params = {}) => {
  const match = buildCommonMatchQuery('createdAt', params);

  const [statusStats, durationStats] = await Promise.all([
    Booking.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),
    Booking.aggregate([
      { $match: { ...match, status: 'completed' } },
      {
        $project: {
          durationMinutes: {
            $divide: [{ $subtract: ['$endTime', '$startTime'] }, 60000],
          },
        },
      },
      {
        $group: {
          _id: null,
          avgDuration: { $avg: '$durationMinutes' },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  let totalBookings = 0;
  let confirmed = 0;
  let completed = 0;
  let cancelled = 0;
  let expired = 0;
  let active = 0;

  statusStats.forEach((s) => {
    totalBookings += s.count;
    if (s._id === 'confirmed') confirmed += s.count;
    else if (s._id === 'completed') completed += s.count;
    else if (s._id === 'cancelled') cancelled += s.count;
    else if (s._id === 'expired') expired += s.count;
    else if (s._id === 'checked_in' || s._id === 'charging') active += s.count;
  });

  const cancellationRate = calculatePercentage(cancelled, totalBookings);
  const avgBookingDuration = roundMoney(durationStats[0]?.avgDuration || 0);

  return {
    totalBookings,
    confirmed,
    completed,
    cancelled,
    expired,
    active,
    cancellationRate,
    averageDurationMinutes: avgBookingDuration,
  };
};

/**
 * Daily Bookings Breakdown
 */
const getDailyBookings = async (params = {}) => {
  const match = buildCommonMatchQuery('createdAt', params);

  const data = await Booking.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$createdAt',
            timezone: TIMEZONE,
          },
        },
        total: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
        },
        cancelled: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
        },
        confirmed: {
          $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] },
        },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        date: '$_id',
        total: 1,
        completed: 1,
        cancelled: 1,
        confirmed: 1,
      },
    },
  ]);

  return data;
};

/**
 * Bookings by Station
 */
const getBookingsByStation = async (params = {}) => {
  const match = buildCommonMatchQuery('createdAt', params);

  const data = await Booking.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$stationId',
        total: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
        },
        cancelled: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
        },
      },
    },
    {
      $lookup: {
        from: 'chargingstations',
        localField: '_id',
        foreignField: '_id',
        as: 'station',
      },
    },
    { $unwind: { path: '$station', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        stationId: '$_id',
        stationName: { $ifNull: ['$station.name', 'Unknown Station'] },
        total: 1,
        completed: 1,
        cancelled: 1,
        cancellationRate: {
          $cond: [
            { $gt: ['$total', 0] },
            { $round: [{ $multiply: [{ $divide: ['$cancelled', '$total'] }, 100] }, 2] },
            0,
          ],
        },
      },
    },
    { $sort: { total: -1 } },
  ]);

  return data;
};

/**
 * Bookings by Status
 */
const getBookingsByStatus = async (params = {}) => {
  const match = buildCommonMatchQuery('createdAt', params);

  const data = await Booking.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    {
      $project: {
        _id: 0,
        status: '$_id',
        count: 1,
      },
    },
  ]);

  return data;
};

/**
 * Peak Charging Hours (0 to 23 hours in Asia/Kolkata timezone)
 * Analyzes startTime of bookings
 */
const getPeakHours = async (params = {}) => {
  const match = buildCommonMatchQuery('startTime', params);

  const hourStats = await Booking.aggregate([
    { $match: match },
    {
      $project: {
        hour: {
          $hour: {
            date: '$startTime',
            timezone: TIMEZONE,
          },
        },
      },
    },
    {
      $group: {
        _id: '$hour',
        bookingCount: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const hourMap = {};
  hourStats.forEach((h) => {
    hourMap[h._id] = h.bookingCount;
  });

  // Ensure all 24 hours (0-23) are represented
  const full24Hours = [];
  for (let i = 0; i < 24; i++) {
    const ampm = i >= 12 ? 'PM' : 'AM';
    const displayHour = i % 12 === 0 ? 12 : i % 12;
    full24Hours.push({
      hour: i,
      label: `${displayHour} ${ampm}`,
      bookingCount: hourMap[i] || 0,
    });
  }

  return full24Hours;
};

/**
 * 4. CHARGING SESSION ANALYTICS
 */
const getSessionAnalytics = async (params = {}) => {
  const match = buildCommonMatchQuery('createdAt', params);

  const [stats, statusDist] = await Promise.all([
    ChargingSession.aggregate([
      { $match: match },
      {
        $facet: {
          all: [
            {
              $group: {
                _id: null,
                totalSessions: { $sum: 1 },
              },
            },
          ],
          completed: [
            { $match: { status: 'completed' } },
            {
              $group: {
                _id: null,
                completedCount: { $sum: 1 },
                totalEnergy: { $sum: '$energyConsumedKwh' },
                avgEnergy: { $avg: '$energyConsumedKwh' },
                avgDuration: { $avg: '$actualDurationMinutes' },
                minDuration: { $min: '$actualDurationMinutes' },
                maxDuration: { $max: '$actualDurationMinutes' },
              },
            },
          ],
          active: [
            { $match: { status: { $in: ['initiated', 'charging', 'paused'] } } },
            { $count: 'count' },
          ],
        },
      },
    ]),
    ChargingSession.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const allCount = stats[0]?.all[0]?.totalSessions || 0;
  const comp = stats[0]?.completed[0] || {};
  const activeCount = stats[0]?.active[0]?.count || 0;

  return {
    totalSessions: allCount,
    activeSessions: activeCount,
    completedSessions: comp.completedCount || 0,
    averageDurationMinutes: roundMoney(comp.avgDuration || 0),
    minDurationMinutes: roundMoney(comp.minDuration || 0),
    maxDurationMinutes: roundMoney(comp.maxDuration || 0),
    totalEnergyConsumedKwh: roundMoney(comp.totalEnergy || 0),
    averageEnergyConsumedKwh: roundMoney(comp.avgEnergy || 0),
    byStatus: statusDist.map((s) => ({ status: s._id, count: s.count })),
  };
};

/**
 * Daily Session Breakdown
 */
const getDailySessions = async (params = {}) => {
  const match = buildCommonMatchQuery('createdAt', params);

  const data = await ChargingSession.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$createdAt',
            timezone: TIMEZONE,
          },
        },
        total: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
        },
        energyKwh: {
          $sum: {
            $cond: [{ $eq: ['$status', 'completed'] }, '$energyConsumedKwh', 0],
          },
        },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        date: '$_id',
        total: 1,
        completed: 1,
        energyKwh: { $round: ['$energyKwh', 2] },
      },
    },
  ]);

  return data;
};

/**
 * Sessions by Station
 */
const getSessionsByStation = async (params = {}) => {
  const match = buildCommonMatchQuery('createdAt', params);

  const data = await ChargingSession.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$stationId',
        total: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
        },
        totalEnergyKwh: {
          $sum: {
            $cond: [{ $eq: ['$status', 'completed'] }, '$energyConsumedKwh', 0],
          },
        },
      },
    },
    {
      $lookup: {
        from: 'chargingstations',
        localField: '_id',
        foreignField: '_id',
        as: 'station',
      },
    },
    { $unwind: { path: '$station', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        stationId: '$_id',
        stationName: { $ifNull: ['$station.name', 'Unknown Station'] },
        total: 1,
        completed: 1,
        totalEnergyKwh: { $round: ['$totalEnergyKwh', 2] },
      },
    },
    { $sort: { total: -1 } },
  ]);

  return data;
};

/**
 * 5. ENERGY CONSUMPTION ANALYTICS
 */
const getEnergyAnalytics = async (params = {}) => {
  const match = buildCommonMatchQuery('createdAt', params);
  match.status = 'completed';

  const stats = await ChargingSession.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalKwh: { $sum: '$energyConsumedKwh' },
        avgKwh: { $avg: '$energyConsumedKwh' },
        maxKwh: { $max: '$energyConsumedKwh' },
        minKwh: { $min: '$energyConsumedKwh' },
        completedSessions: { $sum: 1 },
      },
    },
  ]);

  const s = stats[0] || {};
  return {
    totalKwh: roundMoney(s.totalKwh || 0),
    averageKwhPerSession: roundMoney(s.avgKwh || 0),
    maxSessionEnergyKwh: roundMoney(s.maxKwh || 0),
    minSessionEnergyKwh: roundMoney(s.minKwh || 0),
    completedSessions: s.completedSessions || 0,
  };
};

/**
 * Daily Energy Consumption
 */
const getDailyEnergy = async (params = {}) => {
  const match = buildCommonMatchQuery('createdAt', params);
  match.status = 'completed';

  const data = await ChargingSession.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$createdAt',
            timezone: TIMEZONE,
          },
        },
        energyConsumedKwh: { $sum: '$energyConsumedKwh' },
        completedSessions: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        date: '$_id',
        energyConsumedKwh: { $round: ['$energyConsumedKwh', 2] },
        completedSessions: 1,
        averageKwh: {
          $cond: [
            { $gt: ['$completedSessions', 0] },
            { $round: [{ $divide: ['$energyConsumedKwh', '$completedSessions'] }, 2] },
            0,
          ],
        },
      },
    },
  ]);

  return data;
};

/**
 * Monthly Energy Consumption
 */
const getMonthlyEnergy = async (params = {}) => {
  const match = buildCommonMatchQuery('createdAt', params);
  match.status = 'completed';

  const data = await ChargingSession.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m',
            date: '$createdAt',
            timezone: TIMEZONE,
          },
        },
        energyConsumedKwh: { $sum: '$energyConsumedKwh' },
        completedSessions: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        month: '$_id',
        energyConsumedKwh: { $round: ['$energyConsumedKwh', 2] },
        completedSessions: 1,
      },
    },
  ]);

  return data;
};

/**
 * Energy by Station
 */
const getEnergyByStation = async (params = {}) => {
  const match = buildCommonMatchQuery('createdAt', params);
  match.status = 'completed';

  const data = await ChargingSession.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$stationId',
        energyConsumedKwh: { $sum: '$energyConsumedKwh' },
        completedSessions: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'chargingstations',
        localField: '_id',
        foreignField: '_id',
        as: 'station',
      },
    },
    { $unwind: { path: '$station', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        stationId: '$_id',
        stationName: { $ifNull: ['$station.name', 'Unknown Station'] },
        city: { $ifNull: ['$station.city', ''] },
        energyConsumedKwh: { $round: ['$energyConsumedKwh', 2] },
        completedSessions: 1,
        averageKwhPerSession: {
          $cond: [
            { $gt: ['$completedSessions', 0] },
            { $round: [{ $divide: ['$energyConsumedKwh', '$completedSessions'] }, 2] },
            0,
          ],
        },
      },
    },
    { $sort: { energyConsumedKwh: -1 } },
  ]);

  return data;
};

/**
 * Energy by Charger
 */
const getEnergyByCharger = async (params = {}) => {
  const match = buildCommonMatchQuery('createdAt', params);
  match.status = 'completed';

  const data = await ChargingSession.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$chargerId',
        stationId: { $first: '$stationId' },
        energyConsumedKwh: { $sum: '$energyConsumedKwh' },
        completedSessions: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'chargers',
        localField: '_id',
        foreignField: '_id',
        as: 'charger',
      },
    },
    { $unwind: { path: '$charger', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'chargingstations',
        localField: 'stationId',
        foreignField: '_id',
        as: 'station',
      },
    },
    { $unwind: { path: '$station', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        chargerId: '$_id',
        chargerNumber: { $ifNull: ['$charger.chargerNumber', 'Unknown Charger'] },
        stationName: { $ifNull: ['$station.name', 'Unknown Station'] },
        energyConsumedKwh: { $round: ['$energyConsumedKwh', 2] },
        completedSessions: 1,
      },
    },
    { $sort: { energyConsumedKwh: -1 } },
  ]);

  return data;
};

/**
 * 6. CHARGER UTILIZATION ANALYTICS
 */
const getChargerAnalytics = async (params = {}) => {
  const dateInfo = parseDateRange(params);
  const { startUTC, endUTC } = dateInfo;

  // Days in selected period
  const durationDays = Math.max(1, (endUTC.getTime() - startUTC.getTime()) / (24 * 3600 * 1000));
  // Standard operating hours: 24h per day = 1440 minutes/day per charger
  const operatingMinutesPerCharger = durationDays * 24 * 60;

  const stationMatch = params.stationId ? { stationId: new mongoose.Types.ObjectId(params.stationId) } : {};

  // 1. Get all chargers
  const chargers = await Charger.find(stationMatch).populate('stationId', 'name city').lean();

  // 2. Aggregate session charging duration for chargers
  const sessionMatch = buildCommonMatchQuery('createdAt', params);
  sessionMatch.status = 'completed';

  const sessionDurationByCharger = await ChargingSession.aggregate([
    { $match: sessionMatch },
    {
      $group: {
        _id: '$chargerId',
        chargingMinutes: { $sum: '$actualDurationMinutes' },
        energyConsumedKwh: { $sum: '$energyConsumedKwh' },
        completedSessions: { $sum: 1 },
      },
    },
  ]);

  // 3. Aggregate booking duration for chargers
  const bookingMatch = buildCommonMatchQuery('createdAt', params);
  bookingMatch.status = { $in: ['confirmed', 'checked_in', 'charging', 'completed'] };

  const bookingDurationByCharger = await Booking.aggregate([
    { $match: bookingMatch },
    {
      $project: {
        chargerId: 1,
        bookedMinutes: {
          $divide: [{ $subtract: ['$endTime', '$startTime'] }, 60000],
        },
      },
    },
    {
      $group: {
        _id: '$chargerId',
        bookedMinutes: { $sum: '$bookedMinutes' },
        totalBookings: { $sum: 1 },
      },
    },
  ]);

  const sessionMap = {};
  sessionDurationByCharger.forEach((s) => {
    sessionMap[s._id.toString()] = s;
  });

  const bookingMap = {};
  bookingDurationByCharger.forEach((b) => {
    bookingMap[b._id.toString()] = b;
  });

  // Calculate metrics per charger
  const chargerMetrics = chargers.map((c) => {
    const cid = c._id.toString();
    const sData = sessionMap[cid] || { chargingMinutes: 0, energyConsumedKwh: 0, completedSessions: 0 };
    const bData = bookingMap[cid] || { bookedMinutes: 0, totalBookings: 0 };

    const chargingMinutes = roundMoney(sData.chargingMinutes || 0);
    const bookedMinutes = roundMoney(bData.bookedMinutes || 0);
    const utilizationRate = calculatePercentage(bookedMinutes, operatingMinutesPerCharger);

    return {
      chargerId: c._id,
      chargerNumber: c.chargerNumber,
      stationId: c.stationId?._id || c.stationId,
      stationName: c.stationId?.name || 'Unknown Station',
      connectorType: c.connectorType,
      chargingSpeed: c.chargingSpeed,
      powerRating: c.powerRating,
      status: c.status,
      totalBookings: bData.totalBookings,
      completedSessions: sData.completedSessions,
      chargingMinutes,
      bookedMinutes,
      energyConsumedKwh: roundMoney(sData.energyConsumedKwh || 0),
      utilizationRate: Math.min(100, utilizationRate),
    };
  });

  // Sort top and least used
  const sorted = [...chargerMetrics].sort((a, b) => b.utilizationRate - a.utilizationRate);
  const topUsed = sorted.slice(0, 5);
  const leastUsed = [...sorted].reverse().slice(0, 5);

  // Status breakdown
  const statusDistribution = {
    available: 0,
    reserved: 0,
    charging: 0,
    maintenance: 0,
    offline: 0,
  };
  chargers.forEach((c) => {
    if (statusDistribution[c.status] !== undefined) {
      statusDistribution[c.status]++;
    }
  });

  return {
    metricType: 'booking_utilization',
    isApproximation: true,
    warning:
      'Utilization is estimated from bookings and simulated sessions. Physical charger uptime is not connected.',
    totalChargers: chargers.length,
    statusDistribution,
    topUsedChargers: topUsed,
    leastUsedChargers: leastUsed,
    chargers: chargerMetrics,
  };
};

/**
 * 7. STATION PERFORMANCE ANALYTICS
 */
const getStationPerformance = async (params = {}) => {
  const { sortBy = 'revenue', sortOrder = 'desc' } = params;
  const dateInfo = parseDateRange(params);
  const { startUTC, endUTC } = dateInfo;

  const stations = await ChargingStation.find().lean();
  if (!stations.length) return [];

  // Match filters
  const bookingMatch = { createdAt: { $gte: startUTC, $lte: endUTC } };
  const sessionMatch = { createdAt: { $gte: startUTC, $lte: endUTC } };
  const paymentMatch = {
    createdAt: { $gte: startUTC, $lte: endUTC },
    status: { $in: ['paid', 'refunded', 'partially_refunded'] },
  };

  // Run station-level aggregations
  const [chargerCounts, bookingData, sessionData, paymentData] = await Promise.all([
    // Charger counts by station
    Charger.aggregate([
      {
        $group: {
          _id: '$stationId',
          total: { $sum: 1 },
          available: {
            $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] },
          },
        },
      },
    ]),

    // Bookings by station
    Booking.aggregate([
      { $match: bookingMatch },
      {
        $group: {
          _id: '$stationId',
          totalBookings: { $sum: 1 },
          cancelledBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
          },
        },
      },
    ]),

    // Sessions & Energy by station
    ChargingSession.aggregate([
      { $match: sessionMatch },
      {
        $group: {
          _id: '$stationId',
          totalSessions: { $sum: 1 },
          completedSessions: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          totalEnergyKwh: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, '$energyConsumedKwh', 0],
            },
          },
          totalDurationMinutes: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, '$actualDurationMinutes', 0],
            },
          },
        },
      },
    ]),

    // Payments & Revenue by station
    Payment.aggregate([
      { $match: paymentMatch },
      {
        $group: {
          _id: '$stationId',
          grossRevenue: { $sum: '$amount' },
          refunds: { $sum: '$refundAmount' },
          paidCount: { $sum: 1 },
        },
      },
    ]),
  ]);

  const chargerMap = {};
  chargerCounts.forEach((c) => (chargerMap[c._id.toString()] = c));

  const bookingMap = {};
  bookingData.forEach((b) => (bookingMap[b._id.toString()] = b));

  const sessionMap = {};
  sessionData.forEach((s) => (sessionMap[s._id.toString()] = s));

  const paymentMap = {};
  paymentData.forEach((p) => (paymentMap[p._id.toString()] = p));

  const performanceList = stations.map((st) => {
    const sid = st._id.toString();
    const cStats = chargerMap[sid] || { total: 0, available: 0 };
    const bStats = bookingMap[sid] || { totalBookings: 0, cancelledBookings: 0 };
    const sStats = sessionMap[sid] || {
      totalSessions: 0,
      completedSessions: 0,
      totalEnergyKwh: 0,
      totalDurationMinutes: 0,
    };
    const pStats = paymentMap[sid] || { grossRevenue: 0, refunds: 0, paidCount: 0 };

    const grossRevenue = roundMoney(pStats.grossRevenue);
    const refunds = roundMoney(pStats.refunds);
    const netRevenue = roundMoney(grossRevenue - refunds);
    const totalEnergy = roundMoney(sStats.totalEnergyKwh);
    const cancellationRate = calculatePercentage(bStats.cancelledBookings, bStats.totalBookings);
    const avgDuration =
      sStats.completedSessions > 0
        ? roundMoney(sStats.totalDurationMinutes / sStats.completedSessions)
        : 0;
    const avgEnergy =
      sStats.completedSessions > 0
        ? roundMoney(totalEnergy / sStats.completedSessions)
        : 0;

    return {
      stationId: st._id,
      stationName: st.name,
      city: st.city,
      status: st.status,
      pricePerKwh: st.pricePerKwh,
      totalChargers: cStats.total,
      availableChargers: cStats.available,
      totalBookings: bStats.totalBookings,
      cancelledBookings: bStats.cancelledBookings,
      cancellationRate,
      totalSessions: sStats.totalSessions,
      completedSessions: sStats.completedSessions,
      energyConsumedKwh: totalEnergy,
      grossRevenue,
      refunds,
      netRevenue,
      averageSessionDuration: avgDuration,
      averageEnergyPerSession: avgEnergy,
    };
  });

  // Safe sorting
  const sortMultiplier = sortOrder === 'asc' ? 1 : -1;
  performanceList.sort((a, b) => {
    switch (sortBy) {
      case 'revenue':
      case 'grossRevenue':
        return (a.grossRevenue - b.grossRevenue) * sortMultiplier;
      case 'netRevenue':
        return (a.netRevenue - b.netRevenue) * sortMultiplier;
      case 'bookings':
      case 'totalBookings':
        return (a.totalBookings - b.totalBookings) * sortMultiplier;
      case 'energy':
      case 'energyConsumedKwh':
        return (a.energyConsumedKwh - b.energyConsumedKwh) * sortMultiplier;
      case 'sessions':
      case 'completedSessions':
        return (a.completedSessions - b.completedSessions) * sortMultiplier;
      case 'cancellationRate':
        return (a.cancellationRate - b.cancellationRate) * sortMultiplier;
      default:
        return (a.grossRevenue - b.grossRevenue) * sortMultiplier;
    }
  });

  return performanceList;
};

/**
 * 8. PAYMENT ANALYTICS
 */
const getPaymentAnalytics = async (params = {}) => {
  const match = buildCommonMatchQuery('createdAt', params);

  const [statusStats, methodStats, providerStats] = await Promise.all([
    Payment.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          refundAmount: { $sum: '$refundAmount' },
        },
      },
    ]),
    Payment.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
    ]),
    Payment.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$provider',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
    ]),
  ]);

  return {
    statusBreakdown: statusStats.map((s) => ({
      status: s._id,
      count: s.count,
      totalAmount: roundMoney(s.totalAmount),
      refundAmount: roundMoney(s.refundAmount || 0),
    })),
    methodBreakdown: methodStats.map((m) => ({
      method: m._id,
      count: m.count,
      totalAmount: roundMoney(m.totalAmount),
    })),
    providerBreakdown: providerStats.map((p) => ({
      provider: p._id,
      count: p.count,
      totalAmount: roundMoney(p.totalAmount),
    })),
  };
};

/**
 * 9. USER ANALYTICS
 */
const getUserAnalytics = async (params = {}) => {
  const dateInfo = parseDateRange(params);
  const { startUTC, endUTC } = dateInfo;

  const [totalUsers, newUsers, activeInBookings, activeInSessions, activeInPayments, dailyTrend] =
    await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({
        role: 'user',
        createdAt: { $gte: startUTC, $lte: endUTC },
      }),
      Booking.distinct('userId', { createdAt: { $gte: startUTC, $lte: endUTC } }),
      ChargingSession.distinct('userId', { createdAt: { $gte: startUTC, $lte: endUTC } }),
      Payment.distinct('userId', {
        createdAt: { $gte: startUTC, $lte: endUTC },
        status: { $in: ['paid', 'refunded', 'partially_refunded'] },
      }),
      User.aggregate([
        {
          $match: {
            role: 'user',
            createdAt: { $gte: startUTC, $lte: endUTC },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt',
                timezone: TIMEZONE,
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            date: '$_id',
            newUsers: '$count',
          },
        },
      ]),
    ]);

  return {
    totalUsers,
    newUsersInPeriod: newUsers,
    activeUsersWithBookings: activeInBookings.length,
    activeUsersWithSessions: activeInSessions.length,
    activeUsersWithPayments: activeInPayments.length,
    registrationTrend: dailyTrend,
  };
};

module.exports = {
  getOverviewAnalytics,
  getRevenueOverview,
  getDailyRevenue,
  getMonthlyRevenue,
  getRevenueByStation,
  getRevenueByPaymentMethod,
  getBookingAnalytics,
  getDailyBookings,
  getBookingsByStation,
  getBookingsByStatus,
  getPeakHours,
  getSessionAnalytics,
  getDailySessions,
  getSessionsByStation,
  getEnergyAnalytics,
  getDailyEnergy,
  getMonthlyEnergy,
  getEnergyByStation,
  getEnergyByCharger,
  getChargerAnalytics,
  getStationPerformance,
  getPaymentAnalytics,
  getUserAnalytics,
};
