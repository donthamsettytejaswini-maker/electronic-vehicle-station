const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const ChargingStation = require('../models/ChargingStation');
const Charger = require('../models/Charger');
const Booking = require('../models/Booking');
const ChargingSession = require('../models/ChargingSession');
const generateBookingReference = require('../utils/generateBookingReference');
const generateSessionReference = require('../utils/generateSessionReference');
const { generateRawQrToken, hashQrToken } = require('../utils/generateQrToken');

const seedPhase4 = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('[Seed Error] MONGO_URI is missing in environment variables.');
      process.exit(1);
    }

    console.log('[Phase 4 Seed] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[Phase 4 Seed] MongoDB Connected.');

    // 1. Ensure Admin User
    let admin = await User.findOne({ email: 'admin@evcharge.com' });
    if (!admin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Admin@123', salt);
      admin = await User.create({
        name: 'EVCharge Administrator',
        email: 'admin@evcharge.com',
        password: hashedPassword,
        phone: '+919876543210',
        role: 'admin',
      });
    }

    // 2. Ensure Sample Driver User
    let driver = await User.findOne({ email: 'driver@evcharge.com' });
    if (!driver) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Driver@123', salt);
      driver = await User.create({
        name: 'Alex Rivera',
        email: 'driver@evcharge.com',
        password: hashedPassword,
        phone: '+919876500001',
        role: 'user',
      });
      console.log('[Phase 4 Seed] Created sample driver: driver@evcharge.com / Driver@123');
    }

    // 3. Ensure Driver Vehicle
    let vehicle = await Vehicle.findOne({ userId: driver._id, vehicleNumber: 'KA01EQ7788' });
    if (!vehicle) {
      vehicle = await Vehicle.create({
        userId: driver._id,
        vehicleNumber: 'KA01EQ7788',
        brand: 'Tata',
        model: 'Nexon EV MAX',
        manufacturingYear: 2024,
        batteryCapacity: 40.5,
        connectorType: 'CCS2',
        maxChargingPower: 50,
        color: 'Intensi-Teal',
        isDefault: true,
      });
      console.log('[Phase 4 Seed] Created sample vehicle KA01EQ7788 for driver');
    }

    // 4. Ensure Station & Chargers
    let station = await ChargingStation.findOne({ name: 'ABC EV Station' });
    if (!station) {
      station = await ChargingStation.create({
        name: 'ABC EV Station',
        description: 'Prime highway ultra-fast EV charging hub with driver lounge and coffee bar.',
        address: 'MG Road, Benz Circle',
        city: 'Vijayawada',
        state: 'Andhra Pradesh',
        postalCode: '520010',
        latitude: 16.5062,
        longitude: 80.648,
        pricePerKwh: 15.0,
        operatingHours: '24 hours',
        phone: '+91 98765 11223',
        facilities: ['Parking', 'Restroom', 'Cafe', 'WiFi', 'Security'],
        status: 'active',
        image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80',
        averageRating: 4.8,
        totalReviews: 24,
        createdBy: admin._id,
      });
    }

    let chargers = await Charger.find({ stationId: station._id });
    if (chargers.length === 0) {
      const ch1 = await Charger.create({
        stationId: station._id,
        chargerNumber: 'ABC-CH-01',
        connectorType: 'CCS2',
        chargingSpeed: 'Rapid',
        powerRating: 60,
        status: 'available',
        pricePerKwh: 15.0,
      });
      const ch2 = await Charger.create({
        stationId: station._id,
        chargerNumber: 'ABC-CH-02',
        connectorType: 'CCS2',
        chargingSpeed: 'Fast',
        powerRating: 30,
        status: 'available',
        pricePerKwh: 15.0,
      });
      chargers = [ch1, ch2];
    }

    const charger1 = chargers[0];
    const charger2 = chargers[1] || chargers[0];

    // 5. Seed Sample Bookings & Sessions
    const now = new Date();

    // Booking A: Confirmed with Valid QR Code (Current time window for immediate check-in)
    let bookingA = await Booking.findOne({ userId: driver._id, status: 'confirmed' });
    if (!bookingA) {
      const startTime = new Date(now.getTime() - 5 * 60 * 1000); // Started 5 mins ago (eligible for check-in)
      const endTime = new Date(now.getTime() + 55 * 60 * 1000); // 1 hour slot
      const rawToken = generateRawQrToken();

      bookingA = await Booking.create({
        bookingReference: generateBookingReference(),
        userId: driver._id,
        vehicleId: vehicle._id,
        stationId: station._id,
        chargerId: charger1._id,
        startTime,
        endTime,
        status: 'confirmed',
        totalPrice: 360.0,
        paymentStatus: 'pending',
        qrTokenHash: hashQrToken(rawToken),
        qrGeneratedAt: new Date(),
      });
      console.log(`[Phase 4 Seed] Created Check-In Eligible Booking: ${bookingA.bookingReference}`);
    }

    // Booking B & Completed Session (Historical Session)
    let historicalSession = await ChargingSession.findOne({ userId: driver._id, status: 'completed' });
    if (!historicalSession) {
      const pastStart = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Yesterday
      const pastEnd = new Date(pastStart.getTime() + 45 * 60 * 1000);

      const bookingB = await Booking.create({
        bookingReference: generateBookingReference(),
        userId: driver._id,
        vehicleId: vehicle._id,
        stationId: station._id,
        chargerId: charger2._id,
        startTime: pastStart,
        endTime: pastEnd,
        status: 'completed',
        totalPrice: 285.0,
        paymentStatus: 'pending',
        checkedInAt: pastStart,
        checkInMethod: 'qr',
      });

      historicalSession = await ChargingSession.create({
        sessionReference: generateSessionReference(),
        bookingId: bookingB._id,
        userId: driver._id,
        vehicleId: vehicle._id,
        stationId: station._id,
        chargerId: charger2._id,
        status: 'completed',
        startedAt: pastStart,
        completedAt: pastEnd,
        initialBatteryPercentage: 25,
        currentBatteryPercentage: 85,
        targetBatteryPercentage: 85,
        chargingPowerKw: 30,
        energyConsumedKwh: 19.2,
        actualDurationMinutes: 45,
        simulationEnabled: false,
      });

      bookingB.sessionId = historicalSession._id;
      await bookingB.save();
      console.log(`[Phase 4 Seed] Created Historical Session: ${historicalSession.sessionReference}`);
    }

    console.log('==================================================');
    console.log('[Phase 4 Seed Success] Phase 4 test records seeded successfully!');
    console.log('Test Driver: driver@evcharge.com / Driver@123');
    console.log('Test Admin:  admin@evcharge.com  / Admin@123');
    console.log('==================================================');

    process.exit(0);
  } catch (error) {
    console.error(`[Phase 4 Seed Error] Failed to seed: ${error.message}`);
    process.exit(1);
  }
};

seedPhase4();
