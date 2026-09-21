const mongoose = require('mongoose');

const chargerSchema = new mongoose.Schema(
  {
    stationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChargingStation',
      required: [true, 'Station ID is required'],
      index: true,
    },
    chargerNumber: {
      type: String,
      required: [true, 'Charger number is required'],
      trim: true,
      uppercase: true,
    },
    connectorType: {
      type: String,
      required: [true, 'Connector type is required'],
      enum: {
        values: ['CCS2', 'Type 2', 'CHAdeMO', 'GB/T', 'Other'],
        message: '{VALUE} is not a supported connector type',
      },
    },
    chargingSpeed: {
      type: String,
      required: [true, 'Charging speed is required'],
      enum: {
        values: ['Slow', 'Normal', 'Fast', 'Rapid'],
        message: '{VALUE} is not a valid charging speed',
      },
    },
    powerRating: {
      type: Number,
      required: [true, 'Power rating is required'],
      min: [1, 'Power rating must be at least 1 kW'],
    },
    status: {
      type: String,
      required: [true, 'Charger status is required'],
      enum: {
        values: ['available', 'reserved', 'charging', 'maintenance', 'offline'],
        message: '{VALUE} is not a valid charger status',
      },
      default: 'available',
      index: true,
    },
    pricePerKwh: {
      type: Number,
      min: [0, 'Price per kWh cannot be negative'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: prevents duplicate charger numbers within the same station
chargerSchema.index({ stationId: 1, chargerNumber: 1 }, { unique: true });

const Charger = mongoose.model('Charger', chargerSchema);

module.exports = Charger;
