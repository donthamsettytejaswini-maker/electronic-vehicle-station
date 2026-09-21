const ChargingStation = require('../models/ChargingStation');
const Charger = require('../models/Charger');
const Vehicle = require('../models/Vehicle');
const { calculateDistanceKm } = require('../utils/geoUtils');
const { predictStationDemand } = require('./demandPredictionService');

/**
 * Smart recommendation engine ranking stations based on distance, compatibility, speed, price, and demand
 */
const getStationRecommendations = async ({
  latitude,
  longitude,
  vehicleId,
  desiredSpeed,
  maxPrice,
  maxDistanceKm = 50,
}) => {
  const userLat = latitude ? Number(latitude) : null;
  const userLon = longitude ? Number(longitude) : null;

  // 1. Fetch user's vehicle if provided
  let vehicle = null;
  if (vehicleId) {
    vehicle = await Vehicle.findById(vehicleId).lean();
  }

  // 2. Fetch all active stations & chargers
  const [stations, chargers] = await Promise.all([
    ChargingStation.find({ status: 'active' }).lean(),
    Charger.find().lean(),
  ]);

  const chargerMap = {};
  chargers.forEach((c) => {
    const sid = c.stationId.toString();
    if (!chargerMap[sid]) chargerMap[sid] = [];
    chargerMap[sid].push(c);
  });

  const rankedStations = [];

  for (const st of stations) {
    const sid = st._id.toString();
    const stationChargers = chargerMap[sid] || [];
    const availableChargers = stationChargers.filter((c) => c.status === 'available');

    // Calculate distance
    let distanceKm = null;
    if (userLat && userLon && st.latitude && st.longitude) {
      distanceKm = calculateDistanceKm(userLat, userLon, st.latitude, st.longitude);
      if (maxDistanceKm && distanceKm > maxDistanceKm) {
        continue; // Skip stations outside max radius
      }
    }

    // Price filter check
    if (maxPrice && st.pricePerKwh > Number(maxPrice)) {
      continue;
    }

    // Compatibility check
    let compatibleChargers = stationChargers;
    let hasMatchingConnector = true;
    if (vehicle && vehicle.connectorType) {
      compatibleChargers = stationChargers.filter(
        (c) => c.connectorType === vehicle.connectorType || c.connectorType === 'Other'
      );
      if (compatibleChargers.length === 0) {
        hasMatchingConnector = false;
      }
    }

    // Factors scoring (Scale 0 - 100):
    // 1. Availability Score (0 - 30 pts)
    const availRatio = stationChargers.length > 0 ? availableChargers.length / stationChargers.length : 0;
    const availabilityScore = Math.round(availRatio * 30);

    // 2. Distance Score (0 - 25 pts)
    let distanceScore = 15; // default if no coordinates
    if (distanceKm !== null) {
      distanceScore = Math.max(0, Math.round(25 - (distanceKm / 2)));
    }

    // 3. Price Score (0 - 20 pts)
    const priceScore = Math.max(0, Math.round(20 - ((st.pricePerKwh - 10) * 0.8)));

    // 4. Charging Speed Score (0 - 15 pts)
    const maxPower = stationChargers.reduce((max, c) => Math.max(max, c.powerRating || 0), 0);
    const speedScore = Math.min(15, Math.round((maxPower / 60) * 15));

    // 5. Rating Score (0 - 10 pts)
    const ratingScore = Math.round(((st.averageRating || 4.0) / 5) * 10);

    // 6. Compatibility Bonus / Penalty
    const compatibilityBonus = hasMatchingConnector ? 10 : -25;

    // 7. Demand prediction factor
    let demandPenalty = 0;
    let currentDemandLevel = 'low';
    try {
      const pred = await predictStationDemand(st._id);
      const currentHour = new Date().getHours();
      const currentPred = pred.hourlyPredictions.find((h) => h.hour === currentHour);
      if (currentPred?.predictedDemand === 'high') {
        demandPenalty = 10;
        currentDemandLevel = 'high';
      } else if (currentPred?.predictedDemand === 'medium') {
        demandPenalty = 4;
        currentDemandLevel = 'medium';
      }
    } catch (e) {
      // Ignore prediction failures in ranking
    }

    const totalScore = Math.max(
      0,
      availabilityScore +
        distanceScore +
        priceScore +
        speedScore +
        ratingScore +
        compatibilityBonus -
        demandPenalty
    );

    // Build human-readable recommendation reasons
    const reasons = [];
    if (hasMatchingConnector && vehicle) {
      reasons.push(`Compatible ${vehicle.connectorType} connector available`);
    }
    if (availableChargers.length > 0) {
      reasons.push(`${availableChargers.length} charger(s) currently open`);
    } else {
      reasons.push('All ports currently occupied');
    }
    if (distanceKm !== null && distanceKm <= 5) {
      reasons.push(`Nearby location (${distanceKm} km)`);
    }
    if (maxPower >= 50) {
      reasons.push(`Rapid ${maxPower} kW charging available`);
    }
    if (st.pricePerKwh <= 18) {
      reasons.push(`Competitive rate (₹${st.pricePerKwh}/kWh)`);
    }

    rankedStations.push({
      station: {
        _id: st._id,
        name: st.name,
        address: st.address,
        city: st.city,
        latitude: st.latitude,
        longitude: st.longitude,
        pricePerKwh: st.pricePerKwh,
        averageRating: st.averageRating,
        totalReviews: st.totalReviews,
      },
      recommendationScore: totalScore,
      distanceKm,
      availableChargersCount: availableChargers.length,
      totalChargersCount: stationChargers.length,
      maxPowerRating: maxPower,
      currentDemandLevel,
      hasMatchingConnector,
      reasons,
    });
  }

  // Sort descending by recommendation score
  rankedStations.sort((a, b) => b.recommendationScore - a.recommendationScore);

  return {
    isEstimate: true,
    totalEvaluated: stations.length,
    matchedVehicle: vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.connectorType})` : null,
    recommendations: rankedStations.slice(0, 10),
  };
};

module.exports = {
  getStationRecommendations,
};
