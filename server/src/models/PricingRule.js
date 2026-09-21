const mongoose = require('mongoose');

const pricingRuleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Pricing rule name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    stationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChargingStation',
      default: null, // null means applies across all stations
      index: true,
    },
    chargerType: {
      type: String,
      enum: ['ALL', 'CCS2', 'Type 2', 'CHAdeMO', 'GB/T', 'Other'],
      default: 'ALL',
    },
    ruleType: {
      type: String,
      enum: ['peak_surge', 'off_peak_discount', 'weekend_special', 'promotional', 'fixed_override'],
      default: 'peak_surge',
    },
    startTime: {
      type: String, // "09:00" in 24h format
      default: '00:00',
    },
    endTime: {
      type: String, // "21:00" in 24h format
      default: '23:59',
    },
    daysOfWeek: {
      type: [Number], // [0, 1, 2, 3, 4, 5, 6] (0 = Sunday)
      default: [0, 1, 2, 3, 4, 5, 6],
    },
    multiplier: {
      type: Number,
      default: 1.0, // 1.25 = +25% surge, 0.80 = 20% discount
      min: [0.1, 'Multiplier must be at least 0.1'],
      max: [5.0, 'Multiplier cannot exceed 5.0'],
    },
    fixedPricePerKwh: {
      type: Number,
      min: [0, 'Fixed price cannot be negative'],
    },
    priority: {
      type: Number,
      default: 1, // Higher priority overrides lower
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    effectiveFrom: {
      type: Date,
      default: Date.now,
    },
    effectiveTo: {
      type: Date,
      default: null, // null = indefinite
    },
  },
  {
    timestamps: true,
  }
);

pricingRuleSchema.index({ active: 1, priority: -1 });

const PricingRule = mongoose.model('PricingRule', pricingRuleSchema);

module.exports = PricingRule;
