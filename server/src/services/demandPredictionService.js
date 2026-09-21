const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const ChargingStation = require('../models/ChargingStation');
const Charger = require('../models/Charger');
const { TIMEZONE } = require('../utils/analyticsHelpers');

/**
 * Predict demand for a station across all 24 hours of a target date or day-of-week
 */
const predictStationDemand = async (stationId, targetDate = new Date()) => {
  const dateObj = new Date(targetDate);
  const dayOfWeek = dateObj.getDay(); // 0 (Sun) - 6 (Sat)
  const stationObjId = new mongoose.Types.ObjectId(stationId);

  // 1. Fetch station & charger capacity
  const [station, totalChargers] = await Promise.all([
    ChargingStation.findById(stationId).lean(),
    Charger.countDocuments({ stationId: stationObjId }),
  ]);

  if (!station) {
    throw new Error('Station not found');
  }

  const capacity = Math.max(1, totalChargers);

  // 2. Aggregate historical booking frequencies grouped by hour for this station & day of week
  const historicalHourStats = await Booking.aggregate([
    {
      $match: {
        stationId: stationObjId,
        status: { $in: ['confirmed', 'checked_in', 'charging', 'completed'] },
      },
    },
    {
      $project: {
        hour: { $hour: { date: '$startTime', timezone: TIMEZONE } },
        dayOfWeek: { $dayOfWeek: { date: '$startTime', timezone: TIMEZONE } }, // 1 (Sun) - 7 (Sat)
      },
    },
    {
      $match: {
        dayOfWeek: dayOfWeek + 1, // MongoDB dayOfWeek is 1-indexed
      },
    },
    {
      $group: {
        _id: '$hour',
        historicalBookingCount: { $sum: 1 },
      },
    },
  ]);

  const historicalMap = {};
  let totalObservations = 0;
  historicalHourStats.forEach((h) => {
    historicalMap[h._id] = h.historicalBookingCount;
    totalObservations += h.historicalBookingCount;
  });

  // Calculate prediction curve for each hour (0 to 23)
  const hourlyPredictions = [];

  for (let hour = 0; hour < 24; hour++) {
    const historicalCount = historicalMap[hour] || 0;
    // Estimate expected bookings normalized against capacity
    const expectedBookings = Math.round(historicalCount * 0.8 + (hour >= 17 && hour <= 20 ? 2 : 0));
    const occupancyRatio = expectedBookings / (capacity * 2);

    let predictedDemand = 'low';
    let recommendation = 'Great time to charge with high expected charger availability.';

    if (occupancyRatio >= 0.75 || expectedBookings >= capacity * 1.5) {
      predictedDemand = 'high';
      recommendation = 'Expected peak rush hour. Consider reserving in advance or selecting non-peak hours (before 5 PM / after 9 PM).';
    } else if (occupancyRatio >= 0.35 || expectedBookings >= capacity * 0.7) {
      predictedDemand = 'medium';
      recommendation = 'Moderate demand expected. Reserve a slot to secure your charger.';
    }

    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;

    hourlyPredictions.push({
      hour,
      label: `${displayHour} ${ampm}`,
      predictedDemand,
      predictedBookings: expectedBookings,
      expectedOccupancyPercent: Math.min(100, Math.round(occupancyRatio * 100)),
      recommendation,
    });
  }

  // Confidence assessment based on observation volume
  const confidence =
    totalObservations > 50
      ? 'high'
      : totalObservations > 15
      ? 'medium'
      : 'low (preliminary estimate)';

  return {
    stationId: station._id,
    stationName: station.name,
    targetDate: dateObj.toISOString().substring(0, 10),
    dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
    confidence,
    isEstimate: true,
    totalChargerCapacity: capacity,
    disclaimer: 'Predictions are algorithmic estimates based on historical charging trends and do not guarantee instant availability.',
    hourlyPredictions,
  };
};

/**
 * Predict demand across all network stations for admin overview
 */
const predictNetworkDemandOverview = async (targetDate = new Date()) => {
  const stations = await ChargingStation.find({ status: 'active' }).select('name city pricePerKwh').lean();

  const predictions = await Promise.all(
    stations.map(async (st) => {
      const pred = await predictStationDemand(st._id, targetDate);
      const highDemandHours = pred.hourlyPredictions.filter((h) => h.predictedDemand === 'high');
      return {
        stationId: st._id,
        stationName: st.name,
        city: st.city,
        pricePerKwh: st.pricePerKwh,
        confidence: pred.confidence,
        highDemandHoursCount: highDemandHours.length,
        peakHours: highDemandHours.map((h) => h.label),
        topPeakRecommendation:
          highDemandHours.length > 0
            ? `Peak load expected between ${highDemandHours[0]?.label} - ${highDemandHours[highDemandHours.length - 1]?.label}`
            : 'Smooth load profile expected today',
      };
    })
  );

  return {
    targetDate: new Date(targetDate).toISOString().substring(0, 10),
    isEstimate: true,
    stations: predictions,
  };
};

module.exports = {
  predictStationDemand,
  predictNetworkDemandOverview,
};
