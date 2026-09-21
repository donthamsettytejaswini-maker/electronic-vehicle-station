const Organization = require('../models/Organization');
const OrganizationMember = require('../models/OrganizationMember');
const User = require('../models/User');
const Booking = require('../models/Booking');
const ChargingSession = require('../models/ChargingSession');
const Payment = require('../models/Payment');

/**
 * @desc Create new fleet organization
 * @route POST /api/fleet/organizations
 * @access Private
 */
const createOrganization = async (req, res, next) => {
  try {
    const { name, code, contactEmail, contactPhone, address, monthlyBudget } = req.body;

    const existing = await Organization.findOne({ code: code.toUpperCase().trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Organization code already exists. Please choose a unique code.',
      });
    }

    const org = await Organization.create({
      name: name.trim(),
      code: code.toUpperCase().trim(),
      contactEmail: contactEmail.toLowerCase().trim(),
      contactPhone: contactPhone ? contactPhone.trim() : '',
      address: address ? address.trim() : '',
      monthlyBudget: Number(monthlyBudget) || 50000,
      ownerId: req.user._id,
    });

    // Make creator an organization_admin member
    await OrganizationMember.create({
      organizationId: org._id,
      userId: req.user._id,
      role: 'organization_admin',
      status: 'active',
    });

    res.status(201).json({
      success: true,
      message: 'Fleet organization created successfully',
      data: org,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get user's organizations
 * @route GET /api/fleet/organizations
 * @access Private
 */
const getMyOrganizations = async (req, res, next) => {
  try {
    let orgIds = [];
    if (req.user.role === 'admin') {
      const allOrgs = await Organization.find().sort({ createdAt: -1 }).lean();
      return res.status(200).json({
        success: true,
        data: allOrgs,
      });
    }

    const memberships = await OrganizationMember.find({ userId: req.user._id }).lean();
    orgIds = memberships.map((m) => m.organizationId);

    const orgs = await Organization.find({ _id: { $in: orgIds } })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: orgs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get organization details
 * @route GET /api/fleet/organizations/:id
 * @access Private
 */
const getOrganizationById = async (req, res, next) => {
  try {
    const org = await Organization.findById(req.params.id).populate('ownerId', 'name email');
    if (!org) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    const membership = await OrganizationMember.findOne({
      organizationId: org._id,
      userId: req.user._id,
    });

    if (!membership && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this organization',
      });
    }

    const membersCount = await OrganizationMember.countDocuments({ organizationId: org._id });

    res.status(200).json({
      success: true,
      data: {
        organization: org,
        membersCount,
        myRole: membership?.role || (req.user.role === 'admin' ? 'admin' : null),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Add driver/manager to organization
 * @route POST /api/fleet/members
 * @access Private (Org Admin or Admin)
 */
const addMember = async (req, res, next) => {
  try {
    const { organizationId, userEmail, role = 'fleet_driver', dailyKwhLimit = 80 } = req.body;

    const org = await Organization.findById(organizationId);
    if (!org) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    // Verify permission
    const myMembership = await OrganizationMember.findOne({
      organizationId,
      userId: req.user._id,
    });

    if (myMembership?.role !== 'organization_admin' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only organization administrators can invite members',
      });
    }

    const targetUser = await User.findOne({ email: userEmail.toLowerCase().trim() });
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: `User with email ${userEmail} was not found. They must register an EVCharge account first.`,
      });
    }

    const existingMember = await OrganizationMember.findOne({
      organizationId,
      userId: targetUser._id,
    });

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this organization',
      });
    }

    const member = await OrganizationMember.create({
      organizationId,
      userId: targetUser._id,
      role,
      dailyKwhLimit: Number(dailyKwhLimit) || 80,
      status: 'active',
    });

    const populated = await OrganizationMember.findById(member._id).populate(
      'userId',
      'name email phone'
    );

    res.status(201).json({
      success: true,
      message: 'Member added to fleet successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get members of organization
 * @route GET /api/fleet/organizations/:id/members
 * @access Private
 */
const getOrganizationMembers = async (req, res, next) => {
  try {
    const members = await OrganizationMember.find({ organizationId: req.params.id })
      .populate('userId', 'name email phone avatar')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: members,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get fleet charging report for organization
 * @route GET /api/fleet/organizations/:id/reports
 * @access Private
 */
const getFleetReports = async (req, res, next) => {
  try {
    const members = await OrganizationMember.find({ organizationId: req.params.id }).lean();
    const userIds = members.map((m) => m.userId);

    const [bookings, sessions, payments] = await Promise.all([
      Booking.find({ userId: { $in: userIds } })
        .populate('userId', 'name email')
        .populate('stationId', 'name city')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      ChargingSession.find({ userId: { $in: userIds } })
        .populate('userId', 'name email')
        .populate('stationId', 'name city')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      Payment.find({ userId: { $in: userIds }, status: 'paid' })
        .populate('userId', 'name')
        .populate('stationId', 'name')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
    ]);

    let totalSpend = 0;
    let totalKwh = 0;
    payments.forEach((p) => (totalSpend += p.amount || 0));
    sessions.forEach((s) => (totalKwh += s.energyConsumedKwh || 0));

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalSpend: Math.round(totalSpend * 100) / 100,
          totalKwh: Math.round(totalKwh * 10) / 10,
          totalSessions: sessions.length,
          totalBookings: bookings.length,
          activeDriversCount: userIds.length,
        },
        bookings,
        sessions,
        payments,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrganization,
  getMyOrganizations,
  getOrganizationById,
  addMember,
  getOrganizationMembers,
  getFleetReports,
};
