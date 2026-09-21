const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    stationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChargingStation',
      required: [true, 'Station ID is required'],
      index: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking ID is required'],
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChargingSession',
      required: [true, 'Charging session ID is required'],
      index: true,
    },
    rating: {
      type: Number,
      required: [true, 'Overall rating is required'],
      min: [1, 'Rating must be at least 1 star'],
      max: [5, 'Rating cannot exceed 5 stars'],
    },
    chargingSpeedRating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
    },
    availabilityRating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
    },
    cleanlinessRating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
    },
    staffRating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Review comment cannot exceed 1000 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'published', 'hidden', 'rejected'],
        message: '{VALUE} is not a valid review status',
      },
      default: 'published',
      index: true,
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    moderatedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: User can review a station once per completed session
reviewSchema.index({ userId: 1, sessionId: 1 }, { unique: true });
reviewSchema.index({ stationId: 1, status: 1, createdAt: -1 });

/**
 * Static method to calculate and update average station rating
 */
reviewSchema.statics.updateStationAverageRating = async function (stationId) {
  const ChargingStation = mongoose.model('ChargingStation');
  const stats = await this.aggregate([
    {
      $match: {
        stationId: new mongoose.Types.ObjectId(stationId),
        status: 'published',
      },
    },
    {
      $group: {
        _id: '$stationId',
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await ChargingStation.findByIdAndUpdate(stationId, {
      averageRating: Math.round(stats[0].avgRating * 10) / 10,
      totalReviews: stats[0].totalReviews,
    });
  } else {
    await ChargingStation.findByIdAndUpdate(stationId, {
      averageRating: 0,
      totalReviews: 0,
    });
  }
};

// Post hooks to keep station average rating in sync
reviewSchema.post('save', async function () {
  await this.constructor.updateStationAverageRating(this.stationId);
});

reviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await doc.constructor.updateStationAverageRating(doc.stationId);
  }
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
