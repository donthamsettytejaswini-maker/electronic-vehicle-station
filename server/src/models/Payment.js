const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    paymentReference: {
      type: String,
      required: [true, 'Payment reference is required'],
      unique: true,
      trim: true,
      index: true,
    },
    invoiceNumber: {
      type: String,
      required: [true, 'Invoice number is required'],
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
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking ID is required'],
      unique: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChargingSession',
      required: [true, 'Session ID is required'],
      unique: true,
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
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle ID is required'],
    },
    provider: {
      type: String,
      enum: {
        values: ['mock', 'stripe'],
        message: '{VALUE} is not a supported payment provider',
      },
      required: [true, 'Payment provider is required'],
      default: 'mock',
    },
    providerPaymentId: {
      type: String,
      trim: true,
      index: true,
    },
    providerOrderId: {
      type: String,
      trim: true,
    },
    providerSignature: {
      type: String,
      select: false,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true,
    },
    energyConsumedKwh: {
      type: Number,
      required: [true, 'Energy consumed is required'],
      min: [0, 'Energy consumed cannot be negative'],
    },
    ratePerKwh: {
      type: Number,
      required: [true, 'Rate per kWh is required'],
      min: [0, 'Rate cannot be negative'],
    },
    energyCharge: {
      type: Number,
      required: [true, 'Energy charge is required'],
      min: [0, 'Energy charge cannot be negative'],
    },
    serviceFee: {
      type: Number,
      default: 0,
      min: [0, 'Service fee cannot be negative'],
    },
    taxRate: {
      type: Number,
      default: 0,
      min: [0, 'Tax rate cannot be negative'],
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: [0, 'Tax amount cannot be negative'],
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: [0, 'Discount amount cannot be negative'],
    },
    subtotal: {
      type: Number,
      required: [true, 'Subtotal is required'],
      min: [0, 'Subtotal cannot be negative'],
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    paymentMethod: {
      type: String,
      enum: {
        values: [
          'mock_card',
          'mock_upi',
          'mock_cash',
          'card',
          'upi',
          'netbanking',
          'wallet',
        ],
        message: '{VALUE} is not a valid payment method',
      },
      required: [true, 'Payment method is required'],
    },
    status: {
      type: String,
      enum: {
        values: [
          'created',
          'pending',
          'processing',
          'paid',
          'failed',
          'cancelled',
          'refunded',
          'partially_refunded',
        ],
        message: '{VALUE} is not a valid payment status',
      },
      default: 'created',
      index: true,
    },
    failureReason: {
      type: String,
      trim: true,
    },
    refundAmount: {
      type: Number,
      default: 0,
      min: [0, 'Refund amount cannot be negative'],
    },
    refundReason: {
      type: String,
      trim: true,
    },
    refundedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    refundedAt: {
      type: Date,
    },
    paidAt: {
      type: Date,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ stationId: 1, createdAt: -1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
