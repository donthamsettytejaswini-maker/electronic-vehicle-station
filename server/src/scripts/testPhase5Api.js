require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const ChargingStation = require('../models/ChargingStation');
const Charger = require('../models/Charger');
const Booking = require('../models/Booking');
const ChargingSession = require('../models/ChargingSession');
const Payment = require('../models/Payment');
const {
  calculateInvoiceForSession,
  createOrGetInvoiceForSession,
  validateBillableSession,
} = require('../services/billingService');
const { processMockPayment, refundMockPayment } = require('../services/mockPaymentService');
const {
  createPayment,
  getPaymentById,
  verifyPayment,
  getMyPayments,
  getPaymentReceipt,
  cancelPayment,
  requestRefund,
  getAdminPayments,
  getAdminRevenue,
  validatePaymentTransition,
} = require('../services/paymentService');
const { handleStripeWebhook } = require('../services/stripePaymentService');

const runPhase5Tests = async () => {
  console.log('--- STARTING PHASE 5 BILLING & PAYMENT INTEGRATION TESTS ---');

  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/evcharge');
  console.log('✓ MongoDB Connected');

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      failed++;
    }
  };

  try {
    // 1. Setup Test Users & Station
    await User.deleteMany({ email: /test-phase5-/ });
    await ChargingStation.deleteMany({ name: /Test Phase 5 Station/ });

    const driver = await User.create({
      name: 'P5 Driver',
      email: `test-phase5-driver-${Date.now()}@evcharge.com`,
      password: 'Password@123',
      role: 'user',
    });

    const otherDriver = await User.create({
      name: 'Other P5 Driver',
      email: `test-phase5-other-${Date.now()}@evcharge.com`,
      password: 'Password@123',
      role: 'user',
    });

    const admin = await User.create({
      name: 'P5 Admin',
      email: `test-phase5-admin-${Date.now()}@evcharge.com`,
      password: 'Password@123',
      role: 'admin',
    });

    const station = await ChargingStation.create({
      name: 'Test Phase 5 Station',
      address: '456 Financial Blvd',
      city: 'Bangalore',
      state: 'Karnataka',
      postalCode: '560001',
      latitude: 12.9716,
      longitude: 77.5946,
      totalChargers: 1,
      availableChargers: 1,
      chargingChargers: 0,
      maintenanceChargers: 0,
      pricePerKwh: 16.5,
      status: 'active',
      operatingHours: '24/7',
      createdBy: admin._id,
    });

    const charger = await Charger.create({
      stationId: station._id,
      chargerNumber: `P5-CH-${Date.now()}`,
      connectorType: 'CCS2',
      chargingSpeed: 'Fast',
      powerRating: 30,
      status: 'available',
      pricePerKwh: 16.5,
    });

    const vehicle = await Vehicle.create({
      userId: driver._id,
      vehicleNumber: `KA01P5${Math.floor(1000 + Math.random() * 9000)}`,
      brand: 'Tata',
      model: 'Nexon EV',
      batteryCapacity: 40.5,
      connectorType: 'CCS2',
      isDefault: true,
    });

    // Test 1: Completed session can calculate bill
    const completedBooking = await Booking.create({
      bookingReference: `EV-P5-${Date.now()}`,
      userId: driver._id,
      vehicleId: vehicle._id,
      stationId: station._id,
      chargerId: charger._id,
      startTime: new Date(Date.now() - 3600000),
      endTime: new Date(),
      status: 'completed',
      paymentStatus: 'pending',
    });

    const completedSession = await ChargingSession.create({
      sessionReference: `SESSION-P5-${Date.now()}`,
      bookingId: completedBooking._id,
      userId: driver._id,
      vehicleId: vehicle._id,
      stationId: station._id,
      chargerId: charger._id,
      status: 'completed',
      startedAt: new Date(Date.now() - 3600000),
      completedAt: new Date(),
      initialBatteryPercentage: 30,
      currentBatteryPercentage: 80,
      targetBatteryPercentage: 80,
      chargingPowerKw: 30,
      energyConsumedKwh: 20.0,
      actualDurationMinutes: 45,
      paymentStatus: 'pending',
    });

    const invoice = await calculateInvoiceForSession(completedSession._id, driver._id);
    assert(invoice.billing.energyConsumedKwh === 20, 'Invoice uses server-side energyConsumedKwh');
    assert(invoice.billing.ratePerKwh === 16.5, 'Invoice uses server-side station rate per kWh');
    assert(invoice.billing.energyCharge === 330, 'Energy charge = 20 kWh * ₹16.5 = ₹330');
    assert(invoice.billing.totalAmount === 330, 'Total amount matches calculated taxable amount');

    // Test 2: Active session cannot be billed
    const activeBooking = await Booking.create({
      bookingReference: `EV-ACT-${Date.now()}`,
      userId: driver._id,
      vehicleId: vehicle._id,
      stationId: station._id,
      chargerId: charger._id,
      startTime: new Date(),
      endTime: new Date(Date.now() + 3600000),
      status: 'charging',
      paymentStatus: 'pending',
    });

    const activeSession = await ChargingSession.create({
      sessionReference: `SESSION-ACTIVE-${Date.now()}`,
      bookingId: activeBooking._id,
      userId: driver._id,
      vehicleId: vehicle._id,
      stationId: station._id,
      chargerId: charger._id,
      status: 'charging',
      initialBatteryPercentage: 30,
      currentBatteryPercentage: 50,
      targetBatteryPercentage: 80,
      chargingPowerKw: 30,
      energyConsumedKwh: 10,
    });

    let activeSessionError = null;
    try {
      await calculateInvoiceForSession(activeSession._id, driver._id);
    } catch (e) {
      activeSessionError = e;
    }
    assert(activeSessionError !== null, 'Active charging session is rejected from bill generation');

    // Test 3: Session without energy consumption cannot be billed
    const zeroEnergyBooking = await Booking.create({
      bookingReference: `EV-ZERO-${Date.now()}`,
      userId: driver._id,
      vehicleId: vehicle._id,
      stationId: station._id,
      chargerId: charger._id,
      startTime: new Date(Date.now() - 3600000),
      endTime: new Date(),
      status: 'completed',
      paymentStatus: 'pending',
    });

    const zeroEnergySession = await ChargingSession.create({
      sessionReference: `SESSION-ZERO-${Date.now()}`,
      bookingId: zeroEnergyBooking._id,
      userId: driver._id,
      vehicleId: vehicle._id,
      stationId: station._id,
      chargerId: charger._id,
      status: 'completed',
      initialBatteryPercentage: 30,
      currentBatteryPercentage: 30,
      targetBatteryPercentage: 80,
      chargingPowerKw: 30,
      energyConsumedKwh: 0,
    });

    let zeroEnergyError = null;
    try {
      await calculateInvoiceForSession(zeroEnergySession._id, driver._id);
    } catch (e) {
      zeroEnergyError = e;
    }
    assert(zeroEnergyError !== null, 'Zero energy consumption session is rejected with error');

    // Test 4: Create payment record & prevent duplicate active payments
    const payment = await createOrGetInvoiceForSession(completedSession._id, 'mock_upi', 'mock', driver._id);
    assert(payment.totalAmount === 330, 'Payment record created with server-calculated ₹330 amount');
    assert(payment.status === 'pending', 'Payment initiates with pending status');

    const duplicatePayment = await createOrGetInvoiceForSession(completedSession._id, 'mock_upi', 'mock', driver._id);
    assert(duplicatePayment._id.toString() === payment._id.toString(), 'Idempotency: duplicate invoice creation returns existing payment');

    // Test 5: User cannot pay or access another user's payment
    let unauthorizedError = null;
    try {
      await getPaymentById(payment._id, otherDriver._id, false);
    } catch (e) {
      unauthorizedError = e;
    }
    assert(unauthorizedError !== null, 'Unauthorized driver is forbidden from viewing another driver’s payment');

    // Test 6: Mock Payment Failure
    const failResult = await processMockPayment(payment._id, 'failure', 'Card declined in demo test');
    assert(failResult.success === false, 'Mock payment failure is recorded');
    assert(failResult.payment.status === 'failed', 'Payment status transitions to failed');

    // Test 7: Retry and Mock Payment Success
    const successResult = await processMockPayment(payment._id, 'success', null, 'mock_card');
    assert(successResult.success === true, 'Mock payment success completes successfully');
    assert(successResult.payment.status === 'paid', 'Payment status transitions to paid');
    assert(successResult.payment.paidAt !== null, 'Payment record stores paidAt timestamp');

    // Test 8: Booking and Session paymentStatus updated to paid
    const updatedBooking = await Booking.findById(completedBooking._id);
    const updatedSession = await ChargingSession.findById(completedSession._id);
    assert(updatedBooking.paymentStatus === 'paid', 'Booking paymentStatus updated to paid');
    assert(updatedSession.paymentStatus === 'paid', 'ChargingSession paymentStatus updated to paid');
    assert(updatedSession.finalBillAmount === 330, 'ChargingSession records finalBillAmount');

    // Test 9: Payment verification is idempotent
    const alreadyPaidResult = await processMockPayment(payment._id, 'success');
    assert(alreadyPaidResult.alreadyPaid === true, 'Subsequent verification of paid payment returns idempotent success');

    // Test 10: Receipt generation
    const receiptData = await getPaymentReceipt(payment._id, driver._id);
    assert(receiptData.receipt.invoiceNumber === payment.invoiceNumber, 'Receipt contains matching invoiceNumber');
    assert(receiptData.receipt.lineItems.totalAmount === 330, 'Receipt contains accurate itemized total amount');

    // Test 11: Payment History scoping
    const driverHistory = await getMyPayments(driver._id);
    const otherDriverHistory = await getMyPayments(otherDriver._id);
    assert(driverHistory.payments.length >= 1, 'Payment history returns driver records');
    assert(otherDriverHistory.payments.length === 0, 'Payment history is strictly scoped to authenticated user');

    // Test 12: Admin Refund capabilities
    const partialRefundResult = await refundMockPayment(payment._id, 100, 'Partial refund test', admin);
    assert(partialRefundResult.payment.status === 'partially_refunded', 'Partial refund updates status to partially_refunded');
    assert(partialRefundResult.payment.refundAmount === 100, 'Refunded amount tracked accurately');

    const fullRefundResult = await refundMockPayment(payment._id, 230, 'Remaining refund test', admin);
    assert(fullRefundResult.payment.status === 'refunded', 'Full refund updates status to refunded');
    assert(fullRefundResult.payment.refundAmount === 330, 'Full ₹330 refunded amount tracked');

    // Test 13: Refund exceeding paid amount is rejected
    let overRefundError = null;
    try {
      await refundMockPayment(payment._id, 50, 'Excess refund', admin);
    } catch (e) {
      overRefundError = e;
    }
    assert(overRefundError !== null, 'Refund exceeding total amount is rejected');

    // Test 14: Payment State Machine Transitions
    assert(validatePaymentTransition('created', 'pending'), 'created -> pending is valid');
    assert(validatePaymentTransition('pending', 'paid'), 'pending -> paid is valid');
    assert(validatePaymentTransition('paid', 'refunded'), 'paid -> refunded is valid');

    let invalidTransitionError = null;
    try {
      validatePaymentTransition('refunded', 'paid');
    } catch (e) {
      invalidTransitionError = e;
    }
    assert(invalidTransitionError !== null, 'Invalid transition (refunded -> paid) is rejected with 409');

    // Test 15: Admin Revenue Aggregation
    const revenueAnalytics = await getAdminRevenue();
    assert(revenueAnalytics.summary !== undefined, 'Admin revenue summary returns metrics');
    assert(revenueAnalytics.revenueByStation !== undefined, 'Admin revenue aggregates yield by station');

    // Cleanup
    await Payment.deleteMany({ userId: { $in: [driver._id, otherDriver._id, admin._id] } });
    await ChargingSession.deleteMany({ userId: { $in: [driver._id, otherDriver._id, admin._id] } });
    await Booking.deleteMany({ userId: { $in: [driver._id, otherDriver._id, admin._id] } });
    await Vehicle.deleteMany({ userId: { $in: [driver._id, otherDriver._id, admin._id] } });
    await Charger.deleteMany({ stationId: station._id });
    await ChargingStation.deleteMany({ _id: station._id });
    await User.deleteMany({ _id: { $in: [driver._id, otherDriver._id, admin._id] } });

    console.log('✓ Phase 5 test data cleaned up successfully');
  } catch (err) {
    console.error('Phase 5 Test Execution Error:', err);
    failed++;
  } finally {
    await mongoose.disconnect();
    console.log(`\n==================================================`);
    console.log(`PHASE 5 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log(`==================================================`);
    process.exit(failed > 0 ? 1 : 0);
  }
};

runPhase5Tests();
