const Vehicle = require('../models/Vehicle');

// @desc    Create a new vehicle for the logged-in user
// @route   POST /api/vehicles
// @access  Private (User/Admin)
const createVehicle = async (req, res, next) => {
  try {
    const {
      vehicleNumber,
      brand,
      model,
      manufacturingYear,
      batteryCapacity,
      connectorType,
      maxChargingPower,
      color,
      isDefault,
    } = req.body;

    const normalizedNumber = vehicleNumber.trim().toUpperCase();

    // Check duplicate for this specific user
    const existingVehicle = await Vehicle.findOne({
      userId: req.user._id,
      vehicleNumber: normalizedNumber,
    });

    if (existingVehicle) {
      return res.status(400).json({
        success: false,
        message: 'You have already added a vehicle with this number',
        errors: [{ field: 'vehicleNumber', message: 'Vehicle number already exists for your account' }],
      });
    }

    // Check if user has any existing vehicles
    const count = await Vehicle.countDocuments({ userId: req.user._id });
    const shouldBeDefault = isDefault || count === 0;

    // If marked as default, unset other defaults
    if (shouldBeDefault) {
      await Vehicle.updateMany(
        { userId: req.user._id },
        { isDefault: false }
      );
    }

    const vehicle = await Vehicle.create({
      userId: req.user._id,
      vehicleNumber: normalizedNumber,
      brand: brand.trim(),
      model: model.trim(),
      manufacturingYear: manufacturingYear || undefined,
      batteryCapacity: Number(batteryCapacity),
      connectorType,
      maxChargingPower: maxChargingPower ? Number(maxChargingPower) : undefined,
      color: color ? color.trim() : '',
      isDefault: shouldBeDefault,
    });

    res.status(201).json({
      success: true,
      message: 'Vehicle added successfully',
      data: { vehicle },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all vehicles for the logged-in user
// @route   GET /api/vehicles
// @access  Private
const getVehicles = async (req, res, next) => {
  try {
    const vehicles = await Vehicle.find({ userId: req.user._id }).sort({
      isDefault: -1,
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      data: {
        items: vehicles,
        total: vehicles.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single vehicle by ID
// @route   GET /api/vehicles/:id
// @access  Private
const getVehicleById = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found or you do not have permission to view it',
      });
    }

    res.status(200).json({
      success: true,
      data: { vehicle },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a vehicle
// @route   PUT /api/vehicles/:id
// @access  Private
const updateVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found or you do not have permission to edit it',
      });
    }

    const {
      vehicleNumber,
      brand,
      model,
      manufacturingYear,
      batteryCapacity,
      connectorType,
      maxChargingPower,
      color,
      isDefault,
    } = req.body;

    if (vehicleNumber) {
      const normalizedNumber = vehicleNumber.trim().toUpperCase();
      if (normalizedNumber !== vehicle.vehicleNumber) {
        const duplicate = await Vehicle.findOne({
          userId: req.user._id,
          vehicleNumber: normalizedNumber,
          _id: { $ne: vehicle._id },
        });

        if (duplicate) {
          return res.status(400).json({
            success: false,
            message: 'A vehicle with this number already exists in your account',
            errors: [{ field: 'vehicleNumber', message: 'Vehicle number already exists' }],
          });
        }
        vehicle.vehicleNumber = normalizedNumber;
      }
    }

    if (brand !== undefined) vehicle.brand = brand.trim();
    if (model !== undefined) vehicle.model = model.trim();
    if (manufacturingYear !== undefined) vehicle.manufacturingYear = manufacturingYear || undefined;
    if (batteryCapacity !== undefined) vehicle.batteryCapacity = Number(batteryCapacity);
    if (connectorType !== undefined) vehicle.connectorType = connectorType;
    if (maxChargingPower !== undefined) vehicle.maxChargingPower = maxChargingPower ? Number(maxChargingPower) : undefined;
    if (color !== undefined) vehicle.color = color.trim();

    if (isDefault !== undefined && isDefault !== vehicle.isDefault) {
      if (isDefault === true) {
        await Vehicle.updateMany(
          { userId: req.user._id, _id: { $ne: vehicle._id } },
          { isDefault: false }
        );
        vehicle.isDefault = true;
      } else {
        vehicle.isDefault = false;
      }
    }

    const updatedVehicle = await vehicle.save();

    res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully',
      data: { vehicle: updatedVehicle },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a vehicle
// @route   DELETE /api/vehicles/:id
// @access  Private
const deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found or you do not have permission to delete it',
      });
    }

    const wasDefault = vehicle.isDefault;
    await vehicle.deleteOne();

    // If deleted vehicle was default, set the first remaining vehicle as default
    if (wasDefault) {
      const remainingVehicle = await Vehicle.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
      if (remainingVehicle) {
        remainingVehicle.isDefault = true;
        await remainingVehicle.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Vehicle deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Set vehicle as default
// @route   PATCH /api/vehicles/:id/default
// @access  Private
const setDefaultVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found or you do not have permission to modify it',
      });
    }

    // Unset all other defaults
    await Vehicle.updateMany(
      { userId: req.user._id },
      { isDefault: false }
    );

    vehicle.isDefault = true;
    const updatedVehicle = await vehicle.save();

    res.status(200).json({
      success: true,
      message: 'Default vehicle updated',
      data: { vehicle: updatedVehicle },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  setDefaultVehicle,
};
