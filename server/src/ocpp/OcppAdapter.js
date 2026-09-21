const OcppMessageHandler = require('./OcppMessageHandler');

/**
 * OCPP Protocol Adapter Layer
 * Bridges OCPP JSON RPC protocol actions with EVCharge platform services
 */
class OcppAdapter {
  static async processOcppMessage(action, payload) {
    switch (action) {
      case 'BootNotification':
        return await OcppMessageHandler.handleBootNotification(payload);
      case 'Heartbeat':
        return await OcppMessageHandler.handleHeartbeat(payload);
      case 'StatusNotification':
        return await OcppMessageHandler.handleStatusNotification(payload);
      case 'Authorize':
        return await OcppMessageHandler.handleAuthorize(payload);
      case 'StartTransaction':
        return await OcppMessageHandler.handleStartTransaction(payload);
      case 'StopTransaction':
        return await OcppMessageHandler.handleStopTransaction(payload);
      case 'MeterValues':
        return await OcppMessageHandler.handleMeterValues(payload);
      default:
        throw new Error(`Unsupported OCPP action: ${action}`);
    }
  }
}

module.exports = OcppAdapter;
