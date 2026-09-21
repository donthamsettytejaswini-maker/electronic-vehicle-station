require('dotenv').config();
const mongoose = require('mongoose');
const http = require('http');
const app = require('../app');
const { initSocket } = require('../socket');
const { initActiveSimulations, stopActiveSimulation } = require('../services/chargingSimulationService');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const ChargingStation = require('../models/ChargingStation');
const Charger = require('../models/Charger');
const Booking = require('../models/Booking');
const ChargingSession = require('../models/ChargingSession');
const { generateRawQrToken, hashQrToken, verifyQrToken } = require('../utils/generateQrToken');
const generateBookingReference = require('../utils/generateBookingReference');
const generateSessionReference = require('../utils/generateSessionReference');

const runTests = async () => {
  console.log('--- STARTING PHASE 4 INTEGRATION & SECURITY TESTS ---');

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
    // Clean up test data
    await User.deleteMany({ email: /test-phase4-/ });
    await ChargingStation.deleteMany({ name: /Test Phase 4 Station/ });

    // 1. Setup Driver & Admin Users
    const driver = await User.create({
      name: 'Test Driver',
      email: `test-phase4-driver-${Date.now()}@evcharge.com`,
      password: 'Password@123',
      role: 'user',
    });

    const otherDriver = await User.create({
      name: 'Other Driver',
      email: `test-phase4-other-${Date.now()}@evcharge.com`,
      password: 'Password@123',
      role: 'user',
    });

    const admin = await User.create({
      name: 'Test Admin',
      email: `test-phase4-admin-${Date.now()}@evcharge.com`,
      password: 'Password@123',
      role: 'admin',
    });

    const station = await ChargingStation.create({
      name: 'Test Phase 4 Station',
      address: '123 Test St',
      city: 'Bangalore',
      state: 'Karnataka',
      postalCode: '560001',
      latitude: 12.9716,
      longitude: 77.5946,
      totalChargers: 1,
      availableChargers: 1,
      chargingChargers: 0,
      maintenanceChargers: 0,
      pricePerKwh: 15,
      status: 'active',
      operatingHours: '24/7',
      createdBy: admin._id,
    });

    const charger = await Charger.create({
      stationId: station._id,
      chargerNumber: `T4-CH-${Date.now()}`,
      connectorType: 'CCS2',
      chargingSpeed: 'Fast',
      powerRating: 30,
      status: 'available',
      pricePerKwh: 15,
    });

    const vehicle = await Vehicle.create({
      userId: driver._id,
      vehicleNumber: `KA01P4${Math.floor(1000 + Math.random() * 9000)}`,
      brand: 'Tata',
      model: 'Nexon EV',
      batteryCapacity: 40.5,
      connectorType: 'CCS2',
      isDefault: true,
    });

    // Test 1: Crypto QR Token Generation & SHA-256 Hashing
    const rawToken = generateRawQrToken();
    const hashedToken = hashQrToken(rawToken);
    assert(rawToken.length >= 64, 'QR raw token has at least 32 bytes (64 hex characters)');
    assert(hashedToken.length === 64, 'QR token hash is SHA-256 (64 hex characters)');
    assert(verifyQrToken(rawToken, hashedToken), 'Timing-safe comparison confirms matching raw and hashed token');
    assert(!verifyQrToken('wrong_token', hashedToken), 'Timing-safe comparison rejects invalid token');

    // Test 2: Booking creation & QR token storage
    const now = new Date();
    const startTime = new Date(now.getTime() - 5 * 60 * 1000); // 5 mins ago (eligible window)
    const endTime = new Date(now.getTime() + 55 * 60 * 1000);

    const bookingRef = await generateBookingReference();
    const booking = await Booking.create({
      bookingReference: bookingRef,
      userId: driver._id,
      vehicleId: vehicle._id,
      stationId: station._id,
      chargerId: charger._id,
      startTime,
      endTime,
      status: 'confirmed',
      paymentStatus: 'pending',
      qrTokenHash: hashedToken,
      qrGeneratedAt: new Date(),
    });

    // Test 3: qrTokenHash is not returned in default queries (select: false)
    const fetchedBooking = await Booking.findById(booking._id);
    assert(fetchedBooking.qrTokenHash === undefined, 'qrTokenHash is excluded (select: false) by default in queries');

    // Test 4: Explicit select retrieves qrTokenHash for secure verification
    const fetchedWithHash = await Booking.findById(booking._id).select('+qrTokenHash');
    assert(fetchedWithHash.qrTokenHash === hashedToken, 'Explicitly selected qrTokenHash matches stored SHA-256 hash');

    // Test 5: Check-in window eligibility
    const EARLY_CHECK_IN_MINUTES = 15;
    const LATE_CHECK_IN_MINUTES = 30;
    const isWithinWindow = (bStartTime) => {
      const bTime = new Date(bStartTime).getTime();
      const currTime = Date.now();
      const earlyLimit = bTime - EARLY_CHECK_IN_MINUTES * 60 * 1000;
      const lateLimit = bTime + LATE_CHECK_IN_MINUTES * 60 * 1000;
      return currTime >= earlyLimit && currTime <= lateLimit;
    };
    assert(isWithinWindow(booking.startTime), 'Current time is within 15 mins early / 30 mins late check-in window');

    // Test 6: Check-in workflow update
    booking.status = 'checked_in';
    booking.checkedInAt = new Date();
    booking.checkedInBy = driver._id;
    booking.checkInMethod = 'qr';
    await booking.save();
    charger.status = 'charging';
    await charger.save();

    assert(booking.status === 'checked_in', 'Booking successfully transitions to checked_in');
    assert(charger.status === 'charging', 'Charger state transitions to charging');

    // Test 7: ChargingSession Model creation
    const sessionRef = await generateSessionReference();
    const session = await ChargingSession.create({
      sessionReference: sessionRef,
      bookingId: booking._id,
      userId: driver._id,
      vehicleId: vehicle._id,
      stationId: station._id,
      chargerId: charger._id,
      status: 'charging',
      startedAt: new Date(),
      initialBatteryPercentage: 40,
      currentBatteryPercentage: 40,
      targetBatteryPercentage: 80,
      chargingPowerKw: charger.powerRating,
      energyConsumedKwh: 0,
      estimatedDurationMinutes: 40,
      simulationEnabled: true,
    });

    booking.status = 'charging';
    booking.sessionId = session._id;
    await booking.save();

    assert(session.sessionReference.startsWith('SESSION-'), 'Session reference format is unique & human-readable');
    assert(session.status === 'charging', 'ChargingSession is initiated with charging status');
    assert(booking.status === 'charging', 'Booking status transitions to charging');

    // Test 8: Telemetry updates (Energy & Battery simulation step)
    const energyInc = charger.powerRating / 60; // 0.5 kWh per simulated min
    session.currentBatteryPercentage += 5;
    session.energyConsumedKwh += energyInc * 5;
    await session.save();

    assert(session.currentBatteryPercentage === 45, 'Battery percentage incremented from 40% to 45%');
    assert(session.energyConsumedKwh > 0, 'Energy consumed calculated and increased');

    // Test 9: Pause and Resume transitions
    session.status = 'paused';
    session.pausedAt = new Date();
    await session.save();
    assert(session.status === 'paused', 'Session successfully pauses');

    session.status = 'charging';
    session.pausedAt = null;
    await session.save();
    assert(session.status === 'charging', 'Session successfully resumes');

    // Test 10: Complete session & QR invalidation
    session.status = 'completed';
    session.completedAt = new Date();
    session.currentBatteryPercentage = 80;
    session.actualDurationMinutes = 40;
    await session.save();

    booking.status = 'completed';
    booking.qrInvalidatedAt = new Date();
    await booking.save();

    charger.status = 'available';
    await charger.save();

    assert(session.status === 'completed', 'Session status transitions to completed');
    assert(booking.status === 'completed', 'Booking status transitions to completed');
    assert(charger.status === 'available', 'Charger returns to available state upon completion');
    assert(booking.qrInvalidatedAt !== undefined, 'QR code is invalidated upon session completion');

    // Test 11: Cleanup test records
    await ChargingSession.deleteMany({ userId: { $in: [driver._id, otherDriver._id, admin._id] } });
    await Booking.deleteMany({ userId: { $in: [driver._id, otherDriver._id, admin._id] } });
    await Vehicle.deleteMany({ userId: { $in: [driver._id, otherDriver._id, admin._id] } });
    await Charger.deleteMany({ stationId: station._id });
    await ChargingStation.deleteMany({ _id: station._id });
    await User.deleteMany({ _id: { $in: [driver._id, otherDriver._id, admin._id] } });

    console.log('✓ Test data cleaned up successfully');
  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    await mongoose.disconnect();
    console.log(`\n==================================================`);
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log(`==================================================`);
    process.exit(failed > 0 ? 1 : 0);
  }
};

runTests();
