const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('../models/User');
const ChargingStation = require('../models/ChargingStation');
const Charger = require('../models/Charger');

const seedPhase2 = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('[Seed Error] MONGO_URI is missing in environment variables.');
      process.exit(1);
    }

    console.log('[Phase 2 Seed] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[Phase 2 Seed] MongoDB Connected.');

    // 1. Find or create admin user to assign createdBy
    let admin = await User.findOne({ email: 'admin@evcharge.com' });
    if (!admin) {
      console.log('[Phase 2 Seed] Admin user not found. Creating default admin...');
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

    // 2. Define Sample Stations
    const sampleStations = [
      {
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
        chargers: [
          {
            chargerNumber: 'ABC-CH-01',
            connectorType: 'CCS2',
            chargingSpeed: 'Rapid',
            powerRating: 60,
            status: 'available',
            pricePerKwh: 15.0,
            description: 'Ultra-fast 60kW DC Dual Gun Charger',
          },
          {
            chargerNumber: 'ABC-CH-02',
            connectorType: 'CCS2',
            chargingSpeed: 'Fast',
            powerRating: 30,
            status: 'available',
            pricePerKwh: 15.0,
            description: 'Fast 30kW DC CCS2 Gun',
          },
          {
            chargerNumber: 'ABC-CH-03',
            connectorType: 'Type 2',
            chargingSpeed: 'Normal',
            powerRating: 22,
            status: 'charging',
            pricePerKwh: 13.5,
            description: '22kW AC Destination Charger',
          },
          {
            chargerNumber: 'ABC-CH-04',
            connectorType: 'CHAdeMO',
            chargingSpeed: 'Fast',
            powerRating: 50,
            status: 'maintenance',
            pricePerKwh: 15.0,
            description: '50kW CHAdeMO Fast Port',
          },
        ],
      },
      {
        name: 'GreenCharge Hub',
        description: 'Eco-friendly solar-assisted charging facility located conveniently near the bypass.',
        address: 'Ring Road, Lakshmipuram',
        city: 'Guntur',
        state: 'Andhra Pradesh',
        postalCode: '522007',
        latitude: 16.3067,
        longitude: 80.4365,
        pricePerKwh: 14.0,
        operatingHours: '6:00 AM - 11:00 PM',
        phone: '+91 98765 22334',
        facilities: ['Parking', 'Restroom', 'WiFi'],
        status: 'active',
        image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=800&q=80',
        averageRating: 4.5,
        totalReviews: 18,
        chargers: [
          {
            chargerNumber: 'GCH-01',
            connectorType: 'CCS2',
            chargingSpeed: 'Fast',
            powerRating: 50,
            status: 'available',
            pricePerKwh: 14.0,
            description: '50kW Solar Supported DC Bay',
          },
          {
            chargerNumber: 'GCH-02',
            connectorType: 'Type 2',
            chargingSpeed: 'Slow',
            powerRating: 7.4,
            status: 'available',
            pricePerKwh: 11.0,
            description: '7.4kW Slow Overnight AC Point',
          },
          {
            chargerNumber: 'GCH-03',
            connectorType: 'GB/T',
            chargingSpeed: 'Normal',
            powerRating: 15,
            status: 'reserved',
            pricePerKwh: 13.0,
            description: '15kW Fleet GB/T Connector',
          },
        ],
      },
      {
        name: 'FastVolt Station',
        description: 'High-power metropolitan charging hub in HITEC City with smart telemetry and 24/7 security.',
        address: 'Cyber Towers Main Rd, HITEC City',
        city: 'Hyderabad',
        state: 'Telangana',
        postalCode: '500081',
        latitude: 17.4483,
        longitude: 78.3915,
        pricePerKwh: 18.0,
        operatingHours: '24 hours',
        phone: '+91 98765 33445',
        facilities: ['Parking', 'Restroom', 'Cafe', 'WiFi', 'Security'],
        status: 'active',
        image: 'https://images.unsplash.com/photo-1558441719-aa34bbe54897?auto=format&fit=crop&w=800&q=80',
        averageRating: 4.9,
        totalReviews: 42,
        chargers: [
          {
            chargerNumber: 'FV-HYD-01',
            connectorType: 'CCS2',
            chargingSpeed: 'Rapid',
            powerRating: 120,
            status: 'available',
            pricePerKwh: 18.0,
            description: '120kW Supercharger Bay 1',
          },
          {
            chargerNumber: 'FV-HYD-02',
            connectorType: 'CCS2',
            chargingSpeed: 'Rapid',
            powerRating: 120,
            status: 'charging',
            pricePerKwh: 18.0,
            description: '120kW Supercharger Bay 2',
          },
          {
            chargerNumber: 'FV-HYD-03',
            connectorType: 'Type 2',
            chargingSpeed: 'Fast',
            powerRating: 22,
            status: 'available',
            pricePerKwh: 16.0,
            description: '22kW Dual AC Port',
          },
          {
            chargerNumber: 'FV-HYD-04',
            connectorType: 'CHAdeMO',
            chargingSpeed: 'Fast',
            powerRating: 50,
            status: 'available',
            pricePerKwh: 18.0,
            description: '50kW CHAdeMO Port',
          },
        ],
      },
    ];

    console.log('[Phase 2 Seed] Seeding stations and chargers...');

    for (const stData of sampleStations) {
      const { chargers, ...stationInfo } = stData;

      let station = await ChargingStation.findOne({ name: stationInfo.name, city: stationInfo.city });
      if (!station) {
        station = await ChargingStation.create({
          ...stationInfo,
          createdBy: admin._id,
        });
        console.log(`[Phase 2 Seed] Created Station: "${station.name}" (${station.city})`);
      } else {
        console.log(`[Phase 2 Seed] Station "${station.name}" already exists. Ensuring chargers...`);
      }

      for (const chData of chargers) {
        const existingCharger = await Charger.findOne({
          stationId: station._id,
          chargerNumber: chData.chargerNumber,
        });

        if (!existingCharger) {
          await Charger.create({
            ...chData,
            stationId: station._id,
          });
          console.log(`  -> Added Charger ${chData.chargerNumber} (${chData.connectorType}, ${chData.chargingSpeed})`);
        }
      }
    }

    console.log('==================================================');
    console.log('[Phase 2 Seed Success] All Phase 2 sample stations and chargers seeded successfully!');
    console.log('==================================================');

    process.exit(0);
  } catch (error) {
    console.error(`[Phase 2 Seed Error] Failed to seed: ${error.message}`);
    process.exit(1);
  }
};

seedPhase2();
