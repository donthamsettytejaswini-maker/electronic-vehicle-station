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

const seedPhase6 = async () => {
  console.log('[Phase 6 Seed] Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/evcharge');
  console.log('[Phase 6 Seed] MongoDB Connected.');

  try {
    // 1. Admin & Users
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

    let driver1 = await User.findOne({ email: 'driver@evcharge.com' });
    if (!driver1) {
      driver1 = await User.create({
        name: 'Demo Driver',
        email: 'driver@evcharge.com',
        password: 'Driver@123',
        phone: '+91 9876543210',
        role: 'user',
      });
    }

    let driver2 = await User.findOne({ email: 'priya.sharma@example.com' });
    if (!driver2) {
      driver2 = await User.create({
        name: 'Priya Sharma',
        email: 'priya.sharma@example.com',
        password: 'Driver@123',
        phone: '+91 9811122233',
        role: 'user',
      });
    }

    let driver3 = await User.findOne({ email: 'rahul.verma@example.com' });
    if (!driver3) {
      driver3 = await User.create({
        name: 'Rahul Verma',
        email: 'rahul.verma@example.com',
        password: 'Driver@123',
        phone: '+91 9822233344',
        role: 'user',
      });
    }

    // 2. Vehicles
    let vehicle1 = await Vehicle.findOne({ userId: driver1._id });
    if (!vehicle1) {
      vehicle1 = await Vehicle.create({
        userId: driver1._id,
        vehicleNumber: 'KA01EQ7788',
        brand: 'Tata',
        model: 'Nexon EV Max',
        batteryCapacity: 40.5,
        connectorType: 'CCS2',
        isDefault: true,
      });
    }

    let vehicle2 = await Vehicle.findOne({ userId: driver2._id });
    if (!vehicle2) {
      vehicle2 = await Vehicle.create({
        userId: driver2._id,
        vehicleNumber: 'KA03EV1234',
        brand: 'MG',
        model: 'ZS EV',
        batteryCapacity: 50.3,
        connectorType: 'CCS2',
        isDefault: true,
      });
    }

    let vehicle3 = await Vehicle.findOne({ userId: driver3._id });
    if (!vehicle3) {
      vehicle3 = await Vehicle.create({
        userId: driver3._id,
        vehicleNumber: 'KA05EV9900',
        brand: 'Hyundai',
        model: 'Ioniq 5',
        batteryCapacity: 72.6,
        connectorType: 'CCS2',
        isDefault: true,
      });
    }

    // 3. Charging Stations (Indiranagar, Whitefield, Koramangala)
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
        latitude: 12.985,
        longitude: 77.73,
        pricePerKwh: 20,
        status: 'active',
        operatingHours: '24/7',
        createdBy: admin._id,
      });
    }

    let station3 = await ChargingStation.findOne({ name: /Koramangala/ });
    if (!station3) {
      station3 = await ChargingStation.create({
        name: 'Koramangala 80ft FastCharge',
        address: '80 Feet Road, 4th Block, Koramangala',
        city: 'Bangalore',
        state: 'Karnataka',
        postalCode: '560034',
        latitude: 12.9352,
        longitude: 77.6245,
        pricePerKwh: 19,
        status: 'active',
        operatingHours: '24/7',
        createdBy: admin._id,
      });
    }

    // Chargers
    let c1 = await Charger.findOne({ stationId: station1._id, chargerNumber: 'IND-FAST-01' });
    if (!c1) {
      c1 = await Charger.create({
        stationId: station1._id,
        chargerNumber: 'IND-FAST-01',
        connectorType: 'CCS2',
        chargingSpeed: 'Fast',
        powerRating: 30,
        status: 'available',
        pricePerKwh: 18,
      });
    }

    let c2 = await Charger.findOne({ stationId: station1._id, chargerNumber: 'IND-FAST-02' });
    if (!c2) {
      c2 = await Charger.create({
        stationId: station1._id,
        chargerNumber: 'IND-FAST-02',
        connectorType: 'Type 2',
        chargingSpeed: 'Normal',
        powerRating: 15,
        status: 'available',
        pricePerKwh: 16,
      });
    }

    let c3 = await Charger.findOne({ stationId: station2._id, chargerNumber: 'WTF-RAPID-01' });
    if (!c3) {
      c3 = await Charger.create({
        stationId: station2._id,
        chargerNumber: 'WTF-RAPID-01',
        connectorType: 'CCS2',
        chargingSpeed: 'Rapid',
        powerRating: 60,
        status: 'available',
        pricePerKwh: 20,
      });
    }

    let c4 = await Charger.findOne({ stationId: station3._id, chargerNumber: 'KOR-FAST-01' });
    if (!c4) {
      c4 = await Charger.create({
        stationId: station3._id,
        chargerNumber: 'KOR-FAST-01',
        connectorType: 'CCS2',
        chargingSpeed: 'Fast',
        powerRating: 50,
        status: 'available',
        pricePerKwh: 19,
      });
    }

    // 4. Generate Multi-Day Historical Activity (Past 25 days)
    console.log('[Phase 6 Seed] Generating realistic historical transactions and peak curves...');

    const drivers = [
      { user: driver1, vehicle: vehicle1 },
      { user: driver2, vehicle: vehicle2 },
      { user: driver3, vehicle: vehicle3 },
    ];
    const stationsList = [
      { station: station1, charger: c1, rate: 18 },
      { station: station1, charger: c2, rate: 16 },
      { station: station2, charger: c3, rate: 20 },
      { station: station3, charger: c4, rate: 19 },
    ];

    // Seed historical sessions across different days and hours
    const daysToSeed = [0, 1, 2, 3, 4, 5, 7, 10, 14, 18, 21, 25];
    const peakHoursSchedule = [9, 10, 14, 17, 18, 19, 21]; // Morning & evening rush hours

    let seededCount = 0;

    for (const daysAgo of daysToSeed) {
      for (const hour of peakHoursSchedule) {
        const itemStation = stationsList[(daysAgo + hour) % stationsList.length];
        const itemDriver = drivers[(daysAgo * 2 + hour) % drivers.length];

        const date = new Date(Date.now() - daysAgo * 24 * 3600 * 1000);
        date.setHours(hour, Math.floor(Math.random() * 30), 0, 0);

        const startTime = date;
        const durationMinutes = 40 + Math.floor(Math.random() * 35);
        const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

        // Check if booking already exists at that exact timestamp
        const existingBooking = await Booking.findOne({
          chargerId: itemStation.charger._id,
          startTime,
        });

        if (!existingBooking) {
          const energyKwh = Math.round((15 + Math.random() * 25) * 10) / 10;
          const energyCharge = Math.round(energyKwh * itemStation.rate * 100) / 100;
          const totalAmount = energyCharge;

          const isCancelled = daysAgo % 4 === 0 && hour === 14; // Occasional cancellations

          const booking = await Booking.create({
            bookingReference: generateBookingReference(),
            userId: itemDriver.user._id,
            vehicleId: itemDriver.vehicle._id,
            stationId: itemStation.station._id,
            chargerId: itemStation.charger._id,
            startTime,
            endTime,
            status: isCancelled ? 'cancelled' : 'completed',
            paymentStatus: isCancelled ? 'not_required' : 'paid',
            createdAt: startTime,
          });

          if (!isCancelled) {
            const session = await ChargingSession.create({
              sessionReference: generateSessionReference(),
              bookingId: booking._id,
              userId: itemDriver.user._id,
              vehicleId: itemDriver.vehicle._id,
              stationId: itemStation.station._id,
              chargerId: itemStation.charger._id,
              status: 'completed',
              startedAt: startTime,
              completedAt: endTime,
              initialBatteryPercentage: 20,
              currentBatteryPercentage: 80,
              targetBatteryPercentage: 80,
              chargingPowerKw: itemStation.charger.powerRating,
              energyConsumedKwh: energyKwh,
              actualDurationMinutes: durationMinutes,
              paymentStatus: 'paid',
              finalBillAmount: totalAmount,
              billedAt: endTime,
              createdAt: startTime,
            });

            const payment = await Payment.create({
              paymentReference: generatePaymentReference(),
              invoiceNumber: generateInvoiceNumber(),
              userId: itemDriver.user._id,
              bookingId: booking._id,
              sessionId: session._id,
              stationId: itemStation.station._id,
              chargerId: itemStation.charger._id,
              vehicleId: itemDriver.vehicle._id,
              provider: 'mock',
              paymentMethod: hour % 2 === 0 ? 'mock_upi' : 'mock_card',
              amount: totalAmount,
              currency: 'INR',
              energyConsumedKwh: energyKwh,
              ratePerKwh: itemStation.rate,
              energyCharge,
              serviceFee: 0,
              taxRate: 0,
              taxAmount: 0,
              discountAmount: 0,
              subtotal: energyCharge,
              totalAmount,
              status: 'paid',
              paidAt: endTime,
              createdAt: startTime,
            });

            booking.paymentId = payment._id;
            await booking.save();

            session.paymentId = payment._id;
            await session.save();

            seededCount++;
          }
        }
      }
    }

    console.log(`[Phase 6 Seed] Generated ${seededCount} historical telemetry cycles.`);
    console.log('==================================================');
    console.log('[Phase 6 Seed Success] All Phase 6 datasets seeded successfully!');
    console.log('Admin Credentials: admin@evcharge.com / Admin@123');
    console.log('Driver Credentials: driver@evcharge.com / Driver@123');
    console.log('==================================================');
  } catch (err) {
    console.error('[Phase 6 Seed Error]:', err);
  } finally {
    await mongoose.disconnect();
  }
};

seedPhase6();
