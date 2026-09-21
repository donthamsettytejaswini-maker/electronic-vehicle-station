/**
 * Analytics helper functions and aggregation pipeline builders
 * Timezone support for Asia/Kolkata (UTC+05:30)
 */

const TIMEZONE = 'Asia/Kolkata';
const TIMEZONE_OFFSET_HOURS = 5.5;

/**
 * Format and round money to 2 decimal places safely
 */
const roundMoney = (val) => {
  if (val === null || val === undefined || isNaN(val)) return 0;
  return Math.round(Number(val) * 100) / 100;
};

/**
 * Calculate percentage safely preventing divide by zero
 */
const calculatePercentage = (numerator, denominator) => {
  if (!denominator || denominator === 0 || isNaN(denominator) || isNaN(numerator)) {
    return 0;
  }
  return roundMoney((Number(numerator) / Number(denominator)) * 100);
};

/**
 * Parse date range presets or custom ISO dates into UTC start and end Date objects
 * for Asia/Kolkata timezone boundaries.
 */
const parseDateRange = (params = {}) => {
  const { preset, fromDate, toDate } = params;
  const now = new Date();

  // Shift current UTC time to Asia/Kolkata local date representation
  const kolkataTime = new Date(now.getTime() + TIMEZONE_OFFSET_HOURS * 3600 * 1000);
  const curYear = kolkataTime.getUTCFullYear();
  const curMonth = kolkataTime.getUTCMonth();
  const curDate = kolkataTime.getUTCDate();

  let startKolkata;
  let endKolkata;

  if (preset) {
    switch (preset.toLowerCase()) {
      case 'today':
        startKolkata = new Date(Date.UTC(curYear, curMonth, curDate, 0, 0, 0, 0));
        endKolkata = new Date(Date.UTC(curYear, curMonth, curDate, 23, 59, 59, 999));
        break;
      case 'yesterday':
        startKolkata = new Date(Date.UTC(curYear, curMonth, curDate - 1, 0, 0, 0, 0));
        endKolkata = new Date(Date.UTC(curYear, curMonth, curDate - 1, 23, 59, 59, 999));
        break;
      case 'last_7_days':
      case 'last7days':
      case '7days':
        startKolkata = new Date(Date.UTC(curYear, curMonth, curDate - 6, 0, 0, 0, 0));
        endKolkata = new Date(Date.UTC(curYear, curMonth, curDate, 23, 59, 59, 999));
        break;
      case 'this_month':
      case 'thismonth':
        startKolkata = new Date(Date.UTC(curYear, curMonth, 1, 0, 0, 0, 0));
        endKolkata = new Date(Date.UTC(curYear, curMonth, curDate, 23, 59, 59, 999));
        break;
      case 'previous_month':
      case 'last_month':
      case 'lastmonth':
        startKolkata = new Date(Date.UTC(curYear, curMonth - 1, 1, 0, 0, 0, 0));
        // Day 0 of current month is last day of previous month
        const lastDayPrev = new Date(Date.UTC(curYear, curMonth, 0)).getUTCDate();
        endKolkata = new Date(Date.UTC(curYear, curMonth - 1, lastDayPrev, 23, 59, 59, 999));
        break;
      case 'last_30_days':
      case 'last30days':
      case '30days':
      default:
        startKolkata = new Date(Date.UTC(curYear, curMonth, curDate - 29, 0, 0, 0, 0));
        endKolkata = new Date(Date.UTC(curYear, curMonth, curDate, 23, 59, 59, 999));
        break;
    }
  } else if (fromDate || toDate) {
    if (fromDate) {
      const f = new Date(fromDate);
      if (!isNaN(f.getTime())) {
        // If string contains only date (YYYY-MM-DD), treat as Kolkata midnight
        if (typeof fromDate === 'string' && fromDate.length === 10) {
          const parts = fromDate.split('-').map(Number);
          startKolkata = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0));
        } else {
          startKolkata = new Date(f.getTime() + TIMEZONE_OFFSET_HOURS * 3600 * 1000);
        }
      }
    }
    if (toDate) {
      const t = new Date(toDate);
      if (!isNaN(t.getTime())) {
        if (typeof toDate === 'string' && toDate.length === 10) {
          const parts = toDate.split('-').map(Number);
          endKolkata = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999));
        } else {
          endKolkata = new Date(t.getTime() + TIMEZONE_OFFSET_HOURS * 3600 * 1000);
        }
      }
    }
    if (!startKolkata) {
      startKolkata = new Date(Date.UTC(curYear, curMonth, curDate - 29, 0, 0, 0, 0));
    }
    if (!endKolkata) {
      endKolkata = new Date(Date.UTC(curYear, curMonth, curDate, 23, 59, 59, 999));
    }
  } else {
    // Default last 30 days
    startKolkata = new Date(Date.UTC(curYear, curMonth, curDate - 29, 0, 0, 0, 0));
    endKolkata = new Date(Date.UTC(curYear, curMonth, curDate, 23, 59, 59, 999));
  }

  // Convert Asia/Kolkata boundary back to actual UTC timestamp for MongoDB queries
  const startUTC = new Date(startKolkata.getTime() - TIMEZONE_OFFSET_HOURS * 3600 * 1000);
  const endUTC = new Date(endKolkata.getTime() - TIMEZONE_OFFSET_HOURS * 3600 * 1000);

  // Return both UTC bounds and readable ISO string for response
  return {
    startUTC,
    endUTC,
    fromDateStr: startKolkata.toISOString().substring(0, 10),
    toDateStr: endKolkata.toISOString().substring(0, 10),
  };
};

/**
 * Build Mongoose ObjectId match filter safely
 */
const buildIdMatch = (field, id) => {
  if (!id) return null;
  const mongoose = require('mongoose');
  if (mongoose.Types.ObjectId.isValid(id)) {
    return { [field]: new mongoose.Types.ObjectId(id) };
  }
  return null;
};

/**
 * Build common match query object for a model given date field name and query params
 */
const buildCommonMatchQuery = (dateField, params = {}) => {
  const { startUTC, endUTC } = parseDateRange(params);
  const match = {
    [dateField]: {
      $gte: startUTC,
      $lte: endUTC,
    },
  };

  if (params.stationId) {
    const stationMatch = buildIdMatch('stationId', params.stationId);
    if (stationMatch) Object.assign(match, stationMatch);
  }

  if (params.chargerId) {
    const chargerMatch = buildIdMatch('chargerId', params.chargerId);
    if (chargerMatch) Object.assign(match, chargerMatch);
  }

  if (params.userId) {
    const userMatch = buildIdMatch('userId', params.userId);
    if (userMatch) Object.assign(match, userMatch);
  }

  if (params.status) {
    match.status = params.status;
  }

  if (params.paymentStatus) {
    match.paymentStatus = params.paymentStatus;
  }

  return match;
};

/**
 * Convert an array of objects to CSV string
 */
const convertToCSV = (items, fields) => {
  if (!items || !items.length) {
    return fields.map((f) => `"${f.label}"`).join(',') + '\n';
  }

  const header = fields.map((f) => `"${f.label}"`).join(',');
  const rows = items.map((item) => {
    return fields
      .map((f) => {
        let val;
        if (typeof f.value === 'function') {
          val = f.value(item);
        } else {
          val = item[f.key];
        }

        if (val === null || val === undefined) {
          return '""';
        }
        // Escape quotes
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(',');
  });

  return [header, ...rows].join('\n') + '\n';
};

module.exports = {
  TIMEZONE,
  TIMEZONE_OFFSET_HOURS,
  roundMoney,
  calculatePercentage,
  parseDateRange,
  buildIdMatch,
  buildCommonMatchQuery,
  convertToCSV,
};
