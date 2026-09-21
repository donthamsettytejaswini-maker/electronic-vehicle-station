const mongoose = require('mongoose');

const chargingStationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Station name is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      index: true,
    },
    state: {
      type: String,
      trim: true,
      default: '',
    },
    postalCode: {
      type: String,
      trim: true,
      default: '',
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90'],
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180'],
    },
    pricePerKwh: {
      type: Number,
      required: [true, 'Price per kWh is required'],
      min: [0, 'Price per kWh cannot be negative'],
      index: true,
    },
    operatingHours: {
      type: String,
      required: [true, 'Operating hours is required'],
      default: '24 hours',
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    facilities: {
      type: [String],
      default: ['Parking'],
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'inactive', 'maintenance'],
        message: '{VALUE} is not a valid station status',
      },
      default: 'active',
      index: true,
    },
    image: {
      type: String,
      default: '',
      trim: true,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot be more than 5'],
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator ID is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for coordinate searches
chargingStationSchema.index({ latitude: 1, longitude: 1 });

const ChargingStation = mongoose.model('ChargingStation', chargingStationSchema);

module.exports = ChargingStation;
