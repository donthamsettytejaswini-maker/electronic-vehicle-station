const ChargingSession = require('../models/ChargingSession');
const Booking = require('../models/Booking');
const Charger = require('../models/Charger');
const {
  emitSessionEvent,
  emitChargerStatusUpdate,
  emitBookingStatusUpdate,
} = require('../socket');

// Active timer instances: Map<sessionId, NodeJS.Timeout>
const activeSimulations = new Map();

const SIMULATION_INTERVAL_MS = parseInt(process.env.SIMULATION_INTERVAL_MS || '5000', 10);

/**
 * Start or resume a simulated charging interval for a session
 */
const startSimulation = (session) => {
  const sessionId = session._id.toString();

  // Prevent duplicate timers
  if (activeSimulations.has(sessionId)) {
    clearInterval(activeSimulations.get(sessionId));
    activeSimulations.delete(sessionId);
  }

  const intervalId = setInterval(async () => {
    try {
      const currentSession = await ChargingSession.findById(sessionId)
        .populate('vehicleId', 'batteryCapacity brand model')
        .populate('chargerId', 'chargerNumber powerRating status')
        .populate('stationId', 'name city');

      if (!currentSession || currentSession.status !== 'charging') {
        stopSimulation(sessionId);
        return;
      }

      const batteryCapacity = currentSession.vehicleId?.batteryCapacity || 40; // Default 40kWh
      const powerKw = currentSession.chargingPowerKw || currentSession.chargerId?.powerRating || 30; // kW
      
      // Energy added in 5 seconds = powerKw * (5 / 3600) kWh
      const energyIncrement = Number(((powerKw * (SIMULATION_INTERVAL_MS / 1000)) / 3600).toFixed(4));
      
      // Percentage added = (energyIncrement / batteryCapacity) * 100
      // Boost rate slightly for better demo visualization: ~1% per 5s or real formula
      const percentageIncrement = Math.max(
        0.5,
        Number(((energyIncrement / batteryCapacity) * 100).toFixed(2))
      );

      const nextBattery = Math.min(
        currentSession.targetBatteryPercentage,
        Number((currentSession.currentBatteryPercentage + percentageIncrement).toFixed(1))
      );
      const nextEnergy = Number((currentSession.energyConsumedKwh + energyIncrement).toFixed(3));

      currentSession.currentBatteryPercentage = nextBattery;
      currentSession.energyConsumedKwh = nextEnergy;

      // Estimated remaining minutes
      const remainingPct = Math.max(0, currentSession.targetBatteryPercentage - nextBattery);
      const remainingKwh = (remainingPct / 100) * batteryCapacity;
      currentSession.estimatedDurationMinutes = Math.max(
        0,
        Math.round((remainingKwh / powerKw) * 60)
      );

      // Check if target battery reached
      if (nextBattery >= currentSession.targetBatteryPercentage) {
        currentSession.status = 'completed';
        currentSession.completedAt = new Date();
        currentSession.actualDurationMinutes = Math.max(
          1,
          Math.round((currentSession.completedAt - new Date(currentSession.startedAt)) / 60000)
        );
        currentSession.currentBatteryPercentage = currentSession.targetBatteryPercentage;
        await currentSession.save();

        // Update booking to completed
        const booking = await Booking.findById(currentSession.bookingId);
        if (booking) {
          booking.status = 'completed';
          booking.qrInvalidatedAt = new Date();
          await booking.save();
          emitBookingStatusUpdate(booking._id, booking.userId, 'completed');
        }

        // Update charger to available
        const charger = await Charger.findById(currentSession.chargerId);
        if (charger && charger.status !== 'maintenance' && charger.status !== 'offline') {
          charger.status = 'available';
          await charger.save();
          emitChargerStatusUpdate(charger._id, charger.stationId, 'available');
        }

        stopSimulation(sessionId);
        emitSessionEvent('session:completed', currentSession);
        console.log(`[Simulation] Session ${currentSession.sessionReference} reached target battery (${nextBattery}%) and completed.`);
      } else {
        await currentSession.save();
        emitSessionEvent('session:updated', currentSession);
      }
    } catch (error) {
      console.error(`[Simulation Error] Failed step for session ${sessionId}:`, error.message);
    }
  }, SIMULATION_INTERVAL_MS);

  activeSimulations.set(sessionId, intervalId);
  console.log(`[Simulation] Started telemetry loop for session ${sessionId} (${session.sessionReference})`);
};

/**
 * Pause / Stop simulation loop
 */
const stopSimulation = (sessionId) => {
  const sId = sessionId.toString();
  if (activeSimulations.has(sId)) {
    clearInterval(activeSimulations.get(sId));
    activeSimulations.delete(sId);
    console.log(`[Simulation] Cleared telemetry loop for session ${sId}`);
  }
};

/**
 * Rehydrate active sessions from DB on server startup
 */
const initActiveSimulations = async () => {
  try {
    const activeSessions = await ChargingSession.find({
      status: 'charging',
      simulationEnabled: true,
    });

    console.log(`[Simulation] Rehydrating ${activeSessions.length} active charging sessions...`);
    for (const session of activeSessions) {
      startSimulation(session);
    }
  } catch (error) {
    console.warn('[Simulation] Failed to rehydrate active sessions on startup:', error.message);
  }
};

module.exports = {
  startSimulation,
  stopSimulation,
  initActiveSimulations,
};
