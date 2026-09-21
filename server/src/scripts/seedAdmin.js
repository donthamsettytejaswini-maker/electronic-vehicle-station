const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

dotenv.config();

const User = require('../models/User');

const seedAdmin = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('[Admin Seed Error] MONGO_URI is missing in environment variables.');
      process.exit(1);
    }

    console.log('[Admin Seed] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[Admin Seed] MongoDB Connected.');

    const adminEmail = 'admin@evcharge.com';
    const adminPassword = 'Admin@123';

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log(`[Admin Seed Info] Admin account (${adminEmail}) already exists. Updating role to admin...`);
      existingAdmin.role = 'admin';
      await existingAdmin.save();
      console.log('[Admin Seed Success] Admin account confirmed.');
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    const admin = await User.create({
      name: 'EVCharge Administrator',
      email: adminEmail,
      password: hashedPassword,
      phone: '+919876543210',
      role: 'admin',
    });

    console.log('==================================================');
    console.log('[Admin Seed Success] Admin account created successfully:');
    console.log(`Email:    ${admin.email}`);
    console.log(`Password: ${adminPassword}`);
    console.log(`Role:     ${admin.role}`);
    console.log('IMPORTANT: Change this password before production deployment!');
    console.log('==================================================');

    process.exit(0);
  } catch (error) {
    console.error(`[Admin Seed Error] Failed to seed admin: ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();
