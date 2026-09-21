const Charger = require('../models/Charger');
const ChargingStation = require('../models/ChargingStation');

// @desc    Get all chargers belonging to a station
// @route   GET /api/stations/:stationId/chargers
// @access  Public / Authenticated
const getChargersByStation = async (req, res, next) => {
  try {
    const { stationId } = req.params;

    const station = await ChargingStation.findById(stationId);
    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Charging station not found',
      });
    }

    const chargers = await Charger.find({ stationId }).sort({ chargerNumber: 1 });

    res.status(200).json({
      success: true,
      data: {
        station: {
          _id: station._id,
          name: station.name,
          status: station.status,
          pricePerKwh: station.pricePerKwh,
        },
        items: chargers,
        total: chargers.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single charger by ID
// @route   GET /api/chargers/:id
// @access  Public / Authenticated
const getChargerById = async (req, res, next) => {
  try {
    const charger = await Charger.findById(req.params.id).populate(
      'stationId',
      'name address city status pricePerKwh'
    );

    if (!charger) {
      return res.status(404).json({
        success: false,
        message: 'Charger not found',
      });
    }

    res.status(200).json({
      success: true,
      data: { charger },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new charger in a station
// @route   POST /api/stations/:stationId/chargers
// @access  Private (Admin Only)
const createCharger = async (req, res, next) => {
  try {
    const { stationId } = req.params;
    const {
      chargerNumber,
      connectorType,
      chargingSpeed,
      powerRating,
      status,
      pricePerKwh,
      description,
    } = req.body;

    const station = await ChargingStation.findById(stationId);
    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Charging station not found',
      });
    }

    const normalizedNumber = chargerNumber.trim().toUpperCase();

    // Check duplicate within the same station
    const existingCharger = await Charger.findOne({
      stationId,
      chargerNumber: normalizedNumber,
    });

    if (existingCharger) {
      return res.status(400).json({
        success: false,
        message: `Charger number ${normalizedNumber} already exists in this station`,
        errors: [{ field: 'chargerNumber', message: 'Duplicate charger number for this station' }],
      });
    }

    const charger = await Charger.create({
      stationId,
      chargerNumber: normalizedNumber,
      connectorType,
      chargingSpeed,
      powerRating: Number(powerRating),
      status: status || 'available',
      pricePerKwh: pricePerKwh !== undefined && pricePerKwh !== '' ? Number(pricePerKwh) : station.pricePerKwh,
      description: description ? description.trim() : '',
    });

    res.status(201).json({
      success: true,
      message: 'Charger added successfully',
      data: { charger },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update charger details
// @route   PUT /api/chargers/:id
// @access  Private (Admin Only)
const updateCharger = async (req, res, next) => {
  try {
    const charger = await Charger.findById(req.params.id);

    if (!charger) {
      return res.status(404).json({
        success: false,
        message: 'Charger not found',
      });
    }

    const {
      chargerNumber,
      connectorType,
      chargingSpeed,
      powerRating,
      pricePerKwh,
      description,
      status,
    } = req.body;

    if (chargerNumber) {
      const normalizedNumber = chargerNumber.trim().toUpperCase();
      if (normalizedNumber !== charger.chargerNumber) {
        const duplicate = await Charger.findOne({
          stationId: charger.stationId,
          chargerNumber: normalizedNumber,
          _id: { $ne: charger._id },
        });

        if (duplicate) {
          return res.status(400).json({
            success: false,
            message: `Charger number ${normalizedNumber} already exists in this station`,
            errors: [{ field: 'chargerNumber', message: 'Duplicate charger number' }],
          });
        }
        charger.chargerNumber = normalizedNumber;
      }
    }

    if (connectorType !== undefined) charger.connectorType = connectorType;
    if (chargingSpeed !== undefined) charger.chargingSpeed = chargingSpeed;
    if (powerRating !== undefined) charger.powerRating = Number(powerRating);
    if (pricePerKwh !== undefined) {
      charger.pricePerKwh = pricePerKwh !== '' ? Number(pricePerKwh) : undefined;
    }
    if (description !== undefined) charger.description = description.trim();
    if (status !== undefined) charger.status = status;

    const updatedCharger = await charger.save();

    res.status(200).json({
      success: true,
      message: 'Charger updated successfully',
      data: { charger: updatedCharger },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update charger status
// @route   PATCH /api/chargers/:id/status
// @access  Private (Admin Only)
const updateChargerStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['available', 'reserved', 'charging', 'maintenance', 'offline'];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${allowed.join(', ')}`,
      });
    }

    const charger = await Charger.findById(req.params.id);
    if (!charger) {
      return res.status(404).json({
        success: false,
        message: 'Charger not found',
      });
    }

    charger.status = status;
    await charger.save();

    res.status(200).json({
      success: true,
      message: `Charger status updated to ${status}`,
      data: { charger },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a charger (rejects if status is charging or reserved)
// @route   DELETE /api/chargers/:id
// @access  Private (Admin Only)
const deleteCharger = async (req, res, next) => {
  try {
    const charger = await Charger.findById(req.params.id);

    if (!charger) {
      return res.status(404).json({
        success: false,
        message: 'Charger not found',
      });
    }

    // Guard: Prevent deleting while in active session or reservation
    if (charger.status === 'charging' || charger.status === 'reserved') {
      return res.status(400).json({
        success: false,
        message: `Cannot delete charger while its status is '${charger.status}'. Please set to offline or maintenance first.`,
        errors: [{ field: 'status', message: `Charger is currently ${charger.status}` }],
      });
    }

    await charger.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Charger deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getChargersByStation,
  getChargerById,
  createCharger,
  updateCharger,
  updateChargerStatus,
  deleteCharger,
};
