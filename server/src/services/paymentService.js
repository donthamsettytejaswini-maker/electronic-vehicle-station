const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const ChargingSession = require('../models/ChargingSession');
const { calculateInvoiceForSession, createOrGetInvoiceForSession } = require('./billingService');
const { processMockPayment, refundMockPayment } = require('./mockPaymentService');
const {
  createStripeCheckoutSession,
  createStripePaymentIntent,
  refundStripePayment,
  isStripeConfigured,
} = require('./stripePaymentService');

// State transition validation map
const ALLOWED_PAYMENT_TRANSITIONS = {
  created: ['pending', 'cancelled'],
  pending: ['processing', 'paid', 'failed', 'cancelled'],
  processing: ['paid', 'failed', 'cancelled'],
  paid: ['refunded', 'partially_refunded'],
  failed: ['pending'],
  partially_refunded: ['refunded'],
  cancelled: [],
  refunded: [],
};

const validatePaymentTransition = (currentStatus, nextStatus) => {
  if (currentStatus === nextStatus) return true;
  const allowed = ALLOWED_PAYMENT_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    const error = new Error(`Invalid payment status transition from '${currentStatus}' to '${nextStatus}'`);
    error.statusCode = 409;
    throw error;
  }
  return true;
};

// 1. Create Payment record for a completed session
const createPayment = async (sessionId, paymentMethod = 'mock_upi', provider = null, user = null, isAdmin = false) => {
  const payment = await createOrGetInvoiceForSession(
    sessionId,
    paymentMethod,
    provider,
    user?._id,
    isAdmin
  );

  // If Stripe mode is requested and payment is pending
  if (payment.provider === 'stripe' && payment.status === 'pending') {
    const stripeData = await createStripeCheckoutSession(payment._id);
    return {
      payment,
      stripe: stripeData,
    };
  }

  return { payment };
};

// 2. Get payment by ID
const getPaymentById = async (paymentId, requestingUserId = null, isAdmin = false) => {
  const payment = await Payment.findById(paymentId)
    .populate('bookingId')
    .populate('sessionId')
    .populate('stationId')
    .populate('chargerId')
    .populate('vehicleId')
    .populate('userId', 'name email phone')
    .populate('refundedBy', 'name email');

  if (!payment) {
    const error = new Error('Payment record not found');
    error.statusCode = 404;
    throw error;
  }

  if (requestingUserId && !isAdmin && payment.userId._id.toString() !== requestingUserId.toString()) {
    const error = new Error('Unauthorized access to payment record');
    error.statusCode = 403;
    throw error;
  }

  return payment;
};

// 3. Get payment by Reference
const getPaymentByReference = async (paymentReference, requestingUserId = null, isAdmin = false) => {
  const payment = await Payment.findOne({ paymentReference })
    .populate('bookingId')
    .populate('sessionId')
    .populate('stationId')
    .populate('chargerId')
    .populate('vehicleId')
    .populate('userId', 'name email phone')
    .populate('refundedBy', 'name email');

  if (!payment) {
    const error = new Error('Payment record not found');
    error.statusCode = 404;
    throw error;
  }

  if (requestingUserId && !isAdmin && payment.userId._id.toString() !== requestingUserId.toString()) {
    const error = new Error('Unauthorized access to payment record');
    error.statusCode = 403;
    throw error;
  }

  return payment;
};

// 4. Verify Payment (Mock or Stripe)
const verifyPayment = async (paymentId, action = 'success', failureReason = null, paymentMethod = null, user = null, isAdmin = false) => {
  const payment = await getPaymentById(paymentId, user?._id, isAdmin);

  if (payment.provider === 'mock') {
    return await processMockPayment(paymentId, action, failureReason, paymentMethod);
  } else if (payment.provider === 'stripe') {
    if (payment.status === 'paid') {
      return { payment, alreadyPaid: true, message: 'Payment verified via Stripe.' };
    }
    return { payment, message: 'Payment is being processed by Stripe webhook.' };
  } else {
    return await processMockPayment(paymentId, action, failureReason, paymentMethod);
  }
};

// 5. Get My Payments (User)
const getMyPayments = async (userId, query = {}) => {
  const {
    status,
    stationId,
    fromDate,
    toDate,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = query;

  const filter = { userId };
  if (status) filter.status = status;
  if (stationId) filter.stationId = stationId;
  if (fromDate || toDate) {
    filter.createdAt = {};
    if (fromDate) filter.createdAt.$gte = new Date(fromDate);
    if (toDate) filter.createdAt.$lte = new Date(toDate);
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, parseInt(limit, 10));
  const skip = (pageNum - 1) * limitNum;
  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .populate('stationId', 'name city address')
      .populate('vehicleId', 'brand model vehicleNumber')
      .populate('sessionId', 'sessionReference energyConsumedKwh startedAt completedAt')
      .populate('bookingId', 'bookingReference startTime endTime')
      .sort(sort)
      .skip(skip)
      .limit(limitNum),
    Payment.countDocuments(filter),
  ]);

  return {
    payments,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

// 6. Get Payment Receipt
const getPaymentReceipt = async (paymentId, requestingUserId = null, isAdmin = false) => {
  const payment = await getPaymentById(paymentId, requestingUserId, isAdmin);
  return {
    receipt: {
      paymentReference: payment.paymentReference,
      invoiceNumber: payment.invoiceNumber,
      paidAt: payment.paidAt || payment.updatedAt,
      createdAt: payment.createdAt,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      provider: payment.provider,
      providerPaymentId: payment.providerPaymentId,
      customer: {
        name: payment.userId?.name,
        email: payment.userId?.email,
        phone: payment.userId?.phone,
      },
      station: {
        name: payment.stationId?.name,
        address: payment.stationId?.address,
        city: payment.stationId?.city,
        state: payment.stationId?.state,
      },
      charger: {
        name: payment.chargerId?.name || payment.chargerId?.chargerNumber || 'Port 1',
        type: payment.chargerId?.connectorType || 'CCS2',
        powerRating: payment.chargerId?.powerRating,
      },
      vehicle: {
        brand: payment.vehicleId?.brand,
        model: payment.vehicleId?.model,
        licensePlate: payment.vehicleId?.vehicleNumber,
      },
      session: {
        sessionReference: payment.sessionId?.sessionReference,
        startedAt: payment.sessionId?.startedAt,
        completedAt: payment.sessionId?.completedAt,
        actualDurationMinutes: payment.sessionId?.actualDurationMinutes || 0,
      },
      booking: {
        bookingReference: payment.bookingId?.bookingReference,
      },
      lineItems: {
        energyConsumedKwh: payment.energyConsumedKwh,
        ratePerKwh: payment.ratePerKwh,
        energyCharge: payment.energyCharge,
        serviceFee: payment.serviceFee,
        taxRate: payment.taxRate,
        taxAmount: payment.taxAmount,
        discountAmount: payment.discountAmount,
        subtotal: payment.subtotal,
        totalAmount: payment.totalAmount,
        currency: payment.currency,
        currencySymbol: process.env.BILLING_CURRENCY_SYMBOL || '₹',
      },
      refund: payment.refundAmount > 0 ? {
        refundAmount: payment.refundAmount,
        refundedAt: payment.refundedAt,
        refundReason: payment.refundReason,
      } : null,
    },
  };
};

// 7. Cancel Payment
const cancelPayment = async (paymentId, requestingUserId = null, isAdmin = false) => {
  const payment = await getPaymentById(paymentId, requestingUserId, isAdmin);
  if (payment.status === 'paid' || payment.status === 'refunded') {
    const error = new Error(`Cannot cancel a payment that is already ${payment.status}.`);
    error.statusCode = 400;
    throw error;
  }
  payment.status = 'cancelled';
  payment.failureReason = 'Cancelled by user';
  await payment.save();

  return payment;
};

// 8. Request Refund (Admin)
const requestRefund = async (paymentId, refundAmount, reason, adminUser) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    const error = new Error('Payment record not found');
    error.statusCode = 404;
    throw error;
  }

  if (payment.provider === 'stripe') {
    await refundStripePayment(paymentId, refundAmount, reason);
  }

  return await refundMockPayment(paymentId, refundAmount, reason, adminUser);
};

// 9. Get Admin Payments
const getAdminPayments = async (query = {}) => {
  const {
    status,
    provider,
    stationId,
    search,
    fromDate,
    toDate,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = query;

  const filter = {};
  if (status) filter.status = status;
  if (provider) filter.provider = provider;
  if (stationId) filter.stationId = stationId;
  if (search) {
    filter.$or = [
      { paymentReference: { $regex: search, $options: 'i' } },
      { invoiceNumber: { $regex: search, $options: 'i' } },
    ];
  }
  if (fromDate || toDate) {
    filter.createdAt = {};
    if (fromDate) filter.createdAt.$gte = new Date(fromDate);
    if (toDate) filter.createdAt.$lte = new Date(toDate);
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, parseInt(limit, 10));
  const skip = (pageNum - 1) * limitNum;
  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .populate('userId', 'name email phone')
      .populate('stationId', 'name city address')
      .populate('vehicleId', 'brand model vehicleNumber')
      .populate('sessionId', 'sessionReference energyConsumedKwh startedAt completedAt')
      .populate('bookingId', 'bookingReference startTime endTime')
      .sort(sort)
      .skip(skip)
      .limit(limitNum),
    Payment.countDocuments(filter),
  ]);

  return {
    payments,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

// 10. Admin Revenue Analytics
const getAdminRevenue = async (query = {}) => {
  const { stationId, fromDate, toDate } = query;
  const matchPaid = { status: { $in: ['paid', 'partially_refunded'] } };

  if (stationId) matchPaid.stationId = stationId;
  if (fromDate || toDate) {
    matchPaid.createdAt = {};
    if (fromDate) matchPaid.createdAt.$gte = new Date(fromDate);
    if (toDate) matchPaid.createdAt.$lte = new Date(toDate);
  }

  // Summary aggregation
  const [allPayments, todayPayments, monthPayments] = await Promise.all([
    Payment.find(matchPaid),
    Payment.find({
      ...matchPaid,
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    }),
    Payment.find({
      ...matchPaid,
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
    }),
  ]);

  const pendingPayments = await Payment.find({ status: 'pending' });
  const refundedPayments = await Payment.find({ status: { $in: ['refunded', 'partially_refunded'] } });

  const totalPaidRevenue = allPayments.reduce((acc, p) => acc + (p.totalAmount - (p.refundAmount || 0)), 0);
  const grossRevenue = allPayments.reduce((acc, p) => acc + p.totalAmount, 0);
  const totalRefundedAmount = refundedPayments.reduce((acc, p) => acc + (p.refundAmount || 0), 0);
  const todayRevenue = todayPayments.reduce((acc, p) => acc + (p.totalAmount - (p.refundAmount || 0)), 0);
  const thisMonthRevenue = monthPayments.reduce((acc, p) => acc + (p.totalAmount - (p.refundAmount || 0)), 0);
  const pendingAmount = pendingPayments.reduce((acc, p) => acc + p.totalAmount, 0);
  const totalEnergyConsumedKwh = allPayments.reduce((acc, p) => acc + (p.energyConsumedKwh || 0), 0);
  const successfulPaymentsCount = allPayments.length;
  const averageTransactionValue = successfulPaymentsCount > 0 ? (grossRevenue / successfulPaymentsCount) : 0;

  // Revenue by Station
  const revenueByStationAgg = await Payment.aggregate([
    { $match: { status: { $in: ['paid', 'partially_refunded'] } } },
    {
      $group: {
        _id: '$stationId',
        grossRevenue: { $sum: '$totalAmount' },
        totalRefunds: { $sum: '$refundAmount' },
        totalEnergy: { $sum: '$energyConsumedKwh' },
        count: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'chargingstations',
        localField: '_id',
        foreignField: '_id',
        as: 'station',
      },
    },
    { $unwind: '$station' },
    {
      $project: {
        stationName: '$station.name',
        city: '$station.city',
        grossRevenue: 1,
        netRevenue: { $subtract: ['$grossRevenue', '$totalRefunds'] },
        totalEnergy: 1,
        count: 1,
      },
    },
    { $sort: { netRevenue: -1 } },
  ]);

  // Payment status distribution
  const statusDistributionAgg = await Payment.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
      },
    },
  ]);

  // Payment method distribution
  const methodDistributionAgg = await Payment.aggregate([
    { $match: { status: { $in: ['paid', 'partially_refunded'] } } },
    {
      $group: {
        _id: '$paymentMethod',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
      },
    },
  ]);

  // Daily revenue over the last 14 days
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const dailyRevenueAgg = await Payment.aggregate([
    {
      $match: {
        status: { $in: ['paid', 'partially_refunded'] },
        createdAt: { $gte: fourteenDaysAgo },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: { $subtract: ['$totalAmount', '$refundAmount'] } },
        energy: { $sum: '$energyConsumedKwh' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return {
    summary: {
      todayRevenue: Math.round(todayRevenue * 100) / 100,
      thisMonthRevenue: Math.round(thisMonthRevenue * 100) / 100,
      totalPaidRevenue: Math.round(totalPaidRevenue * 100) / 100,
      grossRevenue: Math.round(grossRevenue * 100) / 100,
      totalRefundedAmount: Math.round(totalRefundedAmount * 100) / 100,
      pendingAmount: Math.round(pendingAmount * 100) / 100,
      totalEnergyConsumedKwh: Math.round(totalEnergyConsumedKwh * 100) / 100,
      successfulPaymentsCount,
      averageTransactionValue: Math.round(averageTransactionValue * 100) / 100,
    },
    revenueByStation: revenueByStationAgg,
    statusDistribution: statusDistributionAgg,
    methodDistribution: methodDistributionAgg,
    dailyRevenue: dailyRevenueAgg,
  };
};

module.exports = {
  validatePaymentTransition,
  createPayment,
  getPaymentById,
  getPaymentByReference,
  verifyPayment,
  getMyPayments,
  getPaymentReceipt,
  cancelPayment,
  requestRefund,
  getAdminPayments,
  getAdminRevenue,
};
