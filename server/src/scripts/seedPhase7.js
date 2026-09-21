import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

import User from '../models/User.js';
import ChargingStation from '../models/ChargingStation.js';
import ChargingSession from '../models/ChargingSession.js';
import Booking from '../models/Booking.js';
import Review from '../models/Review.js';
import Notification from '../models/Notification.js';
import PricingRule from '../models/PricingRule.js';
import Organization from '../models/Organization.js';
import OrganizationMember from '../models/OrganizationMember.js';

const seedPhase7 = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/evcharge';
    console.log('Connecting to database:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // 1. Fetch existing users, stations, and completed sessions
    const users = await User.find();
    const stations = await ChargingStation.find();
    const completedSessions = await ChargingSession.find({ status: 'completed' });
    const adminUser = users.find(u => u.role === 'admin') || users[0];
    const regularUser = users.find(u => u.role !== 'admin') || users[0];

    console.log(`Found ${users.length} users, ${stations.length} stations, and ${completedSessions.length} completed sessions.`);

    // 2. Seed Reviews
    if (completedSessions.length > 0 && stations.length > 0) {
      console.log('Seeding driver reviews...');
      await Review.deleteMany({});

      for (let i = 0; i < Math.min(5, completedSessions.length); i++) {
        const sess = completedSessions[i];
        const rev = new Review({
          userId: sess.userId,
          stationId: sess.stationId,
          bookingId: sess.bookingId,
          sessionId: sess._id,
          rating: 5 - (i % 2),
          chargingSpeedRating: 5,
          availabilityRating: 4,
          cleanlinessRating: 5,
          staffRating: 4,
          comment: `Great ultra-fast charging experience at ${stations[0]?.name || 'the hub'}. Seamless QR check-in!`,
          status: 'published',
        });
        await rev.save();
      }
      console.log('✅ Seeded verified station reviews');
    }

    // 3. Seed In-App Notifications
    console.log('Seeding in-app notifications...');
    await Notification.deleteMany({});
    if (regularUser) {
      const sampleNotifications = [
        {
          userId: regularUser._id,
          type: 'booking_confirmed',
          title: 'Booking Confirmed #BK-8821',
          message: 'Your slot at MG Road Supercharger Hub is confirmed for 6:00 PM today.',
          channel: 'in_app',
        },
        {
          userId: regularUser._id,
          type: 'charging_completed',
          title: 'Charging Session Completed',
          message: 'Delivered 24.8 kWh. Your battery reached 85% state of charge.',
          channel: 'in_app',
        },
        {
          userId: regularUser._id,
          type: 'payment_success',
          title: 'Invoice Settled ₹372.00',
          message: 'Payment received successfully. Tax invoice has been generated.',
          channel: 'in_app',
        },
      ];
      await Notification.insertMany(sampleNotifications);
      console.log('✅ Seeded sample notifications');
    }

    // 4. Seed Dynamic Pricing Rules
    console.log('Seeding dynamic pricing rules...');
    await PricingRule.deleteMany({});
    const pricingRules = [
      {
        name: 'Peak Hour Evening Surge',
        stationId: stations[0]?._id || null,
        ruleType: 'peak_surge',
        multiplier: 1.25,
        startTime: '17:00',
        endTime: '21:00',
        daysOfWeek: [1, 2, 3, 4, 5],
        priority: 10,
        active: true,
      },
      {
        name: 'Late Night Off-Peak Saver',
        stationId: null, // Network wide
        ruleType: 'off_peak_discount',
        multiplier: 0.85,
        startTime: '23:00',
        endTime: '06:00',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        priority: 5,
        active: true,
      },
    ];
    await PricingRule.insertMany(pricingRules);
    console.log('✅ Seeded dynamic pricing rules');

    // 5. Seed Corporate Fleet Organization
    console.log('Seeding corporate fleet organization...');
    await Organization.deleteMany({});
    await OrganizationMember.deleteMany({});

    if (adminUser && regularUser) {
      const org = await Organization.create({
        name: 'GreenTransit Logistics Corp',
        code: 'GREENTRANSIT',
        contactEmail: 'fleet-billing@greentransit.com',
        monthlyBudget: 75000,
        ownerId: adminUser._id,
      });

      await OrganizationMember.create({
        organizationId: org._id,
        userId: adminUser._id,
        role: 'organization_admin',
        dailyQuotaKw: 250,
      });

      await OrganizationMember.create({
        organizationId: org._id,
        userId: regularUser._id,
        role: 'fleet_driver',
        dailyQuotaKw: 120,
      });
      console.log('✅ Seeded fleet organization & members');
    }

    console.log('==================================================');
    console.log('🎉 PHASE 7 SEEDING COMPLETED SUCCESSFULLY!');
    console.log('==================================================');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during Phase 7 seed:', err);
    process.exit(1);
  }
};

seedPhase7();
