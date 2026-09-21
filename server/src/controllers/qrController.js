const Booking = require('../models/Booking');
const { generateRawQrToken, hashQrToken } = require('../utils/generateQrToken');

// @desc    Generate or refresh QR code for a confirmed booking
// @route   POST /api/bookings/:bookingId/qr
// @access  Private (User/Admin)
const generateBookingQr = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

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

    if (booking.status !== 'confirmed' && booking.status !== 'checked_in') {
      return res.status(400).json({
        success: false,
        message: `Cannot generate QR code for a booking with status '${booking.status}'.`,
      });
    }

    const rawVerificationToken = generateRawQrToken();
    const qrTokenHash = hashQrToken(rawVerificationToken);

    booking.qrTokenHash = qrTokenHash;
    booking.qrGeneratedAt = new Date();
    booking.qrInvalidatedAt = undefined;
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'QR code generated successfully',
      data: {
        bookingReference: booking.bookingReference,
        qrPayload: {
          type: 'EVCHARGE_BOOKING',
          bookingReference: booking.bookingReference,
          verificationToken: rawVerificationToken,
        },
        qrGeneratedAt: booking.qrGeneratedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check QR code validity status for a booking
// @route   GET /api/bookings/:bookingId/qr/status
// @access  Private (User/Admin)
const getQrStatus = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

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

    const isValid =
      (booking.status === 'confirmed' || booking.status === 'checked_in') &&
      !booking.qrInvalidatedAt &&
      !!booking.qrGeneratedAt;

    res.status(200).json({
      success: true,
      data: {
        bookingReference: booking.bookingReference,
        status: booking.status,
        hasQr: !!booking.qrGeneratedAt,
        isValid,
        qrGeneratedAt: booking.qrGeneratedAt,
        qrInvalidatedAt: booking.qrInvalidatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateBookingQr,
  getQrStatus,
};
