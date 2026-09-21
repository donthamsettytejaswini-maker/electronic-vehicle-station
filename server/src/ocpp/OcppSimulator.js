const OcppAdapter = require('./OcppAdapter');
const Charger = require('../models/Charger');

/**
 * OCPP Hardware Simulator Driver for development & demonstration
 */
class OcppSimulator {
  /**
   * Simulate Boot Notification from a test charger
   */
  static async simulateBoot(chargerId) {
    const charger = await Charger.findById(chargerId);
    if (!charger) throw new Error('Charger not found');

    const result = await OcppAdapter.processOcppMessage('BootNotification', {
      chargerIdentity: charger.chargerNumber,
      chargePointVendor: 'Delta Electronics',
      chargePointModel: 'UFC200 FastCharger',
    });

    return {
      chargerNumber: charger.chargerNumber,
      action: 'BootNotification',
      response: result,
    };
  }

  /**
   * Simulate Status Notification change
   */
  static async simulateStatusChange(chargerId, status) {
    const charger = await Charger.findById(chargerId);
    if (!charger) throw new Error('Charger not found');

    const result = await OcppAdapter.processOcppMessage('StatusNotification', {
      chargerIdentity: charger.chargerNumber,
      connectorId: 1,
      status, // 'Available', 'Charging', 'Faulted', 'Unavailable'
      errorCode: 'NoError',
    });

    return {
      chargerNumber: charger.chargerNumber,
      action: 'StatusNotification',
      newStatus: status,
      response: result,
    };
  }

  /**
   * Simulate Meter Values Stream
   */
  static async simulateMeterValue(chargerId, energyWh, powerW, socPercent) {
    const charger = await Charger.findById(chargerId);
    if (!charger) throw new Error('Charger not found');

    const result = await OcppAdapter.processOcppMessage('MeterValues', {
      chargerIdentity: charger.chargerNumber,
      connectorId: 1,
      meterValue: [
        {
          timestamp: new Date().toISOString(),
          sampledValue: [
            { value: String(energyWh), measurand: 'Energy.Active.Import.Register', unit: 'Wh' },
            { value: String(powerW), measurand: 'Power.Active.Import', unit: 'W' },
            { value: String(socPercent), measurand: 'SoC', unit: 'Percent' },
          ],
        },
      ],
    });

    return {
      chargerNumber: charger.chargerNumber,
      action: 'MeterValues',
      telemetry: { energyWh, powerW, socPercent },
      response: result,
    };
  }
}

module.exports = OcppSimulator;
