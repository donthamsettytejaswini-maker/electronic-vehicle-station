const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      required: [true, 'Booking reference is required'],
      unique: true,
      trim: true,
      index: true,
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
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
    },
    status: {
      type: String,
      enum: {
        values: [
          'confirmed',
          'checked_in',
          'charging',
          'completed',
          'cancelled',
          'expired',
        ],
        message: '{VALUE} is not a valid booking status',
      },
      default: 'confirmed',
      index: true,
    },
    totalPrice: {
      type: Number,
      default: 0,
      min: [0, 'Total price cannot be negative'],
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded', 'not_required', 'not_implemented'],
      default: 'pending',
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
    // Phase 4 QR & Check-In Fields
    qrTokenHash: {
      type: String,
      select: false,
    },
    qrGeneratedAt: {
      type: Date,
    },
    checkedInAt: {
      type: Date,
    },
    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChargingSession',
    },
    checkInMethod: {
      type: String,
      enum: ['qr', 'booking_reference', 'admin'],
    },
    qrInvalidatedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast overlap checks
bookingSchema.index({ chargerId: 1, startTime: 1, endTime: 1 });
bookingSchema.index({ userId: 1, createdAt: -1 });

// Ensure qrTokenHash is never serialized in JSON output
bookingSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.qrTokenHash;
    delete ret.__v;
    return ret;
  },
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
