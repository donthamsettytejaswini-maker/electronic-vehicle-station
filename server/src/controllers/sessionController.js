const ChargingSession = require('../models/ChargingSession');
const Booking = require('../models/Booking');
const Charger = require('../models/Charger');
const ChargingStation = require('../models/ChargingStation');
const generateSessionReference = require('../utils/generateSessionReference');
const {
  startSimulation,
  stopSimulation,
} = require('../services/chargingSimulationService');
const {
  emitSessionEvent,
  emitChargerStatusUpdate,
  emitBookingStatusUpdate,
} = require('../socket');

// @desc    Start a simulated charging session
// @route   POST /api/sessions/start
// @access  Private (User/Admin)
const startSession = async (req, res, next) => {
  try {
    const {
      bookingId,
      initialBatteryPercentage = 42,
      targetBatteryPercentage = 80,
    } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required',
      });
    }

    const query = { _id: bookingId };
    if (req.user.role !== 'admin') {
      query.userId = req.user._id;
    }

    const booking = await Booking.findOne(query);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or access denied',
      });
    }

    if (booking.status !== 'checked_in') {
      return res.status(400).json({
        success: false,
        message: `Booking must be checked in before starting charging. Current status: '${booking.status}'.`,
      });
    }

    // Check duplicate active session
    const existingSession = await ChargingSession.findOne({
      bookingId: booking._id,
      status: { $in: ['initiated', 'charging', 'paused'] },
    });

    if (existingSession) {
      return res.status(400).json({
        success: false,
        message: 'An active session is already in progress for this booking',
        data: { session: existingSession },
      });
    }

    const initPct = Math.max(0, Math.min(100, Number(initialBatteryPercentage)));
    const targetPct = Math.max(initPct + 1, Math.min(100, Number(targetBatteryPercentage)));

    const charger = await Charger.findById(booking.chargerId);
    const station = await ChargingStation.findById(booking.stationId);

    const powerKw = charger?.powerRating || 30;
    const sessionReference = generateSessionReference();

    const session = await ChargingSession.create({
      sessionReference,
      bookingId: booking._id,
      userId: booking.userId,
      vehicleId: booking.vehicleId,
      stationId: booking.stationId,
      chargerId: booking.chargerId,
      status: 'charging',
      startedAt: new Date(),
      initialBatteryPercentage: initPct,
      currentBatteryPercentage: initPct,
      targetBatteryPercentage: targetPct,
      chargingPowerKw: powerKw,
      energyConsumedKwh: 0,
      estimatedDurationMinutes: Math.round(((targetPct - initPct) / 100) * 40 * (60 / powerKw)),
      simulationEnabled: true,
    });

    // Update booking
    booking.status = 'charging';
    booking.sessionId = session._id;
    await booking.save();

    // Update charger
    if (charger && charger.status !== 'maintenance' && charger.status !== 'offline') {
      charger.status = 'charging';
      await charger.save();
      emitChargerStatusUpdate(charger._id, charger.stationId, 'charging');
    }

    emitBookingStatusUpdate(booking._id, booking.userId, 'charging');

    const populatedSession = await ChargingSession.findById(session._id)
      .populate('vehicleId', 'brand model vehicleNumber batteryCapacity connectorType')
      .populate('stationId', 'name address city pricePerKwh')
      .populate('chargerId', 'chargerNumber powerRating connectorType chargingSpeed')
      .populate('bookingId', 'bookingReference startTime endTime totalPrice');

    // Start background simulation engine
    startSimulation(populatedSession);
    emitSessionEvent('session:started', populatedSession);

    res.status(201).json({
      success: true,
      message: 'Charging session started successfully',
      data: { session: populatedSession },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get session details by ID
// @route   GET /api/sessions/:id
// @access  Private
const getSessionById = async (req, res, next) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== 'admin') {
      query.userId = req.user._id;
    }

    const session = await ChargingSession.findOne(query)
      .populate('vehicleId', 'brand model vehicleNumber batteryCapacity connectorType maxChargingPower color')
      .populate('stationId', 'name address city state operatingHours phone pricePerKwh facilities')
      .populate('chargerId', 'chargerNumber powerRating connectorType chargingSpeed pricePerKwh status')
      .populate('bookingId', 'bookingReference startTime endTime totalPrice paymentStatus checkedInAt')
      .populate('userId', 'name email phone');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Charging session not found',
      });
    }

    res.status(200).json({
      success: true,
      data: { session },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current active session for logged-in user
// @route   GET /api/sessions/active
// @access  Private
const getActiveSession = async (req, res, next) => {
  try {
    const session = await ChargingSession.findOne({
      userId: req.user._id,
      status: { $in: ['initiated', 'charging', 'paused'] },
    })
      .sort({ createdAt: -1 })
      .populate('vehicleId', 'brand model vehicleNumber batteryCapacity connectorType')
      .populate('stationId', 'name address city pricePerKwh')
      .populate('chargerId', 'chargerNumber powerRating connectorType chargingSpeed status')
      .populate('bookingId', 'bookingReference startTime endTime totalPrice');

    res.status(200).json({
      success: true,
      data: { session },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Pause active charging session
// @route   PATCH /api/sessions/:id/pause
// @access  Private
const pauseSession = async (req, res, next) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== 'admin') {
      query.userId = req.user._id;
    }

    const session = await ChargingSession.findOne(query);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    if (session.status !== 'charging') {
      return res.status(409).json({
        success: false,
        message: `Cannot pause session with status '${session.status}'.`,
      });
    }

    session.status = 'paused';
    session.pausedAt = new Date();
    await session.save();

    stopSimulation(session._id);
    emitSessionEvent('session:paused', session);

    res.status(200).json({
      success: true,
      message: 'Charging session paused',
      data: { session },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resume paused charging session
// @route   PATCH /api/sessions/:id/resume
// @access  Private
const resumeSession = async (req, res, next) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== 'admin') {
      query.userId = req.user._id;
    }

    const session = await ChargingSession.findOne(query)
      .populate('vehicleId', 'batteryCapacity')
      .populate('chargerId', 'powerRating');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    if (session.status !== 'paused') {
      return res.status(409).json({
        success: false,
        message: `Cannot resume session with status '${session.status}'.`,
      });
    }

    session.status = 'charging';
    session.pausedAt = undefined;
    await session.save();

    startSimulation(session);
    emitSessionEvent('session:resumed', session);

    res.status(200).json({
      success: true,
      message: 'Charging session resumed',
      data: { session },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Controlled manual simulation update endpoint
// @route   PATCH /api/sessions/:id/update
// @access  Private
const updateSession = async (req, res, next) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== 'admin') {
      query.userId = req.user._id;
    }

    const session = await ChargingSession.findOne(query);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    const { currentBatteryPercentage, energyConsumedKwh, chargingPowerKw } = req.body;

    if (currentBatteryPercentage !== undefined) {
      session.currentBatteryPercentage = Math.min(
        session.targetBatteryPercentage,
        Math.max(session.initialBatteryPercentage, Number(currentBatteryPercentage))
      );
    }

    if (energyConsumedKwh !== undefined) {
      session.energyConsumedKwh = Math.max(0, Number(energyConsumedKwh));
    }

    if (chargingPowerKw !== undefined) {
      session.chargingPowerKw = Math.max(0, Number(chargingPowerKw));
    }

    await session.save();
    emitSessionEvent('session:updated', session);

    res.status(200).json({
      success: true,
      message: 'Session telemetry updated',
      data: { session },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete charging session
// @route   PATCH /api/sessions/:id/complete
// @access  Private
const completeSession = async (req, res, next) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== 'admin') {
      query.userId = req.user._id;
    }

    const session = await ChargingSession.findOne(query);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    if (session.status === 'completed') {
      return res.status(200).json({
        success: true,
        message: 'Session is already completed',
        data: { session },
      });
    }

    stopSimulation(session._id);

    const now = new Date();
    session.status = 'completed';
    session.completedAt = now;
    session.actualDurationMinutes = Math.max(
      1,
      Math.round((now - new Date(session.startedAt || session.createdAt)) / 60000)
    );
    await session.save();

    // Update booking
    const booking = await Booking.findById(session.bookingId);
    if (booking) {
      booking.status = 'completed';
      booking.qrInvalidatedAt = now;
      await booking.save();
      emitBookingStatusUpdate(booking._id, booking.userId, 'completed');
    }

    // Update charger
    const charger = await Charger.findById(session.chargerId);
    if (charger && charger.status !== 'maintenance' && charger.status !== 'offline') {
      charger.status = 'available';
      await charger.save();
      emitChargerStatusUpdate(charger._id, charger.stationId, 'available');
    }

    emitSessionEvent('session:completed', session);

    const populated = await ChargingSession.findById(session._id)
      .populate('vehicleId', 'brand model vehicleNumber batteryCapacity connectorType')
      .populate('stationId', 'name address city pricePerKwh')
      .populate('chargerId', 'chargerNumber powerRating connectorType chargingSpeed')
      .populate('bookingId', 'bookingReference startTime endTime totalPrice');

    res.status(200).json({
      success: true,
      message: 'Charging session completed successfully. Payment pending in Phase 5.',
      data: { session: populated },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Stop charging session with reason
// @route   POST /api/sessions/:id/stop
// @access  Private
const stopSession = async (req, res, next) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== 'admin') {
      query.userId = req.user._id;
    }

    const { reason = 'Stopped by user' } = req.body;

    const session = await ChargingSession.findOne(query);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    stopSimulation(session._id);

    const now = new Date();
    session.status = 'stopped';
    session.completedAt = now;
    session.stopReason = reason;
    session.actualDurationMinutes = Math.max(
      1,
      Math.round((now - new Date(session.startedAt || session.createdAt)) / 60000)
    );
    await session.save();

    // Update booking
    const booking = await Booking.findById(session.bookingId);
    if (booking) {
      booking.status = 'completed';
      booking.qrInvalidatedAt = now;
      await booking.save();
      emitBookingStatusUpdate(booking._id, booking.userId, 'completed');
    }

    // Update charger
    const charger = await Charger.findById(session.chargerId);
    if (charger && charger.status !== 'maintenance' && charger.status !== 'offline') {
      charger.status = 'available';
      await charger.save();
      emitChargerStatusUpdate(charger._id, charger.stationId, 'available');
    }

    emitSessionEvent('session:stopped', session);

    res.status(200).json({
      success: true,
      message: 'Charging session stopped',
      data: { session },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user charging history
// @route   GET /api/sessions/history
// @access  Private
const getSessionHistory = async (req, res, next) => {
  try {
    const { status, stationId, page = 1, limit = 10 } = req.query;
    const query = {
      userId: req.user._id,
      status: { $in: ['completed', 'stopped', 'failed'] },
    };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (stationId) {
      query.stationId = stationId;
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await ChargingSession.countDocuments(query);
    const sessions = await ChargingSession.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('vehicleId', 'brand model vehicleNumber batteryCapacity connectorType')
      .populate('stationId', 'name address city pricePerKwh')
      .populate('chargerId', 'chargerNumber powerRating connectorType chargingSpeed')
      .populate('bookingId', 'bookingReference startTime endTime totalPrice');

    res.status(200).json({
      success: true,
      data: {
        items: sessions,
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

// @desc    Get all active sessions across stations (Admin only)
// @route   GET /api/sessions/admin/active
// @access  Private (Admin Only)
const getAllActiveSessions = async (req, res, next) => {
  try {
    const sessions = await ChargingSession.find({
      status: { $in: ['initiated', 'charging', 'paused'] },
    })
      .sort({ createdAt: -1 })
      .populate('userId', 'name email phone')
      .populate('vehicleId', 'brand model vehicleNumber batteryCapacity')
      .populate('stationId', 'name city address')
      .populate('chargerId', 'chargerNumber powerRating connectorType status')
      .populate('bookingId', 'bookingReference startTime endTime');

    res.status(200).json({
      success: true,
      data: {
        items: sessions,
        total: sessions.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  startSession,
  getSessionById,
  getActiveSession,
  pauseSession,
  resumeSession,
  updateSession,
  completeSession,
  stopSession,
  getSessionHistory,
  getAllActiveSessions,
};
