const Booking = require('../models/Booking');
const Charger = require('../models/Charger');
const ChargingSession = require('../models/ChargingSession');
const { verifyQrToken } = require('../utils/generateQrToken');
const { emitBookingStatusUpdate, emitChargerStatusUpdate } = require('../socket');

const EARLY_CHECK_IN_MINUTES = 15;
const LATE_CHECK_IN_MINUTES = 30;

// Helper to evaluate check-in time window and status eligibility
const evaluateCheckInEligibility = (booking, userRole) => {
  if (booking.status === 'cancelled') {
    return { eligible: false, reason: 'This booking has been cancelled.' };
  }
  if (booking.status === 'completed') {
    return { eligible: false, reason: 'This booking has already been completed.' };
  }
  if (booking.status === 'expired') {
    return { eligible: false, reason: 'This booking has expired.' };
  }
  if (booking.status === 'charging') {
    return { eligible: false, reason: 'A charging session is already running for this booking.' };
  }

  // Time window evaluation
  const now = new Date();
  const startTime = new Date(booking.startTime);
  const endTime = new Date(booking.endTime);

  const windowStart = new Date(startTime.getTime() - EARLY_CHECK_IN_MINUTES * 60 * 1000);
  const windowEnd = new Date(endTime.getTime() + LATE_CHECK_IN_MINUTES * 60 * 1000);

  const isWithinWindow = now >= windowStart && now <= windowEnd;

  if (!isWithinWindow && userRole !== 'admin') {
    if (now < windowStart) {
      const minutesUntil = Math.round((windowStart - now) / 60000);
      return {
        eligible: false,
        reason: `Early check-in opens ${EARLY_CHECK_IN_MINUTES} minutes before your slot (${minutesUntil} minutes remaining).`,
      };
    } else {
      return {
        eligible: false,
        reason: `Check-in window closed. You can only check in up to ${LATE_CHECK_IN_MINUTES} minutes after slot start.`,
      };
    }
  }

  return { eligible: true };
};

// @desc    Verify QR token payload for check-in
// @route   POST /api/check-in/verify
// @access  Private (User/Admin)
const verifyQrCheckIn = async (req, res, next) => {
  try {
    const { bookingReference, verificationToken } = req.body;

    if (!bookingReference || !verificationToken) {
      return res.status(400).json({
        success: false,
        message: 'bookingReference and verificationToken are required',
      });
    }

    const booking = await Booking.findOne({ bookingReference })
      .select('+qrTokenHash')
      .populate('vehicleId', 'brand model vehicleNumber batteryCapacity connectorType')
      .populate('stationId', 'name address city operatingHours status pricePerKwh')
      .populate('chargerId', 'chargerNumber connectorType powerRating status')
      .populate('userId', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Invalid booking reference',
      });
    }

    // Ownership check (only booking owner or admin can check in)
    if (req.user.role !== 'admin' && !booking.userId._id.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to check in for another user’s booking',
      });
    }

    if (booking.qrInvalidatedAt) {
      return res.status(400).json({
        success: false,
        message: 'This QR code has been invalidated or already used',
      });
    }

    // Compare token hash
    const isMatch = verifyQrToken(verificationToken, booking.qrTokenHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired QR verification token',
      });
    }

    // Evaluate timing & status rules
    const eligibility = evaluateCheckInEligibility(booking, req.user.role);
    if (!eligibility.eligible) {
      return res.status(400).json({
        success: false,
        message: eligibility.reason,
      });
    }

    // Check charger condition
    if (booking.chargerId?.status === 'maintenance' || booking.chargerId?.status === 'offline') {
      return res.status(400).json({
        success: false,
        message: `Charger is currently under ${booking.chargerId.status}. Please contact station staff.`,
      });
    }

    const safeBooking = booking.toObject();
    delete safeBooking.qrTokenHash;

    res.status(200).json({
      success: true,
      message: 'Booking QR verified successfully. Ready for check-in.',
      data: {
        booking: safeBooking,
        canCheckIn: true,
        canStartCharging: booking.status === 'checked_in',
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Manual booking reference verification fallback
// @route   POST /api/check-in/reference
// @access  Private (User/Admin)
const verifyReferenceCheckIn = async (req, res, next) => {
  try {
    const { bookingReference } = req.body;

    if (!bookingReference) {
      return res.status(400).json({
        success: false,
        message: 'Booking reference is required',
      });
    }

    const booking = await Booking.findOne({ bookingReference: bookingReference.trim().toUpperCase() })
      .populate('vehicleId', 'brand model vehicleNumber batteryCapacity connectorType')
      .populate('stationId', 'name address city operatingHours status pricePerKwh')
      .populate('chargerId', 'chargerNumber connectorType powerRating status')
      .populate('userId', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found with this reference code',
      });
    }

    if (req.user.role !== 'admin' && !booking.userId._id.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to check in for another user’s booking',
      });
    }

    const eligibility = evaluateCheckInEligibility(booking, req.user.role);
    if (!eligibility.eligible) {
      return res.status(400).json({
        success: false,
        message: eligibility.reason,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Booking reference verified successfully.',
      data: {
        booking,
        canCheckIn: true,
        canStartCharging: booking.status === 'checked_in',
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Confirm check-in and update booking and charger status
// @route   POST /api/bookings/:bookingId/check-in
// @access  Private (User/Admin)
const completeCheckIn = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { checkInMethod = 'qr' } = req.body;

    const query = { _id: bookingId };
    if (req.user.role !== 'admin') {
      query.userId = req.user._id;
    }

    const booking = await Booking.findOne(query);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (booking.status === 'checked_in') {
      return res.status(200).json({
        success: true,
        message: 'Booking is already checked in.',
        data: { booking },
      });
    }

    const eligibility = evaluateCheckInEligibility(booking, req.user.role);
    if (!eligibility.eligible) {
      return res.status(400).json({
        success: false,
        message: eligibility.reason,
      });
    }

    // Check existing active session
    const existingSession = await ChargingSession.findOne({
      bookingId: booking._id,
      status: { $in: ['initiated', 'charging', 'paused'] },
    });

    if (existingSession) {
      return res.status(400).json({
        success: false,
        message: 'An active charging session already exists for this booking.',
      });
    }

    booking.status = 'checked_in';
    booking.checkedInAt = new Date();
    booking.checkedInBy = req.user._id;
    booking.checkInMethod = checkInMethod;
    await booking.save();

    // Update charger status to reserved/ready
    const charger = await Charger.findById(booking.chargerId);
    if (charger && charger.status === 'available') {
      charger.status = 'reserved';
      await charger.save();
      emitChargerStatusUpdate(charger._id, charger.stationId, 'reserved');
    }

    emitBookingStatusUpdate(booking._id, booking.userId, 'checked_in');

    const populated = await Booking.findById(booking._id)
      .populate('vehicleId', 'brand model vehicleNumber batteryCapacity connectorType')
      .populate('stationId', 'name address city operatingHours pricePerKwh')
      .populate('chargerId', 'chargerNumber connectorType powerRating chargingSpeed status');

    res.status(200).json({
      success: true,
      message: 'Check-in confirmed successfully. You may now plug in and start charging.',
      data: {
        booking: populated,
        canStartCharging: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  verifyQrCheckIn,
  verifyReferenceCheckIn,
  completeCheckIn,
};
