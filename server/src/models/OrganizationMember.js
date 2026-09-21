const mongoose = require('mongoose');

const organizationMemberSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    role: {
      type: String,
      enum: ['organization_admin', 'fleet_manager', 'fleet_driver'],
      default: 'fleet_driver',
      required: true,
    },
    dailyKwhLimit: {
      type: Number,
      default: 80, // 80 kWh / day default
      min: 0,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'invited'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: User can belong to an organization once
organizationMemberSchema.index({ organizationId: 1, userId: 1 }, { unique: true });

const OrganizationMember = mongoose.model('OrganizationMember', organizationMemberSchema);

module.exports = OrganizationMember;
