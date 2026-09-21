const {
  calculateInvoiceForSession,
  createOrGetInvoiceForSession,
} = require('../services/billingService');
const {
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
} = require('../services/paymentService');
const {
  createStripeCheckoutSession,
  createStripePaymentIntent,
  handleStripeWebhook,
} = require('../services/stripePaymentService');

// GET /api/payments/invoice/:sessionId
const getInvoiceForSessionHandler = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const invoice = await calculateInvoiceForSession(
      sessionId,
      req.user?._id,
      req.user?.role === 'admin'
    );
    return res.status(200).json({
      success: true,
      message: 'Invoice calculated successfully',
      data: invoice,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/payments/create
const createPaymentHandler = async (req, res, next) => {
  try {
    const { sessionId, paymentMethod, provider } = req.body;
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'sessionId is required to generate payment',
      });
    }

    const result = await createPayment(
      sessionId,
      paymentMethod,
      provider,
      req.user,
      req.user?.role === 'admin'
    );

    return res.status(201).json({
      success: true,
      message: 'Payment invoice created successfully',
      data: result.payment,
      stripe: result.stripe || null,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/payments/my-payments
const getMyPaymentsHandler = async (req, res, next) => {
  try {
    const result = await getMyPayments(req.user._id, req.query);
    return res.status(200).json({
      success: true,
      message: 'User payment records retrieved successfully',
      data: result.payments,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/payments/:id
const getPaymentByIdHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payment = await getPaymentById(id, req.user?._id, req.user?.role === 'admin');
    return res.status(200).json({
      success: true,
      message: 'Payment retrieved successfully',
      data: payment,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/payments/reference/:paymentReference
const getPaymentByReferenceHandler = async (req, res, next) => {
  try {
    const { paymentReference } = req.params;
    const payment = await getPaymentByReference(
      paymentReference,
      req.user?._id,
      req.user?.role === 'admin'
    );
    return res.status(200).json({
      success: true,
      message: 'Payment retrieved successfully',
      data: payment,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/payments/:id/verify
const verifyPaymentHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action = 'success', failureReason, paymentMethod } = req.body;

    const result = await verifyPayment(
      id,
      action,
      failureReason,
      paymentMethod,
      req.user,
      req.user?.role === 'admin'
    );

    return res.status(200).json({
      success: result.success !== false,
      message: result.message || 'Payment verified successfully',
      data: {
        payment: result.payment,
        receiptAvailable: result.payment?.status === 'paid',
        alreadyPaid: result.alreadyPaid || false,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/payments/:id/receipt
const getPaymentReceiptHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const receiptData = await getPaymentReceipt(id, req.user?._id, req.user?.role === 'admin');
    return res.status(200).json({
      success: true,
      message: 'Receipt generated successfully',
      data: receiptData.receipt,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/payments/:id/cancel
const cancelPaymentHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payment = await cancelPayment(id, req.user?._id, req.user?.role === 'admin');
    return res.status(200).json({
      success: true,
      message: 'Payment cancelled successfully',
      data: payment,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/payments/:id/refund (Admin only)
const requestRefundHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;

    const result = await requestRefund(id, amount, reason, req.user);
    return res.status(200).json({
      success: true,
      message: result.message || 'Refund processed successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/payments or /api/payments/admin/all
const getAdminPaymentsHandler = async (req, res, next) => {
  try {
    const result = await getAdminPayments(req.query);
    return res.status(200).json({
      success: true,
      message: 'Admin payments retrieved successfully',
      data: result.payments,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/revenue or /api/payments/admin/revenue
const getAdminRevenueHandler = async (req, res, next) => {
  try {
    const revenue = await getAdminRevenue(req.query);
    return res.status(200).json({
      success: true,
      message: 'Admin revenue analytics retrieved successfully',
      data: revenue,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/payments/stripe/create-checkout
const createStripeCheckoutHandler = async (req, res, next) => {
  try {
    const { paymentId, clientUrl } = req.body;
    const session = await createStripeCheckoutSession(paymentId, clientUrl);
    return res.status(200).json({
      success: true,
      message: 'Stripe checkout session initialized',
      data: session,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/payments/stripe/create-intent
const createStripeIntentHandler = async (req, res, next) => {
  try {
    const { paymentId } = req.body;
    const intent = await createStripePaymentIntent(paymentId);
    return res.status(200).json({
      success: true,
      message: 'Stripe payment intent initialized',
      data: intent,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/payments/stripe/webhook
const handleStripeWebhookHandler = async (req, res, next) => {
  try {
    const sig = req.headers['stripe-signature'];
    const result = await handleStripeWebhook(req.body, sig);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.statusCode || 400).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  getInvoiceForSessionHandler,
  createPaymentHandler,
  getMyPaymentsHandler,
  getPaymentByIdHandler,
  getPaymentByReferenceHandler,
  verifyPaymentHandler,
  getPaymentReceiptHandler,
  cancelPaymentHandler,
  requestRefundHandler,
  getAdminPaymentsHandler,
  getAdminRevenueHandler,
  createStripeCheckoutHandler,
  createStripeIntentHandler,
  handleStripeWebhookHandler,
};
