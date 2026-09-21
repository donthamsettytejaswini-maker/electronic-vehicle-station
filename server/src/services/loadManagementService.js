const ChargingStation = require('../models/ChargingStation');
const Charger = require('../models/Charger');
const ChargingSession = require('../models/ChargingSession');
const { getIO } = require('../socket');

// In-memory site power limits (default 120 kW per station if not in DB)
const sitePowerLimits = {};

/**
 * Get load management status and active power allocation for a site
 */
const getSitePowerStatus = async (stationId) => {
  const station = await ChargingStation.findById(stationId).lean();
  if (!station) throw new Error('Station not found');

  const maxSitePowerKw = sitePowerLimits[stationId.toString()] || 120; // 120 kW grid limit default

  // 1. Fetch all active charging sessions at this station
  const activeSessions = await ChargingSession.find({
    stationId,
    status: { $in: ['initiated', 'charging', 'paused'] },
  })
    .populate('chargerId', 'chargerNumber powerRating connectorType')
    .populate('userId', 'name')
    .populate('vehicleId', 'vehicleNumber model')
    .lean();

  let requestedPowerKw = 0;
  activeSessions.forEach((s) => {
    requestedPowerKw += s.chargingPowerKw || s.chargerId?.powerRating || 30;
  });

  const isOverloaded = requestedPowerKw > maxSitePowerKw;
  const availableCapacityKw = Math.max(0, maxSitePowerKw - requestedPowerKw);

  // Allocation algorithm:
  // If total requested exceeds site capacity, allocate proportionally:
  // allocatedPower = requestedPower * (maxSitePowerKw / requestedPowerKw)
  const scaleFactor = isOverloaded ? maxSitePowerKw / requestedPowerKw : 1.0;

  const sessionAllocations = activeSessions.map((s) => {
    const origPower = s.chargingPowerKw || s.chargerId?.powerRating || 30;
    const allocatedPower = Math.round(origPower * scaleFactor * 10) / 10;
    const isThrottled = allocatedPower < origPower;

    return {
      sessionId: s._id,
      sessionReference: s.sessionReference,
      driverName: s.userId?.name || 'Driver',
      vehicle: s.vehicleId ? `${s.vehicleId.model} (${s.vehicleId.vehicleNumber})` : 'EV',
      chargerNumber: s.chargerId?.chargerNumber || 'Port',
      requestedPowerKw: origPower,
      allocatedPowerKw: allocatedPower,
      isThrottled,
      throttleReductionKw: Math.round((origPower - allocatedPower) * 10) / 10,
    };
  });

  return {
    stationId: station._id,
    stationName: station.name,
    city: station.city,
    maxSitePowerLimitKw: maxSitePowerKw,
    currentSiteLoadKw: Math.min(maxSitePowerKw, requestedPowerKw),
    requestedTotalPowerKw: requestedPowerKw,
    availableCapacityKw,
    isOverloaded,
    activeSessionsCount: activeSessions.length,
    allocationMode: isOverloaded ? 'dynamic_proportional_throttle' : 'normal_full_power',
    isSimulation: true,
    warning:
      'Load management is operating in algorithmic simulation mode. Real physical smart meter integration is not connected.',
    allocations: sessionAllocations,
  };
};

/**
 * Update station site power limit (Admin)
 */
const updateSitePowerLimit = async (stationId, limitKw) => {
  const parsed = Number(limitKw);
  if (isNaN(parsed) || parsed < 10) {
    throw new Error('Power limit must be at least 10 kW');
  }
  sitePowerLimits[stationId.toString()] = parsed;
  return await getSitePowerStatus(stationId);
};

/**
 * Get network-wide load management status for all stations
 */
const getNetworkLoadOverview = async () => {
  const stations = await ChargingStation.find({ status: 'active' }).select('name city').lean();
  const sites = await Promise.all(stations.map((st) => getSitePowerStatus(st._id)));

  let totalNetworkCapacityKw = 0;
  let totalNetworkLoadKw = 0;
  let totalActiveSessions = 0;

  sites.forEach((s) => {
    totalNetworkCapacityKw += s.maxSitePowerLimitKw;
    totalNetworkLoadKw += s.currentSiteLoadKw;
    totalActiveSessions += s.activeSessionsCount;
  });

  return {
    isSimulation: true,
    totalNetworkCapacityKw,
    totalNetworkLoadKw,
    totalActiveSessions,
    sites,
  };
};

module.exports = {
  getSitePowerStatus,
  updateSitePowerLimit,
  getNetworkLoadOverview,
};
