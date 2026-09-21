const mongoose = require('mongoose');

const chargingSessionSchema = new mongoose.Schema(
  {
    sessionReference: {
      type: String,
      required: [true, 'Session reference is required'],
      unique: true,
      trim: true,
      index: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking ID is required'],
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle ID is required'],
    },
    stationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChargingStation',
      required: [true, 'Station ID is required'],
      index: true,
    },
    chargerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Charger',
      required: [true, 'Charger ID is required'],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: [
          'initiated',
          'charging',
          'paused',
          'completed',
          'stopped',
          'failed',
        ],
        message: '{VALUE} is not a valid charging session status',
      },
      default: 'initiated',
      index: true,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    pausedAt: {
      type: Date,
    },
    initialBatteryPercentage: {
      type: Number,
      required: [true, 'Initial battery percentage is required'],
      min: [0, 'Battery level cannot be less than 0%'],
      max: [100, 'Battery level cannot exceed 100%'],
    },
    currentBatteryPercentage: {
      type: Number,
      required: [true, 'Current battery percentage is required'],
      min: [0, 'Battery level cannot be less than 0%'],
      max: [100, 'Battery level cannot exceed 100%'],
    },
    targetBatteryPercentage: {
      type: Number,
      required: [true, 'Target battery percentage is required'],
      min: [1, 'Target battery must be at least 1%'],
      max: [100, 'Target battery cannot exceed 100%'],
    },
    chargingPowerKw: {
      type: Number,
      required: [true, 'Charging power in kW is required'],
      min: [0, 'Charging power must be non-negative'],
    },
    energyConsumedKwh: {
      type: Number,
      default: 0,
      min: [0, 'Energy consumed cannot be negative'],
    },
    estimatedDurationMinutes: {
      type: Number,
    },
    actualDurationMinutes: {
      type: Number,
    },
    maxEnergyKwh: {
      type: Number,
    },
    stopReason: {
      type: String,
      default: '',
    },
    simulationEnabled: {
      type: Boolean,
      default: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
    finalBillAmount: {
      type: Number,
      min: [0, 'Bill amount cannot be negative'],
    },
    billedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

chargingSessionSchema.index({ userId: 1, createdAt: -1 });
chargingSessionSchema.index({ chargerId: 1, status: 1 });
chargingSessionSchema.index({ stationId: 1, status: 1 });

const ChargingSession = mongoose.model('ChargingSession', chargingSessionSchema);

module.exports = ChargingSession;
