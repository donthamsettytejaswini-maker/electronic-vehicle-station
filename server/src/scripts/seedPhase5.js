require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const ChargingStation = require('../models/ChargingStation');
const Charger = require('../models/Charger');
const Booking = require('../models/Booking');
const ChargingSession = require('../models/ChargingSession');
const Payment = require('../models/Payment');
const generateBookingReference = require('../utils/generateBookingReference');
const generateSessionReference = require('../utils/generateSessionReference');
const generatePaymentReference = require('../utils/generatePaymentReference');
const generateInvoiceNumber = require('../utils/generateInvoiceNumber');

const seedPhase5 = async () => {
  console.log('[Phase 5 Seed] Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/evcharge');
  console.log('[Phase 5 Seed] MongoDB Connected.');

  try {
    // 1. Find or create Driver and Admin
    let driver = await User.findOne({ email: 'driver@evcharge.com' });
    if (!driver) {
      driver = await User.create({
        name: 'Demo Driver',
        email: 'driver@evcharge.com',
        password: 'Driver@123',
        phone: '+91 9876543210',
        role: 'user',
      });
    }

    let admin = await User.findOne({ email: 'admin@evcharge.com' });
    if (!admin) {
      admin = await User.create({
        name: 'System Administrator',
        email: 'admin@evcharge.com',
        password: 'Admin@123',
        phone: '+91 9999988888',
        role: 'admin',
      });
    }

    // 2. Vehicle
    let vehicle = await Vehicle.findOne({ userId: driver._id });
    if (!vehicle) {
      vehicle = await Vehicle.create({
        userId: driver._id,
        vehicleNumber: 'KA01EQ7788',
        brand: 'Tata',
        model: 'Nexon EV Max',
        batteryCapacity: 40.5,
        connectorType: 'CCS2',
        isDefault: true,
      });
    }

    // 3. Find or Create Stations
    let station1 = await ChargingStation.findOne({ name: /Indiranagar/ });
    if (!station1) {
      station1 = await ChargingStation.create({
        name: 'Indiranagar Hub EV Charging',
        address: '100 Feet Road, Indiranagar',
        city: 'Bangalore',
        state: 'Karnataka',
        postalCode: '560038',
        latitude: 12.9784,
        longitude: 77.6408,
        totalChargers: 2,
        availableChargers: 2,
        chargingChargers: 0,
        maintenanceChargers: 0,
        pricePerKwh: 18,
        status: 'active',
        operatingHours: '24/7',
        createdBy: admin._id,
      });
    }

    let station2 = await ChargingStation.findOne({ name: /Whitefield/ });
    if (!station2) {
      station2 = await ChargingStation.create({
        name: 'Whitefield IT Park Supercharger',
        address: 'ITPL Main Road, Whitefield',
        city: 'Bangalore',
        state: 'Karnataka',
        postalCode: '560066',
        latitude: 12.9850,
        longitude: 77.7300,
        totalChargers: 2,
        availableChargers: 2,
        chargingChargers: 0,
        maintenanceChargers: 0,
        pricePerKwh: 20,
        status: 'active',
        operatingHours: '24/7',
        createdBy: admin._id,
      });
    }

    let charger1 = await Charger.findOne({ stationId: station1._id });
    if (!charger1) {
      charger1 = await Charger.create({
        stationId: station1._id,
        chargerNumber: 'IND-FAST-01',
        connectorType: 'CCS2',
        chargingSpeed: 'Fast',
        powerRating: 30,
        status: 'available',
        pricePerKwh: 18,
      });
    }

    let charger2 = await Charger.findOne({ stationId: station2._id });
    if (!charger2) {
      charger2 = await Charger.create({
        stationId: station2._id,
        chargerNumber: 'WTF-RAPID-01',
        connectorType: 'CCS2',
        chargingSpeed: 'Rapid',
        powerRating: 60,
        status: 'available',
        pricePerKwh: 20,
      });
    }

    // Helper: Create Completed Session & Payment
    const createSampleCompletedSessionWithPayment = async ({
      station,
      charger,
      energyKwh,
      rate,
      status,
      method,
      daysAgo = 0,
      refundAmount = 0,
      refundReason = null,
      failureReason = null,
    }) => {
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      const startedAt = new Date(createdAt.getTime() - 60 * 60 * 1000);
      const completedAt = createdAt;

      const bookingRef = generateBookingReference();
      const booking = await Booking.create({
        bookingReference: bookingRef,
        userId: driver._id,
        vehicleId: vehicle._id,
        stationId: station._id,
        chargerId: charger._id,
        startTime: startedAt,
        endTime: completedAt,
        status: 'completed',
        paymentStatus: status,
        createdAt,
      });

      const sessionRef = generateSessionReference();
      const session = await ChargingSession.create({
        sessionReference: sessionRef,
        bookingId: booking._id,
        userId: driver._id,
        vehicleId: vehicle._id,
        stationId: station._id,
        chargerId: charger._id,
        status: 'completed',
        startedAt,
        completedAt,
        initialBatteryPercentage: 20,
        currentBatteryPercentage: 80,
        targetBatteryPercentage: 80,
        chargingPowerKw: charger.powerRating,
        energyConsumedKwh: energyKwh,
        actualDurationMinutes: 50,
        paymentStatus: status,
        finalBillAmount: Math.round(energyKwh * rate * 100) / 100,
        billedAt: completedAt,
        createdAt,
      });

      const energyCharge = Math.round(energyKwh * rate * 100) / 100;
      const totalAmount = energyCharge;

      const payment = await Payment.create({
        paymentReference: generatePaymentReference(),
        invoiceNumber: generateInvoiceNumber(),
        userId: driver._id,
        bookingId: booking._id,
        sessionId: session._id,
        stationId: station._id,
        chargerId: charger._id,
        vehicleId: vehicle._id,
        provider: 'mock',
        paymentMethod: method,
        amount: totalAmount,
        currency: 'INR',
        energyConsumedKwh: energyKwh,
        ratePerKwh: rate,
        energyCharge,
        serviceFee: 0,
        taxRate: 0,
        taxAmount: 0,
        discountAmount: 0,
        subtotal: energyCharge,
        totalAmount,
        status,
        failureReason,
        refundAmount,
        refundReason,
        refundedAt: refundAmount > 0 ? completedAt : null,
        refundedBy: refundAmount > 0 ? admin._id : null,
        paidAt: status === 'paid' || status === 'refunded' || status === 'partially_refunded' ? completedAt : null,
        providerPaymentId: `MOCK-TXN-${Date.now()}`,
        createdAt,
      });

      booking.paymentId = payment._id;
      await booking.save();

      session.paymentId = payment._id;
      await session.save();

      return { booking, session, payment };
    };

    console.log('[Phase 5 Seed] Generating sample payment records...');

    // 1. Paid Mock UPI Payment (Indiranagar)
    await createSampleCompletedSessionWithPayment({
      station: station1,
      charger: charger1,
      energyKwh: 18.5,
      rate: 18,
      status: 'paid',
      method: 'mock_upi',
      daysAgo: 1,
    });

    // 2. Paid Mock Card Payment (Whitefield)
    await createSampleCompletedSessionWithPayment({
      station: station2,
      charger: charger2,
      energyKwh: 24.0,
      rate: 20,
      status: 'paid',
      method: 'mock_card',
      daysAgo: 3,
    });

    // 3. Pending Payment (Ready for checkout demo!)
    await createSampleCompletedSessionWithPayment({
      station: station1,
      charger: charger1,
      energyKwh: 15.2,
      rate: 18,
      status: 'pending',
      method: 'mock_upi',
      daysAgo: 0,
    });

    // 4. Failed Payment
    await createSampleCompletedSessionWithPayment({
      station: station2,
      charger: charger2,
      energyKwh: 12.0,
      rate: 20,
      status: 'failed',
      method: 'mock_card',
      failureReason: 'Insufficient simulated bank funds',
      daysAgo: 4,
    });

    // 5. Refunded Payment (Admin refund demo)
    await createSampleCompletedSessionWithPayment({
      station: station1,
      charger: charger1,
      energyKwh: 10.0,
      rate: 18,
      status: 'refunded',
      method: 'mock_upi',
      refundAmount: 180,
      refundReason: 'Duplicate charging session billing adjustment',
      daysAgo: 6,
    });

    console.log('==================================================');
    console.log('[Phase 5 Seed Success] Seeded test records successfully!');
    console.log('Test Driver: driver@evcharge.com / Driver@123');
    console.log('Test Admin:  admin@evcharge.com  / Admin@123');
    console.log('==================================================');
  } catch (err) {
    console.error('[Phase 5 Seed Error]:', err);
  } finally {
    await mongoose.disconnect();
  }
};

seedPhase5();
