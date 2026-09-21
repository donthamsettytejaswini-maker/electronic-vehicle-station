const PricingRule = require('../models/PricingRule');
const ChargingStation = require('../models/ChargingStation');
const Charger = require('../models/Charger');
const { roundMoney, TIMEZONE_OFFSET_HOURS } = require('../utils/analyticsHelpers');

/**
 * Resolve effective tariff for a station and charger at a specific date/time
 */
const getEffectiveTariff = async (stationId, chargerId = null, date = new Date()) => {
  const station = await ChargingStation.findById(stationId).lean();
  if (!station) {
    throw new Error('Station not found');
  }

  let charger = null;
  if (chargerId) {
    charger = await Charger.findById(chargerId).lean();
  }

  const baseRate = charger?.pricePerKwh || station.pricePerKwh || 18.0;

  // If dynamic pricing flag is disabled, return static rate
  if (process.env.ENABLE_DYNAMIC_PRICING === 'false') {
    return {
      baseRate,
      effectiveRate: baseRate,
      multiplier: 1.0,
      appliedRule: null,
      isDynamic: false,
    };
  }

  const targetDate = new Date(date);
  // Shift to IST for rule evaluation
  const localTime = new Date(targetDate.getTime() + TIMEZONE_OFFSET_HOURS * 3600 * 1000);
  const dayOfWeek = localTime.getUTCDay(); // 0 - 6
  const hours = String(localTime.getUTCHours()).padStart(2, '0');
  const minutes = String(localTime.getUTCMinutes()).padStart(2, '0');
  const currentTimeStr = `${hours}:${minutes}`;

  // Find all active candidate rules
  const candidateRules = await PricingRule.find({
    active: true,
    effectiveFrom: { $lte: targetDate },
    $or: [{ effectiveTo: null }, { effectiveTo: { $gte: targetDate } }],
    $and: [
      { $or: [{ stationId: null }, { stationId: station._id }] },
      {
        $or: [
          { chargerType: 'ALL' },
          { chargerType: charger?.connectorType || 'ALL' },
        ],
      },
      { daysOfWeek: dayOfWeek },
    ],
  })
    .sort({ priority: -1 })
    .lean();

  // Find highest priority rule matching time window
  let matchedRule = null;
  for (const rule of candidateRules) {
    if (currentTimeStr >= rule.startTime && currentTimeStr <= rule.endTime) {
      matchedRule = rule;
      break;
    }
  }

  if (!matchedRule) {
    return {
      baseRate,
      effectiveRate: baseRate,
      multiplier: 1.0,
      appliedRule: null,
      isDynamic: false,
    };
  }

  let effectiveRate;
  if (matchedRule.fixedPricePerKwh !== undefined && matchedRule.fixedPricePerKwh !== null) {
    effectiveRate = roundMoney(matchedRule.fixedPricePerKwh);
  } else {
    effectiveRate = roundMoney(baseRate * (matchedRule.multiplier || 1.0));
  }

  return {
    baseRate,
    effectiveRate,
    multiplier: matchedRule.multiplier || 1.0,
    appliedRule: {
      _id: matchedRule._id,
      name: matchedRule.name,
      ruleType: matchedRule.ruleType,
      priority: matchedRule.priority,
    },
    isDynamic: true,
  };
};

module.exports = {
  getEffectiveTariff,
};
