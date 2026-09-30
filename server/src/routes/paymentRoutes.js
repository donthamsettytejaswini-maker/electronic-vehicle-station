const express = require('express');
const {
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
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

const router = express.Router();

// Stripe Webhook (must use raw body in app.js or raw handler)
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), handleStripeWebhookHandler);

// Specific & Admin Endpoints (Must be declared before /:id)
router.get('/invoice/:sessionId', protect, getInvoiceForSessionHandler);
router.post('/create', protect, createPaymentHandler);
router.get('/my-payments', protect, getMyPaymentsHandler);
router.get('/reference/:paymentReference', protect, getPaymentByReferenceHandler);

router.post('/stripe/create-checkout', protect, createStripeCheckoutHandler);
router.post('/stripe/create-intent', protect, createStripeIntentHandler);

// Admin Specific Endpoints
router.get('/admin/all', protect, adminOnly, getAdminPaymentsHandler);
router.get('/admin/revenue', protect, adminOnly, getAdminRevenueHandler);
router.get('/admin', protect, adminOnly, getAdminPaymentsHandler);
router.get('/revenue', protect, adminOnly, getAdminRevenueHandler);
router.get('/all', protect, adminOnly, getAdminPaymentsHandler);

// Root path handler (supports /api/payments, /api/admin/payments, /api/admin/revenue)
router.get('/', protect, (req, res, next) => {
  if (req.user.role === 'admin') {
    return getAdminPaymentsHandler(req, res, next);
  }
  return getMyPaymentsHandler(req, res, next);
});

// Dynamic Item / Parameterized Endpoints
router.get('/:id/receipt', protect, getPaymentReceiptHandler);
router.post('/:id/verify', protect, verifyPaymentHandler);
router.post('/:id/cancel', protect, cancelPaymentHandler);
router.post('/:id/refund', protect, adminOnly, requestRefundHandler);
router.get('/:id', protect, getPaymentByIdHandler);

module.exports = router;
