const crypto = require('crypto');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const ChargingSession = require('../models/ChargingSession');

const processMockPayment = async (paymentId, action = 'success', failureReason = null, paymentMethod = null) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    const error = new Error('Payment record not found');
    error.statusCode = 404;
    throw error;
  }

  // Idempotency: if already paid, return existing
  if (payment.status === 'paid') {
    return {
      payment,
      alreadyPaid: true,
      message: 'Payment is already completed and verified.',
    };
  }

  if (paymentMethod) {
    payment.paymentMethod = paymentMethod;
  }

  const txId = `MOCK-TXN-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  if (action === 'success') {
    payment.status = 'paid';
    payment.paidAt = new Date();
    payment.providerPaymentId = txId;
    payment.failureReason = null;
    await payment.save();

    // Update associated Booking & ChargingSession
    await Booking.findByIdAndUpdate(payment.bookingId, {
      paymentStatus: 'paid',
      paymentId: payment._id,
    });

    await ChargingSession.findByIdAndUpdate(payment.sessionId, {
      paymentStatus: 'paid',
      paymentId: payment._id,
      finalBillAmount: payment.totalAmount,
      billedAt: new Date(),
    });

    return {
      payment,
      success: true,
      message: 'Demo payment completed and verified successfully.',
    };
  } else if (action === 'failure') {
    payment.status = 'failed';
    payment.failureReason = failureReason || 'Demo payment declined by mock gateway simulator.';
    payment.providerPaymentId = txId;
    await payment.save();

    await Booking.findByIdAndUpdate(payment.bookingId, {
      paymentStatus: 'failed',
    });

    await ChargingSession.findByIdAndUpdate(payment.sessionId, {
      paymentStatus: 'failed',
    });

    return {
      payment,
      success: false,
      message: payment.failureReason,
    };
  } else if (action === 'cancel') {
    payment.status = 'cancelled';
    payment.failureReason = 'Payment cancelled by user.';
    await payment.save();

    return {
      payment,
      success: false,
      message: 'Payment cancelled.',
    };
  } else {
    const error = new Error(`Invalid mock payment action: ${action}. Allowed: 'success', 'failure', 'cancel'`);
    error.statusCode = 400;
    throw error;
  }
};

const refundMockPayment = async (paymentId, refundAmount, reason = 'Customer refund', adminUser = null) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    const error = new Error('Payment record not found');
    error.statusCode = 404;
    throw error;
  }

  if (payment.status !== 'paid' && payment.status !== 'partially_refunded') {
    const error = new Error(`Cannot refund payment with status: ${payment.status}. Only paid payments can be refunded.`);
    error.statusCode = 400;
    throw error;
  }

  const requestedRefund = Number(refundAmount) || payment.totalAmount;
  if (requestedRefund <= 0) {
    const error = new Error('Refund amount must be greater than zero');
    error.statusCode = 400;
    throw error;
  }

  const alreadyRefunded = payment.refundAmount || 0;
  const maxRefundable = payment.totalAmount - alreadyRefunded;

  if (requestedRefund > maxRefundable) {
    const error = new Error(`Requested refund of ₹${requestedRefund} exceeds maximum refundable amount of ₹${maxRefundable}`);
    error.statusCode = 400;
    throw error;
  }

  const newTotalRefund = Math.round((alreadyRefunded + requestedRefund + Number.EPSILON) * 100) / 100;
  const isFullRefund = newTotalRefund >= payment.totalAmount;

  payment.refundAmount = newTotalRefund;
  payment.refundReason = reason;
  payment.refundedAt = new Date();
  payment.refundedBy = adminUser?._id || null;
  payment.status = isFullRefund ? 'refunded' : 'partially_refunded';
  await payment.save();

  // Update Booking & ChargingSession status
  const finalStatus = isFullRefund ? 'refunded' : 'paid';
  await Booking.findByIdAndUpdate(payment.bookingId, {
    paymentStatus: finalStatus,
  });

  await ChargingSession.findByIdAndUpdate(payment.sessionId, {
    paymentStatus: finalStatus,
  });

  return {
    payment,
    refundedAmount: requestedRefund,
    totalRefunded: newTotalRefund,
    status: payment.status,
    message: isFullRefund ? 'Full refund processed successfully' : 'Partial refund processed successfully',
  };
};

module.exports = {
  processMockPayment,
  refundMockPayment,
};
