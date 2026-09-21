const ChargingSession = require('../models/ChargingSession');
const ChargingStation = require('../models/ChargingStation');
const Charger = require('../models/Charger');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const generatePaymentReference = require('../utils/generatePaymentReference');
const generateInvoiceNumber = require('../utils/generateInvoiceNumber');

const roundMoney = (value) => {
  const num = Number(value) || 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

const getCurrentPricing = () => {
  return {
    currency: process.env.BILLING_CURRENCY || 'INR',
    currencySymbol: process.env.BILLING_CURRENCY_SYMBOL || '₹',
    taxRate: Number(process.env.BILLING_TAX_RATE) || 0,
    serviceFee: Number(process.env.BILLING_SERVICE_FEE) || 0,
  };
};

const validateBillableSession = async (sessionId, requestingUserId = null, isAdmin = false) => {
  const session = await ChargingSession.findById(sessionId)
    .populate('bookingId')
    .populate('stationId')
    .populate('chargerId')
    .populate('vehicleId')
    .populate('userId', 'name email phone');

  if (!session) {
    const error = new Error('Charging session not found');
    error.statusCode = 404;
    throw error;
  }

  // Authorization check
  if (requestingUserId && !isAdmin && session.userId._id.toString() !== requestingUserId.toString()) {
    const error = new Error('Unauthorized to access billing for this charging session');
    error.statusCode = 403;
    throw error;
  }

  // Must be completed session
  if (session.status !== 'completed' && session.status !== 'stopped') {
    const error = new Error(`Cannot generate bill for an active or uncompleted session (Current status: ${session.status})`);
    error.statusCode = 400;
    throw error;
  }

  // Energy consumed must be > 0
  const energyConsumedKwh = Number(session.energyConsumedKwh) || 0;
  if (energyConsumedKwh <= 0) {
    const error = new Error('Energy consumption is required before billing.');
    error.statusCode = 400;
    throw error;
  }

  return session;
};

const calculateInvoiceForSession = async (sessionId, requestingUserId = null, isAdmin = false) => {
  const session = await validateBillableSession(sessionId, requestingUserId, isAdmin);

  // Rate per kWh from station or charger
  const stationRate = session.stationId?.pricePerKwh || 15;
  const chargerRate = session.chargerId?.pricePerKwh || stationRate;
  const ratePerKwh = roundMoney(chargerRate);

  const energyConsumedKwh = roundMoney(session.energyConsumedKwh);
  const energyCharge = roundMoney(energyConsumedKwh * ratePerKwh);

  const pricing = getCurrentPricing();
  const serviceFee = roundMoney(pricing.serviceFee);
  const taxRate = pricing.taxRate;
  const taxableAmount = roundMoney(energyCharge + serviceFee);
  const taxAmount = roundMoney((taxableAmount * taxRate) / 100);
  const discountAmount = 0;
  const subtotal = energyCharge;
  const totalAmount = Math.max(1, roundMoney(taxableAmount + taxAmount - discountAmount));

  // Check if an existing payment / invoice exists
  const existingPayment = await Payment.findOne({ sessionId: session._id });

  return {
    session: {
      _id: session._id,
      sessionReference: session.sessionReference,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      actualDurationMinutes: session.actualDurationMinutes || session.estimatedDurationMinutes || 0,
      initialBatteryPercentage: session.initialBatteryPercentage,
      currentBatteryPercentage: session.currentBatteryPercentage,
      targetBatteryPercentage: session.targetBatteryPercentage,
      chargingPowerKw: session.chargingPowerKw,
      status: session.status,
      paymentStatus: session.paymentStatus,
    },
    booking: {
      _id: session.bookingId?._id,
      bookingReference: session.bookingId?.bookingReference,
      startTime: session.bookingId?.startTime,
      endTime: session.bookingId?.endTime,
      paymentStatus: session.bookingId?.paymentStatus,
    },
    station: {
      _id: session.stationId?._id,
      name: session.stationId?.name,
      address: session.stationId?.address,
      city: session.stationId?.city,
    },
    charger: {
      _id: session.chargerId?._id,
      name: session.chargerId?.name || session.chargerId?.chargerNumber || 'Port 1',
      chargerType: session.chargerId?.connectorType || session.chargerId?.chargerType,
      powerRating: session.chargerId?.powerRating,
    },
    vehicle: {
      _id: session.vehicleId?._id,
      brand: session.vehicleId?.brand,
      model: session.vehicleId?.model,
      licensePlate: session.vehicleId?.vehicleNumber || session.vehicleId?.licensePlate,
    },
    user: {
      _id: session.userId?._id,
      name: session.userId?.name,
      email: session.userId?.email,
    },
    billing: {
      energyConsumedKwh,
      ratePerKwh,
      energyCharge,
      serviceFee,
      taxRate,
      taxAmount,
      discountAmount,
      subtotal,
      totalAmount,
      currency: pricing.currency,
      currencySymbol: pricing.currencySymbol,
    },
    existingPayment: existingPayment ? {
      _id: existingPayment._id,
      paymentReference: existingPayment.paymentReference,
      invoiceNumber: existingPayment.invoiceNumber,
      status: existingPayment.status,
      amount: existingPayment.totalAmount,
      paymentMethod: existingPayment.paymentMethod,
      provider: existingPayment.provider,
      paidAt: existingPayment.paidAt,
    } : null,
  };
};

const createOrGetInvoiceForSession = async (
  sessionId,
  paymentMethod = 'mock_upi',
  provider = null,
  requestingUserId = null,
  isAdmin = false
) => {
  const invoiceData = await calculateInvoiceForSession(sessionId, requestingUserId, isAdmin);
  const session = await ChargingSession.findById(sessionId);

  // If active or paid payment already exists, return it
  let existingPayment = await Payment.findOne({ sessionId });
  if (existingPayment) {
    if (existingPayment.status === 'paid' || existingPayment.status === 'pending' || existingPayment.status === 'processing') {
      return existingPayment;
    }
  }

  // Selected provider: environment or parameter
  const configuredProvider = provider || process.env.PAYMENT_PROVIDER || 'mock';

  // Create new Payment document
  const paymentReference = generatePaymentReference();
  const invoiceNumber = generateInvoiceNumber();

  const payment = new Payment({
    paymentReference,
    invoiceNumber,
    userId: session.userId,
    bookingId: session.bookingId,
    sessionId: session._id,
    stationId: session.stationId,
    chargerId: session.chargerId,
    vehicleId: session.vehicleId,
    provider: configuredProvider === 'stripe' ? 'stripe' : 'mock',
    paymentMethod: paymentMethod || 'mock_upi',
    amount: invoiceData.billing.totalAmount,
    currency: invoiceData.billing.currency,
    energyConsumedKwh: invoiceData.billing.energyConsumedKwh,
    ratePerKwh: invoiceData.billing.ratePerKwh,
    energyCharge: invoiceData.billing.energyCharge,
    serviceFee: invoiceData.billing.serviceFee,
    taxRate: invoiceData.billing.taxRate,
    taxAmount: invoiceData.billing.taxAmount,
    discountAmount: invoiceData.billing.discountAmount,
    subtotal: invoiceData.billing.subtotal,
    totalAmount: invoiceData.billing.totalAmount,
    status: 'pending',
  });

  await payment.save();

  // Update session and booking payment references
  session.paymentId = payment._id;
  session.finalBillAmount = payment.totalAmount;
  session.billedAt = new Date();
  await session.save();

  await Booking.findByIdAndUpdate(session.bookingId, {
    paymentId: payment._id,
    paymentStatus: 'pending',
    totalPrice: payment.totalAmount,
  });

  return payment;
};

module.exports = {
  roundMoney,
  getCurrentPricing,
  validateBillableSession,
  calculateInvoiceForSession,
  createOrGetInvoiceForSession,
};
