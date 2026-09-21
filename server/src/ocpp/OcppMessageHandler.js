const Charger = require('../models/Charger');
const ChargingStation = require('../models/ChargingStation');
const ChargingSession = require('../models/ChargingSession');
const { emitChargerStatusUpdate, emitSessionEvent } = require('../socket');

/**
 * Handle incoming OCPP 1.6J messages
 */
class OcppMessageHandler {
  /**
   * Handle BootNotification
   */
  static async handleBootNotification({ chargerIdentity, chargePointModel, chargePointVendor }) {
    console.log(`[OCPP] BootNotification from ${chargerIdentity} (${chargePointVendor} - ${chargePointModel})`);
    return {
      status: 'Accepted',
      currentTime: new Date().toISOString(),
      interval: 300, // 5 min heartbeat interval
    };
  }

  /**
   * Handle Heartbeat
   */
  static async handleHeartbeat({ chargerIdentity }) {
    return {
      currentTime: new Date().toISOString(),
    };
  }

  /**
   * Handle StatusNotification
   */
  static async handleStatusNotification({ chargerIdentity, connectorId, status, errorCode }) {
    console.log(`[OCPP] StatusNotification from ${chargerIdentity}: Connector ${connectorId} -> ${status}`);

    const statusMap = {
      Available: 'available',
      Occupied: 'charging',
      Charging: 'charging',
      Reserved: 'reserved',
      Unavailable: 'maintenance',
      Faulted: 'maintenance',
    };

    const mappedStatus = statusMap[status] || 'available';

    // Find charger by chargerNumber or id
    const charger = await Charger.findOne({
      $or: [{ chargerNumber: chargerIdentity }, { _id: chargerIdentity }],
    });

    if (charger) {
      charger.status = mappedStatus;
      await charger.save();
      emitChargerStatusUpdate(charger._id, charger.stationId, mappedStatus);
    }

    return {};
  }

  /**
   * Handle Authorize
   */
  static async handleAuthorize({ idTag }) {
    console.log(`[OCPP] Authorize request for idTag: ${idTag}`);
    return {
      idTagInfo: {
        status: 'Accepted',
        expiryDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      },
    };
  }

  /**
   * Handle StartTransaction
   */
  static async handleStartTransaction({ chargerIdentity, connectorId, idTag, meterStart, timestamp }) {
    const transactionId = Math.floor(100000 + Math.random() * 900000);
    console.log(`[OCPP] StartTransaction: ID ${transactionId} on ${chargerIdentity}`);

    return {
      transactionId,
      idTagInfo: { status: 'Accepted' },
    };
  }

  /**
   * Handle StopTransaction
   */
  static async handleStopTransaction({ transactionId, meterStop, timestamp, reason }) {
    console.log(`[OCPP] StopTransaction: ID ${transactionId}, Meter: ${meterStop} Wh, Reason: ${reason}`);

    return {
      idTagInfo: { status: 'Accepted' },
    };
  }

  /**
   * Handle MeterValues
   */
  static async handleMeterValues({ chargerIdentity, connectorId, transactionId, meterValue }) {
    // Process telemetry sample
    return {};
  }
}

module.exports = OcppMessageHandler;
