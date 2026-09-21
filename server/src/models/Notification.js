const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    type: {
      type: String,
      required: [true, 'Notification type is required'],
      enum: [
        'booking_confirmed',
        'booking_cancelled',
        'booking_reminder',
        'check_in_completed',
        'charging_started',
        'charging_paused',
        'charging_completed',
        'payment_success',
        'payment_failed',
        'refund_completed',
        'charger_maintenance',
        'station_unavailable',
        'demand_warning',
        'system_alert',
      ],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    readAt: {
      type: Date,
      default: null,
      index: true,
    },
    channel: {
      type: String,
      enum: ['in_app', 'email', 'push'],
      default: 'in_app',
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast user unread queries
notificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
