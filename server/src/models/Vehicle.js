const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    vehicleNumber: {
      type: String,
      required: [true, 'Vehicle number is required'],
      trim: true,
      uppercase: true,
    },
    brand: {
      type: String,
      required: [true, 'Brand is required'],
      trim: true,
    },
    model: {
      type: String,
      required: [true, 'Model is required'],
      trim: true,
    },
    manufacturingYear: {
      type: Number,
      min: [1990, 'Year must be after 1990'],
      max: [new Date().getFullYear() + 1, 'Year cannot be in the distant future'],
    },
    batteryCapacity: {
      type: Number,
      required: [true, 'Battery capacity is required'],
      min: [1, 'Battery capacity must be at least 1 kWh'],
    },
    connectorType: {
      type: String,
      required: [true, 'Connector type is required'],
      enum: {
        values: ['CCS2', 'Type 2', 'CHAdeMO', 'GB/T', 'Other'],
        message: '{VALUE} is not a supported connector type',
      },
    },
    maxChargingPower: {
      type: Number,
      min: [1, 'Max charging power must be at least 1 kW'],
    },
    color: {
      type: String,
      trim: true,
      default: '',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: A user cannot add the same vehicle number twice
vehicleSchema.index({ userId: 1, vehicleNumber: 1 }, { unique: true });

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle;
