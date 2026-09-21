const OcppSimulator = require('../ocpp/OcppSimulator');
const Charger = require('../models/Charger');

/**
 * @desc Dispatch simulated OCPP action on a charger
 * @route POST /api/admin/ocpp/simulate
 * @access Admin
 */
const simulateOcppAction = async (req, res, next) => {
  try {
    const { chargerId, action, status, energyWh, powerW, socPercent } = req.body;

    if (!chargerId || !action) {
      return res.status(400).json({
        success: false,
        message: 'chargerId and action are required',
      });
    }

    let result;
    if (action === 'BootNotification') {
      result = await OcppSimulator.simulateBoot(chargerId);
    } else if (action === 'StatusNotification') {
      result = await OcppSimulator.simulateStatusChange(chargerId, status || 'Available');
    } else if (action === 'MeterValues') {
      result = await OcppSimulator.simulateMeterValue(
        chargerId,
        energyWh || 15000,
        powerW || 30000,
        socPercent || 65
      );
    } else {
      return res.status(400).json({
        success: false,
        message: `Simulated action ${action} is not supported in development mode`,
      });
    }

    res.status(200).json({
      success: true,
      message: `OCPP action ${action} executed successfully`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get OCPP status of all chargers
 * @route GET /api/admin/ocpp/status
 * @access Admin
 */
const getOcppStatus = async (req, res, next) => {
  try {
    const chargers = await Charger.find()
      .populate('stationId', 'name city')
      .sort({ chargerNumber: 1 })
      .lean();

    const ocppChargers = chargers.map((c) => ({
      chargerId: c._id,
      chargerNumber: c.chargerNumber,
      stationName: c.stationId?.name || 'Unknown',
      connectorType: c.connectorType,
      powerRating: c.powerRating,
      status: c.status,
      ocppProtocol: 'OCPP 1.6-J JSON',
      lastHeartbeat: new Date(),
      isConnected: c.status !== 'offline',
    }));

    res.status(200).json({
      success: true,
      data: {
        totalChargers: ocppChargers.length,
        connectedChargers: ocppChargers.filter((c) => c.isConnected).length,
        chargers: ocppChargers,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  simulateOcppAction,
  getOcppStatus,
};
