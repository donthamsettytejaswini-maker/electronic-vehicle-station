const ChargingStation = require('../models/ChargingStation');
const Charger = require('../models/Charger');

// Helper to compute charger statistics for stations
const getStationChargerStats = async (stationIds) => {
  const stats = await Charger.aggregate([
    {
      $match: {
        stationId: { $in: stationIds },
      },
    },
    {
      $group: {
        _id: '$stationId',
        totalChargers: { $sum: 1 },
        availableChargers: {
          $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] },
        },
        chargingChargers: {
          $sum: { $cond: [{ $eq: ['$status', 'charging'] }, 1, 0] },
        },
        reservedChargers: {
          $sum: { $cond: [{ $eq: ['$status', 'reserved'] }, 1, 0] },
        },
        maintenanceChargers: {
          $sum: { $cond: [{ $eq: ['$status', 'maintenance'] }, 1, 0] },
        },
        offlineChargers: {
          $sum: { $cond: [{ $eq: ['$status', 'offline'] }, 1, 0] },
        },
      },
    },
  ]);

  const statsMap = {};
  stats.forEach((item) => {
    statsMap[item._id.toString()] = {
      total: item.totalChargers,
      available: item.availableChargers,
      charging: item.chargingChargers,
      reserved: item.reservedChargers,
      maintenance: item.maintenanceChargers,
      offline: item.offlineChargers,
    };
  });

  return statsMap;
};

// @desc    Get all charging stations with filtering, search, pagination, and charger counts
// @route   GET /api/stations
// @access  Public (or authenticated)
const getStations = async (req, res, next) => {
  try {
    const {
      search,
      city,
      status,
      connectorType,
      chargingSpeed,
      minPrice,
      maxPrice,
      hasAvailable,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    // For non-admin or unauthenticated requests, default to active stations only
    const isAdmin = req.user && req.user.role === 'admin';
    if (status) {
      if (isAdmin) {
        if (status !== 'all') {
          query.status = status;
        }
      } else {
        query.status = status === 'active' ? 'active' : 'active';
      }
    } else if (!isAdmin) {
      query.status = 'active';
    }

    // City filter
    if (city && city.trim()) {
      query.city = { $regex: new RegExp(city.trim(), 'i') };
    }

    // Text search on name, address, or city
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { address: searchRegex },
        { city: searchRegex },
        { state: searchRegex },
      ];
    }

    // Price range filtering
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.pricePerKwh = {};
      if (minPrice !== undefined && !isNaN(minPrice)) {
        query.pricePerKwh.$gte = Number(minPrice);
      }
      if (maxPrice !== undefined && !isNaN(maxPrice)) {
        query.pricePerKwh.$lte = Number(maxPrice);
      }
    }

    // If filtering by connectorType or chargingSpeed, find station IDs with matching chargers
    if (connectorType || chargingSpeed || hasAvailable === 'true') {
      const chargerMatch = {};
      if (connectorType) chargerMatch.connectorType = connectorType;
      if (chargingSpeed) chargerMatch.chargingSpeed = chargingSpeed;
      if (hasAvailable === 'true') chargerMatch.status = 'available';

      const matchingStationIds = await Charger.distinct('stationId', chargerMatch);
      query._id = { $in: matchingStationIds };
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const total = await ChargingStation.countDocuments(query);
    const stations = await ChargingStation.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .populate('createdBy', 'name email');

    // Aggregate charger counts for the retrieved stations
    const stationIds = stations.map((s) => s._id);
    const statsMap = await getStationChargerStats(stationIds);

    const enrichedStations = stations.map((station) => {
      const sObj = station.toObject();
      const stStats = statsMap[station._id.toString()] || {
        total: 0,
        available: 0,
        charging: 0,
        reserved: 0,
        maintenance: 0,
        offline: 0,
      };
      return {
        ...sObj,
        totalChargers: stStats.total,
        availableChargers: stStats.available,
        chargingChargers: stStats.charging,
        maintenanceChargers: stStats.maintenance,
        chargerStats: stStats,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        items: enrichedStations,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single charging station with its chargers and stats
// @route   GET /api/stations/:id
// @access  Public (or authenticated)
const getStationById = async (req, res, next) => {
  try {
    const station = await ChargingStation.findById(req.params.id).populate(
      'createdBy',
      'name email'
    );

    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Charging station not found',
      });
    }

    const chargers = await Charger.find({ stationId: station._id }).sort({
      chargerNumber: 1,
    });

    const statsMap = await getStationChargerStats([station._id]);
    const stStats = statsMap[station._id.toString()] || {
      total: chargers.length,
      available: chargers.filter((c) => c.status === 'available').length,
      charging: chargers.filter((c) => c.status === 'charging').length,
      reserved: chargers.filter((c) => c.status === 'reserved').length,
      maintenance: chargers.filter((c) => c.status === 'maintenance').length,
      offline: chargers.filter((c) => c.status === 'offline').length,
    };

    res.status(200).json({
      success: true,
      data: {
        station: {
          ...station.toObject(),
          totalChargers: stStats.total,
          availableChargers: stStats.available,
          chargingChargers: stStats.charging,
          maintenanceChargers: stStats.maintenance,
          chargerStats: stStats,
        },
        chargers,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new charging station
// @route   POST /api/stations
// @access  Private (Admin Only)
const createStation = async (req, res, next) => {
  try {
    const {
      name,
      description,
      address,
      city,
      state,
      postalCode,
      latitude,
      longitude,
      pricePerKwh,
      operatingHours,
      phone,
      facilities,
      status,
      image,
    } = req.body;

    const station = await ChargingStation.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      address: address.trim(),
      city: city.trim(),
      state: state ? state.trim() : '',
      postalCode: postalCode ? postalCode.trim() : '',
      latitude: Number(latitude),
      longitude: Number(longitude),
      pricePerKwh: Number(pricePerKwh),
      operatingHours: operatingHours ? operatingHours.trim() : '24 hours',
      phone: phone ? phone.trim() : '',
      facilities: Array.isArray(facilities) ? facilities : ['Parking'],
      status: status || 'active',
      image: image ? image.trim() : '',
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Charging station created successfully',
      data: { station },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a charging station
// @route   PUT /api/stations/:id
// @access  Private (Admin Only)
const updateStation = async (req, res, next) => {
  try {
    const station = await ChargingStation.findById(req.params.id);

    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Charging station not found',
      });
    }

    const {
      name,
      description,
      address,
      city,
      state,
      postalCode,
      latitude,
      longitude,
      pricePerKwh,
      operatingHours,
      phone,
      facilities,
      status,
      image,
    } = req.body;

    if (name !== undefined) station.name = name.trim();
    if (description !== undefined) station.description = description.trim();
    if (address !== undefined) station.address = address.trim();
    if (city !== undefined) station.city = city.trim();
    if (state !== undefined) station.state = state.trim();
    if (postalCode !== undefined) station.postalCode = postalCode.trim();
    if (latitude !== undefined) station.latitude = Number(latitude);
    if (longitude !== undefined) station.longitude = Number(longitude);
    if (pricePerKwh !== undefined) station.pricePerKwh = Number(pricePerKwh);
    if (operatingHours !== undefined) station.operatingHours = operatingHours.trim();
    if (phone !== undefined) station.phone = phone.trim();
    if (facilities !== undefined) station.facilities = Array.isArray(facilities) ? facilities : station.facilities;
    if (status !== undefined) station.status = status;
    if (image !== undefined) station.image = image.trim();

    const updatedStation = await station.save();

    res.status(200).json({
      success: true,
      message: 'Charging station updated successfully',
      data: { station: updatedStation },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a charging station (strictly rejects if chargers exist)
// @route   DELETE /api/stations/:id
// @access  Private (Admin Only)
const deleteStation = async (req, res, next) => {
  try {
    const station = await ChargingStation.findById(req.params.id);

    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Charging station not found',
      });
    }

    // Check whether chargers exist for this station
    const chargerCount = await Charger.countDocuments({ stationId: station._id });
    if (chargerCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete station with ${chargerCount} existing charger(s). Please delete all chargers before removing the station.`,
        errors: [{ field: 'chargers', message: 'Station has active charger records' }],
      });
    }

    await station.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Charging station deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update station activation status
// @route   PATCH /api/stations/:id/status
// @access  Private (Admin Only)
const updateStationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive', 'maintenance'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value. Must be active, inactive, or maintenance',
      });
    }

    const station = await ChargingStation.findById(req.params.id);
    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Charging station not found',
      });
    }

    station.status = status;
    await station.save();

    res.status(200).json({
      success: true,
      message: `Station status updated to ${status}`,
      data: { station },
    });
  } catch (error) {
    next(error);
  }
};

const { calculateDistanceKm } = require('../utils/geoUtils');

// @desc    Get stations nearby user coordinates within radius
// @route   GET /api/stations/nearby
// @access  Public
const getNearbyStations = async (req, res, next) => {
  try {
    const { latitude, longitude, radiusKm = 25, status = 'active' } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and Longitude query parameters are required',
      });
    }

    const userLat = Number(latitude);
    const userLon = Number(longitude);
    const radius = Number(radiusKm) || 25;

    const query = {};
    if (status !== 'all') {
      query.status = status;
    }

    const stations = await ChargingStation.find(query).lean();
    const stationIds = stations.map((s) => s._id);
    const statsMap = await getStationChargerStats(stationIds);

    // Get charger details (connectors, speeds)
    const chargers = await Charger.find({ stationId: { $in: stationIds } }).lean();
    const chargerInfoMap = {};
    chargers.forEach((c) => {
      const sid = c.stationId.toString();
      if (!chargerInfoMap[sid]) {
        chargerInfoMap[sid] = {
          connectorTypes: new Set(),
          chargingSpeeds: new Set(),
          maxPower: 0,
        };
      }
      chargerInfoMap[sid].connectorTypes.add(c.connectorType);
      chargerInfoMap[sid].chargingSpeeds.add(c.chargingSpeed);
      if (c.powerRating > chargerInfoMap[sid].maxPower) {
        chargerInfoMap[sid].maxPower = c.powerRating;
      }
    });

    const nearby = [];

    stations.forEach((st) => {
      if (st.latitude && st.longitude) {
        const dist = calculateDistanceKm(userLat, userLon, st.latitude, st.longitude);
        if (dist <= radius) {
          const stStats = statsMap[st._id.toString()] || {
            total: 0,
            available: 0,
            charging: 0,
            reserved: 0,
            maintenance: 0,
            offline: 0,
          };
          const cInfo = chargerInfoMap[st._id.toString()] || {
            connectorTypes: new Set(),
            chargingSpeeds: new Set(),
            maxPower: 0,
          };

          nearby.push({
            ...st,
            distanceKm: dist,
            totalChargers: stStats.total,
            availableChargers: stStats.available,
            chargingChargers: stStats.charging,
            maintenanceChargers: stStats.maintenance,
            connectorTypes: Array.from(cInfo.connectorTypes),
            chargingSpeeds: Array.from(cInfo.chargingSpeeds),
            maxPowerRating: cInfo.maxPower,
          });
        }
      }
    });

    nearby.sort((a, b) => a.distanceKm - b.distanceKm);

    res.status(200).json({
      success: true,
      data: {
        count: nearby.length,
        radiusKm: radius,
        userLocation: { latitude: userLat, longitude: userLon },
        stations: nearby,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStations,
  getStationById,
  createStation,
  updateStation,
  deleteStation,
  updateStationStatus,
  getNearbyStations,
};
