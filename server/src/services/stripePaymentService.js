const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const ChargingSession = require('../models/ChargingSession');

let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  try {
    const Stripe = require('stripe');
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  } catch (err) {
    console.warn('Stripe package not initialized:', err.message);
  }
}

// In-memory set of processed webhook event IDs to guarantee idempotency
const processedEvents = new Set();

const isStripeConfigured = () => {
  return Boolean(process.env.STRIPE_SECRET_KEY && stripe);
};

const createStripeCheckoutSession = async (paymentId, clientUrl = null) => {
  if (!isStripeConfigured()) {
    const error = new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY in server environment.');
    error.statusCode = 503;
    throw error;
  }

  const payment = await Payment.findById(paymentId)
    .populate('sessionId')
    .populate('stationId')
    .populate('userId');

  if (!payment) {
    const error = new Error('Payment record not found');
    error.statusCode = 404;
    throw error;
  }

  const baseUrl = clientUrl || process.env.CLIENT_URL || 'http://localhost:5173';
  const currency = (process.env.STRIPE_CURRENCY || payment.currency || 'inr').toLowerCase();
  const unitAmount = Math.round(payment.totalAmount * 100); // smallest unit (paise / cents)

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: `EVCharge Charging Session: ${payment.sessionId?.sessionReference || payment.paymentReference}`,
            description: `Station: ${payment.stationId?.name} | Energy: ${payment.energyConsumedKwh} kWh`,
          },
          unit_amount: unitAmount,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    client_reference_id: payment._id.toString(),
    customer_email: payment.userId?.email,
    success_url: `${baseUrl}/payments/result/${payment._id}?status=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/payments/checkout/${payment.sessionId?._id || payment.sessionId}?cancelled=true`,
    metadata: {
      paymentId: payment._id.toString(),
      paymentReference: payment.paymentReference,
      sessionId: payment.sessionId?._id?.toString() || payment.sessionId.toString(),
      bookingId: payment.bookingId.toString(),
    },
  });

  payment.providerPaymentId = session.id;
  payment.status = 'processing';
  await payment.save();

  return {
    sessionId: session.id,
    url: session.url,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  };
};

const createStripePaymentIntent = async (paymentId) => {
  if (!isStripeConfigured()) {
    const error = new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY in server environment.');
    error.statusCode = 503;
    throw error;
  }

  const payment = await Payment.findById(paymentId);
  if (!payment) {
    const error = new Error('Payment record not found');
    error.statusCode = 404;
    throw error;
  }

  const currency = (process.env.STRIPE_CURRENCY || payment.currency || 'inr').toLowerCase();
  const amount = Math.round(payment.totalAmount * 100);

  const intent = await stripe.paymentIntents.create({
    amount,
    currency,
    metadata: {
      paymentId: payment._id.toString(),
      paymentReference: payment.paymentReference,
    },
  });

  payment.providerPaymentId = intent.id;
  payment.status = 'processing';
  await payment.save();

  return {
    clientSecret: intent.client_secret,
    paymentIntentId: intent.id,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  };
};

const handleStripeWebhook = async (rawBody, signatureHeader) => {
  if (!isStripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
    const error = new Error('Stripe webhook is not configured.');
    error.statusCode = 503;
    throw error;
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signatureHeader,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    const error = new Error(`Stripe Webhook Signature Verification Failed: ${err.message}`);
    error.statusCode = 400;
    throw error;
  }

  // Idempotency: skip if already processed
  if (processedEvents.has(event.id)) {
    return { received: true, duplicate: true, eventType: event.type };
  }
  processedEvents.add(event.id);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const paymentId = session.metadata?.paymentId || session.client_reference_id;

    if (paymentId) {
      const payment = await Payment.findById(paymentId);
      if (payment && payment.status !== 'paid') {
        payment.status = 'paid';
        payment.paidAt = new Date();
        payment.providerPaymentId = session.payment_intent || session.id;
        await payment.save();

        await Booking.findByIdAndUpdate(payment.bookingId, { paymentStatus: 'paid' });
        await ChargingSession.findByIdAndUpdate(payment.sessionId, {
          paymentStatus: 'paid',
          finalBillAmount: payment.totalAmount,
          billedAt: new Date(),
        });
      }
    }
  } else if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object;
    const paymentId = intent.metadata?.paymentId;

    if (paymentId) {
      const payment = await Payment.findById(paymentId);
      if (payment) {
        payment.status = 'failed';
        payment.failureReason = intent.last_payment_error?.message || 'Stripe payment failed';
        await payment.save();

        await Booking.findByIdAndUpdate(payment.bookingId, { paymentStatus: 'failed' });
        await ChargingSession.findByIdAndUpdate(payment.sessionId, { paymentStatus: 'failed' });
      }
    }
  }

  return { received: true, eventType: event.type };
};

const refundStripePayment = async (paymentId, refundAmount, reason = 'requested_by_customer') => {
  if (!isStripeConfigured()) {
    const error = new Error('Stripe is not configured.');
    error.statusCode = 503;
    throw error;
  }

  const payment = await Payment.findById(paymentId);
  if (!payment) {
    const error = new Error('Payment record not found');
    error.statusCode = 404;
    throw error;
  }

  if (!payment.providerPaymentId) {
    const error = new Error('Missing Stripe provider transaction ID for refund');
    error.statusCode = 400;
    throw error;
  }

  const amountPaise = Math.round(Number(refundAmount) * 100);
  const refund = await stripe.refunds.create({
    payment_intent: payment.providerPaymentId,
    amount: amountPaise,
    reason: 'requested_by_customer',
  });

  return refund;
};

module.exports = {
  isStripeConfigured,
  createStripeCheckoutSession,
  createStripePaymentIntent,
  handleStripeWebhook,
  refundStripePayment,
};
