const Booking = require('../models/Booking');
const ChargingStation = require('../models/ChargingStation');
const Charger = require('../models/Charger');
const Vehicle = require('../models/Vehicle');
const generateBookingReference = require('../utils/generateBookingReference');
const { generateRawQrToken, hashQrToken } = require('../utils/generateQrToken');
const { emitBookingStatusUpdate } = require('../socket');

// @desc    Create a new slot booking
// @route   POST /api/bookings
// @access  Private (User/Admin)
const createBooking = async (req, res, next) => {
  try {
    const { vehicleId, stationId, chargerId, startTime, endTime } = req.body;

    if (!vehicleId || !stationId || !chargerId || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide vehicleId, stationId, chargerId, startTime, and endTime',
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date/time format',
      });
    }

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'Start time must be before end time',
      });
    }

    // Verify Vehicle ownership
    const vehicle = await Vehicle.findOne({ _id: vehicleId, userId: req.user._id });
    if (!vehicle && req.user.role !== 'admin') {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found or does not belong to your account',
      });
    }

    // Verify Station and Charger
    const station = await ChargingStation.findById(stationId);
    if (!station || station.status === 'inactive') {
      return res.status(400).json({
        success: false,
        message: 'Charging station is inactive or not found',
      });
    }

    const charger = await Charger.findOne({ _id: chargerId, stationId });
    if (!charger || charger.status === 'maintenance' || charger.status === 'offline') {
      return res.status(400).json({
        success: false,
        message: `Selected charger is currently ${charger?.status || 'unavailable'}`,
      });
    }

    // Overlap prevention check
    const overlapping = await Booking.findOne({
      chargerId,
      status: { $in: ['confirmed', 'checked_in', 'charging'] },
      $or: [
        { startTime: { $lt: end, $gte: start } },
        { endTime: { $gt: start, $lte: end } },
        { startTime: { $lte: start }, endTime: { $gte: end } },
      ],
    });

    if (overlapping) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is already reserved for the selected charger. Please pick another slot.',
      });
    }

    // Calculate approximate price (duration in hours * rate)
    const durationHours = (end - start) / (1000 * 60 * 60);
    const ratePerKwh = charger.pricePerKwh ?? station.pricePerKwh;
    // Estimated energy = powerRating * durationHours * 0.8 efficiency
    const estimatedKwh = charger.powerRating * durationHours * 0.8;
    const totalPrice = Number((estimatedKwh * ratePerKwh).toFixed(2));

    const bookingReference = generateBookingReference();
    const rawQrToken = generateRawQrToken();
    const qrTokenHash = hashQrToken(rawQrToken);

    const booking = await Booking.create({
      bookingReference,
      userId: req.user._id,
      vehicleId,
      stationId,
      chargerId,
      startTime: start,
      endTime: end,
      status: 'confirmed',
      totalPrice,
      paymentStatus: 'pending',
      qrTokenHash,
      qrGeneratedAt: new Date(),
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('vehicleId', 'brand model vehicleNumber connectorType batteryCapacity')
      .populate('stationId', 'name address city operatingHours pricePerKwh')
      .populate('chargerId', 'chargerNumber connectorType powerRating chargingSpeed');

    res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully',
      data: {
        booking: populatedBooking,
        qrPayload: {
          type: 'EVCHARGE_BOOKING',
          bookingReference,
          verificationToken: rawQrToken,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user bookings
// @route   GET /api/bookings
// @access  Private
const getUserBookings = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { userId: req.user._id };

    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .sort({ startTime: -1 })
      .populate('vehicleId', 'brand model vehicleNumber connectorType batteryCapacity')
      .populate('stationId', 'name address city pricePerKwh phone')
      .populate('chargerId', 'chargerNumber connectorType powerRating chargingSpeed status')
      .populate('sessionId');

    res.status(200).json({
      success: true,
      data: {
        items: bookings,
        total: bookings.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single booking details
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = async (req, res, next) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== 'admin') {
      query.userId = req.user._id;
    }

    const booking = await Booking.findOne(query)
      .populate('vehicleId', 'brand model vehicleNumber connectorType batteryCapacity maxChargingPower color')
      .populate('stationId', 'name address city state operatingHours phone pricePerKwh facilities')
      .populate('chargerId', 'chargerNumber connectorType powerRating chargingSpeed status pricePerKwh')
      .populate('sessionId')
      .populate('userId', 'name email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    res.status(200).json({
      success: true,
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a booking
// @route   PATCH /api/bookings/:id/cancel
// @access  Private
const cancelBooking = async (req, res, next) => {
  try {
    const query = { _id: req.params.id };
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

    if (booking.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel booking in '${booking.status}' status. Only confirmed upcoming bookings can be cancelled.`,
      });
    }

    booking.status = 'cancelled';
    booking.qrInvalidatedAt = new Date();
    await booking.save();

    emitBookingStatusUpdate(booking._id, booking.userId, 'cancelled');

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bookings (Admin only)
// @route   GET /api/bookings/admin/all
// @access  Private (Admin Only)
const getAllBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('userId', 'name email phone')
      .populate('vehicleId', 'brand model vehicleNumber')
      .populate('stationId', 'name city')
      .populate('chargerId', 'chargerNumber connectorType powerRating');

    res.status(200).json({
      success: true,
      data: {
        items: bookings,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get booked slots for a charger on a specific date
// @route   GET /api/bookings/slots
// @access  Public / Authenticated
const getAvailableSlots = async (req, res, next) => {
  try {
    const { chargerId, date } = req.query;

    if (!chargerId || !date) {
      return res.status(400).json({
        success: false,
        message: 'chargerId and date (YYYY-MM-DD) are required',
      });
    }

    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);

    const existingBookings = await Booking.find({
      chargerId,
      status: { $in: ['confirmed', 'checked_in', 'charging'] },
      $or: [
        { startTime: { $gte: dayStart, $lte: dayEnd } },
        { endTime: { $gte: dayStart, $lte: dayEnd } },
      ],
    }).select('startTime endTime status');

    res.status(200).json({
      success: true,
      data: {
        date,
        chargerId,
        bookedSlots: existingBookings,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  getAllBookings,
  getAvailableSlots,
};
