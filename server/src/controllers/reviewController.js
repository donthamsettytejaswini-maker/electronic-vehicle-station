const Review = require('../models/Review');
const ChargingSession = require('../models/ChargingSession');
const ChargingStation = require('../models/ChargingStation');

/**
 * @desc Create a review for a completed session
 * @route POST /api/reviews
 * @access Private (User who completed session)
 */
const createReview = async (req, res, next) => {
  try {
    const {
      sessionId,
      rating,
      chargingSpeedRating,
      availabilityRating,
      cleanlinessRating,
      staffRating,
      comment,
    } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Charging session ID is required',
      });
    }

    const session = await ChargingSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Charging session not found',
      });
    }

    // Ownership & completion guard
    if (session.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only review your own completed charging sessions',
      });
    }

    if (session.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Only completed charging sessions can be reviewed',
      });
    }

    // Prevent duplicate reviews for the same session
    const existingReview = await Review.findOne({
      userId: req.user._id,
      sessionId: session._id,
    });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a review for this charging session',
      });
    }

    const parsedRating = Number(rating);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be a number between 1 and 5',
      });
    }

    const review = await Review.create({
      userId: req.user._id,
      stationId: session.stationId,
      bookingId: session.bookingId,
      sessionId: session._id,
      rating: parsedRating,
      chargingSpeedRating: Number(chargingSpeedRating) || parsedRating,
      availabilityRating: Number(availabilityRating) || parsedRating,
      cleanlinessRating: Number(cleanlinessRating) || parsedRating,
      staffRating: Number(staffRating) || parsedRating,
      comment: comment ? String(comment).trim() : '',
      status: 'published',
    });

    const populatedReview = await Review.findById(review._id).populate('userId', 'name avatar');

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: populatedReview,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get published reviews for a station
 * @route GET /api/stations/:stationId/reviews
 * @access Public
 */
const getStationReviews = async (req, res, next) => {
  try {
    const { stationId } = req.params;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const [total, reviews] = await Promise.all([
      Review.countDocuments({ stationId, status: 'published' }),
      Review.find({ stationId, status: 'published' })
        .populate('userId', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        reviews,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update review (user can edit own review)
 * @route PUT /api/reviews/:id
 * @access Private
 */
const updateReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    if (review.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this review',
      });
    }

    const {
      rating,
      chargingSpeedRating,
      availabilityRating,
      cleanlinessRating,
      staffRating,
      comment,
    } = req.body;

    if (rating !== undefined) {
      const parsedRating = Number(rating);
      if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5',
        });
      }
      review.rating = parsedRating;
    }

    if (chargingSpeedRating !== undefined) review.chargingSpeedRating = Number(chargingSpeedRating);
    if (availabilityRating !== undefined) review.availabilityRating = Number(availabilityRating);
    if (cleanlinessRating !== undefined) review.cleanlinessRating = Number(cleanlinessRating);
    if (staffRating !== undefined) review.staffRating = Number(staffRating);
    if (comment !== undefined) review.comment = String(comment).trim();

    await review.save();
    const updated = await Review.findById(review._id).populate('userId', 'name avatar');

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Delete review
 * @route DELETE /api/reviews/:id
 * @access Private
 */
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    if (review.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review',
      });
    }

    const stationId = review.stationId;
    await Review.findByIdAndDelete(req.params.id);
    await Review.updateStationAverageRating(stationId);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Admin list all reviews with filter
 * @route GET /api/admin/reviews
 * @access Admin
 */
const getAdminReviews = async (req, res, next) => {
  try {
    const { status, stationId } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = {};
    if (status) query.status = status;
    if (stationId) query.stationId = stationId;

    const [total, reviews] = await Promise.all([
      Review.countDocuments(query),
      Review.find(query)
        .populate('userId', 'name email')
        .populate('stationId', 'name city')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        reviews,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Admin moderate review status
 * @route PATCH /api/admin/reviews/:id/status
 * @access Admin
 */
const updateReviewStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['pending', 'published', 'hidden', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review status',
      });
    }

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    review.status = status;
    review.moderatedBy = req.user._id;
    review.moderatedAt = new Date();
    await review.save();

    await Review.updateStationAverageRating(review.stationId);

    res.status(200).json({
      success: true,
      message: `Review marked as ${status}`,
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getStationReviews,
  updateReview,
  deleteReview,
  getAdminReviews,
  updateReviewStatus,
};
