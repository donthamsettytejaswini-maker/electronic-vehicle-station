const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('../models/User');
const ChargingStation = require('../models/ChargingStation');
const Charger = require('../models/Charger');

const moreStations = [
  {
    name: 'ABC EV Station',
    description: 'Prime highway ultra-fast EV charging hub with driver lounge, snack bar, and 24/7 security.',
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
      { chargerNumber: 'ABC-CH-01', connectorType: 'CCS2', chargingSpeed: 'Rapid', powerRating: 60, status: 'available', pricePerKwh: 15.0, description: '60kW DC Dual Gun Supercharger' },
      { chargerNumber: 'ABC-CH-02', connectorType: 'CCS2', chargingSpeed: 'Fast', powerRating: 30, status: 'available', pricePerKwh: 15.0, description: '30kW DC Fast Port' },
      { chargerNumber: 'ABC-CH-03', connectorType: 'Type 2', chargingSpeed: 'Normal', powerRating: 22, status: 'available', pricePerKwh: 13.5, description: '22kW AC Destination Charger' },
      { chargerNumber: 'ABC-CH-04', connectorType: 'CHAdeMO', chargingSpeed: 'Fast', powerRating: 50, status: 'available', pricePerKwh: 15.0, description: '50kW CHAdeMO Fast Bay' },
    ],
  },
  {
    name: 'GreenCharge Hub',
    description: 'Eco-friendly solar-assisted charging facility located conveniently near the Guntur bypass.',
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
      { chargerNumber: 'GCH-01', connectorType: 'CCS2', chargingSpeed: 'Fast', powerRating: 50, status: 'available', pricePerKwh: 14.0, description: '50kW Solar Supported DC Bay' },
      { chargerNumber: 'GCH-02', connectorType: 'Type 2', chargingSpeed: 'Slow', powerRating: 7.4, status: 'available', pricePerKwh: 11.0, description: '7.4kW Slow AC Point' },
      { chargerNumber: 'GCH-03', connectorType: 'GB/T', chargingSpeed: 'Normal', powerRating: 15, status: 'available', pricePerKwh: 13.0, description: '15kW Fleet GB/T Connector' },
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
      { chargerNumber: 'FV-HYD-01', connectorType: 'CCS2', chargingSpeed: 'Rapid', powerRating: 120, status: 'available', pricePerKwh: 18.0, description: '120kW Supercharger Bay 1' },
      { chargerNumber: 'FV-HYD-02', connectorType: 'CCS2', chargingSpeed: 'Rapid', powerRating: 120, status: 'available', pricePerKwh: 18.0, description: '120kW Supercharger Bay 2' },
      { chargerNumber: 'FV-HYD-03', connectorType: 'Type 2', chargingSpeed: 'Fast', powerRating: 22, status: 'available', pricePerKwh: 16.0, description: '22kW Dual AC Port' },
      { chargerNumber: 'FV-HYD-04', connectorType: 'CHAdeMO', chargingSpeed: 'Fast', powerRating: 50, status: 'available', pricePerKwh: 18.0, description: '50kW CHAdeMO Port' },
    ],
  },
  {
    name: 'EcoDrive Plaza Bengaluru',
    description: 'Premier charging facility situated near Indiranagar 100ft road with rapid liquid-cooled chargers.',
    address: '100 Feet Rd, HAL 2nd Stage, Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560038',
    latitude: 12.9716,
    longitude: 77.6412,
    pricePerKwh: 17.5,
    operatingHours: '24 hours',
    phone: '+91 98765 44556',
    facilities: ['Parking', 'Restroom', 'Cafe', 'WiFi', 'Shopping'],
    status: 'active',
    image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=800&q=80',
    averageRating: 4.9,
    totalReviews: 56,
    chargers: [
      { chargerNumber: 'ED-BLR-01', connectorType: 'CCS2', chargingSpeed: 'Rapid', powerRating: 150, status: 'available', pricePerKwh: 17.5, description: '150kW Ultra-Fast Liquid-Cooled Charger' },
      { chargerNumber: 'ED-BLR-02', connectorType: 'CCS2', chargingSpeed: 'Rapid', powerRating: 60, status: 'available', pricePerKwh: 17.5, description: '60kW DC Fast Port' },
      { chargerNumber: 'ED-BLR-03', connectorType: 'Type 2', chargingSpeed: 'Normal', powerRating: 22, status: 'available', pricePerKwh: 14.0, description: '22kW AC Destination Port' },
    ],
  },
  {
    name: 'TechPark Volt Point',
    description: 'Dedicated corporate & commuter fast-charging station located in Electronic City Phase 1.',
    address: 'Hosur Rd, Electronic City Phase 1',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560100',
    latitude: 12.8452,
    longitude: 77.6602,
    pricePerKwh: 16.0,
    operatingHours: '24 hours',
    phone: '+91 98765 55667',
    facilities: ['Parking', 'Security', 'WiFi', 'Restroom'],
    status: 'active',
    image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80',
    averageRating: 4.7,
    totalReviews: 31,
    chargers: [
      { chargerNumber: 'TP-BLR-01', connectorType: 'CCS2', chargingSpeed: 'Fast', powerRating: 60, status: 'available', pricePerKwh: 16.0, description: '60kW Dual DC Unit' },
      { chargerNumber: 'TP-BLR-02', connectorType: 'Type 2', chargingSpeed: 'Fast', powerRating: 22, status: 'available', pricePerKwh: 13.0, description: '22kW Fast AC Station' },
      { chargerNumber: 'TP-BLR-03', connectorType: 'GB/T', chargingSpeed: 'Normal', powerRating: 15, status: 'available', pricePerKwh: 13.0, description: '15kW Fleet Connector' },
    ],
  },
  {
    name: 'Marina Coastal Charge',
    description: 'Scenic charging point along Santhome High Road with premium sea view coffee lounge.',
    address: 'Santhome High Rd, Mylapore',
    city: 'Chennai',
    state: 'Tamil Nadu',
    postalCode: '600004',
    latitude: 13.0334,
    longitude: 80.2785,
    pricePerKwh: 16.5,
    operatingHours: '24 hours',
    phone: '+91 98765 66778',
    facilities: ['Parking', 'Restroom', 'Cafe', 'WiFi', 'Security'],
    status: 'active',
    image: 'https://images.unsplash.com/photo-1558441719-aa34bbe54897?auto=format&fit=crop&w=800&q=80',
    averageRating: 4.8,
    totalReviews: 38,
    chargers: [
      { chargerNumber: 'MC-CHE-01', connectorType: 'CCS2', chargingSpeed: 'Rapid', powerRating: 100, status: 'available', pricePerKwh: 16.5, description: '100kW DC Fast Charger' },
      { chargerNumber: 'MC-CHE-02', connectorType: 'CCS2', chargingSpeed: 'Fast', powerRating: 50, status: 'available', pricePerKwh: 16.5, description: '50kW Dual Gun DC' },
      { chargerNumber: 'MC-CHE-03', connectorType: 'Type 2', chargingSpeed: 'Normal', powerRating: 22, status: 'available', pricePerKwh: 14.0, description: '22kW AC Destination Station' },
    ],
  },
  {
    name: 'OMR Tech Corridor Supercharger',
    description: 'High-throughput charging hub on Old Mahabalipuram Road serving IT professionals and long-distance travelers.',
    address: 'Rajiv Gandhi Salai, Sholinganallur',
    city: 'Chennai',
    state: 'Tamil Nadu',
    postalCode: '600119',
    latitude: 12.9010,
    longitude: 80.2279,
    pricePerKwh: 17.0,
    operatingHours: '24 hours',
    phone: '+91 98765 77889',
    facilities: ['Parking', 'Restroom', 'Cafe', 'WiFi', 'Security'],
    status: 'active',
    image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=800&q=80',
    averageRating: 4.9,
    totalReviews: 45,
    chargers: [
      { chargerNumber: 'OMR-CHE-01', connectorType: 'CCS2', chargingSpeed: 'Rapid', powerRating: 120, status: 'available', pricePerKwh: 17.0, description: '120kW Supercharger Bay 1' },
      { chargerNumber: 'OMR-CHE-02', connectorType: 'CCS2', chargingSpeed: 'Rapid', powerRating: 120, status: 'available', pricePerKwh: 17.0, description: '120kW Supercharger Bay 2' },
      { chargerNumber: 'OMR-CHE-03', connectorType: 'CHAdeMO', chargingSpeed: 'Fast', powerRating: 50, status: 'available', pricePerKwh: 17.0, description: '50kW CHAdeMO Port' },
    ],
  },
  {
    name: 'BKC Express Volt Station',
    description: 'Flagship financial district EV charging center in Bandra Kurla Complex with ultra-rapid stations.',
    address: 'G Block, Bandra Kurla Complex, Bandra East',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400051',
    latitude: 19.0657,
    longitude: 72.8687,
    pricePerKwh: 19.5,
    operatingHours: '24 hours',
    phone: '+91 98765 88990',
    facilities: ['Parking', 'Restroom', 'Cafe', 'WiFi', 'Security', 'Valet'],
    status: 'active',
    image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80',
    averageRating: 5.0,
    totalReviews: 68,
    chargers: [
      { chargerNumber: 'BKC-MUM-01', connectorType: 'CCS2', chargingSpeed: 'Rapid', powerRating: 180, status: 'available', pricePerKwh: 19.5, description: '180kW Hypercharger Port 1' },
      { chargerNumber: 'BKC-MUM-02', connectorType: 'CCS2', chargingSpeed: 'Rapid', powerRating: 180, status: 'available', pricePerKwh: 19.5, description: '180kW Hypercharger Port 2' },
      { chargerNumber: 'BKC-MUM-03', connectorType: 'Type 2', chargingSpeed: 'Fast', powerRating: 22, status: 'available', pricePerKwh: 16.0, description: '22kW Executive AC Charger' },
      { chargerNumber: 'BKC-MUM-04', connectorType: 'CHAdeMO', chargingSpeed: 'Fast', powerRating: 60, status: 'available', pricePerKwh: 19.0, description: '60kW CHAdeMO Station' },
    ],
  },
  {
    name: 'Seawoods Grand Charge Point',
    description: 'Convenient shopping mall parking charging bays located in Seawoods Grand Central.',
    address: 'Sector 40, Seawoods Railway Station, Navi Mumbai',
    city: 'Navi Mumbai',
    state: 'Maharashtra',
    postalCode: '400706',
    latitude: 19.0180,
    longitude: 73.0186,
    pricePerKwh: 16.0,
    operatingHours: '7:00 AM - 11:30 PM',
    phone: '+91 98765 99001',
    facilities: ['Parking', 'Shopping', 'Restroom', 'Dining', 'Security'],
    status: 'active',
    image: 'https://images.unsplash.com/photo-1558441719-aa34bbe54897?auto=format&fit=crop&w=800&q=80',
    averageRating: 4.6,
    totalReviews: 29,
    chargers: [
      { chargerNumber: 'SGC-NMU-01', connectorType: 'CCS2', chargingSpeed: 'Fast', powerRating: 60, status: 'available', pricePerKwh: 16.0, description: '60kW Fast DC Port' },
      { chargerNumber: 'SGC-NMU-02', connectorType: 'Type 2', chargingSpeed: 'Normal', powerRating: 22, status: 'available', pricePerKwh: 13.5, description: '22kW Mall Destination Charger' },
    ],
  },
  {
    name: 'Connaught Supercharge Terminal',
    description: 'Central Delhi premium EV charging facility located in Connaught Place Outer Circle.',
    address: 'Outer Circle, Connaught Place',
    city: 'New Delhi',
    state: 'Delhi',
    postalCode: '110001',
    latitude: 28.6315,
    longitude: 77.2167,
    pricePerKwh: 18.5,
    operatingHours: '24 hours',
    phone: '+91 98765 00112',
    facilities: ['Parking', 'Restroom', 'WiFi', 'Dining', 'Security'],
    status: 'active',
    image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=800&q=80',
    averageRating: 4.8,
    totalReviews: 52,
    chargers: [
      { chargerNumber: 'CP-DEL-01', connectorType: 'CCS2', chargingSpeed: 'Rapid', powerRating: 120, status: 'available', pricePerKwh: 18.5, description: '120kW Fast DC Unit' },
      { chargerNumber: 'CP-DEL-02', connectorType: 'CCS2', chargingSpeed: 'Fast', powerRating: 60, status: 'available', pricePerKwh: 18.5, description: '60kW Dual Gun Port' },
      { chargerNumber: 'CP-DEL-03', connectorType: 'Type 2', chargingSpeed: 'Fast', powerRating: 22, status: 'available', pricePerKwh: 15.0, description: '22kW Type 2 AC Point' },
    ],
  },
  {
    name: 'CyberCity FastVolt Gurgaon',
    description: 'Corporate hub mega-charging park in DLF Cyber City with high capacity 150kW stalls.',
    address: 'DLF Phase 2, Sector 24, Gurugram',
    city: 'Gurugram',
    state: 'Haryana',
    postalCode: '122002',
    latitude: 28.4950,
    longitude: 77.0895,
    pricePerKwh: 18.0,
    operatingHours: '24 hours',
    phone: '+91 98765 11335',
    facilities: ['Parking', 'Restroom', 'Cafe', 'WiFi', 'Security'],
    status: 'active',
    image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80',
    averageRating: 4.9,
    totalReviews: 61,
    chargers: [
      { chargerNumber: 'CC-GGN-01', connectorType: 'CCS2', chargingSpeed: 'Rapid', powerRating: 150, status: 'available', pricePerKwh: 18.0, description: '150kW Supercharger Stall 1' },
      { chargerNumber: 'CC-GGN-02', connectorType: 'CCS2', chargingSpeed: 'Rapid', powerRating: 150, status: 'available', pricePerKwh: 18.0, description: '150kW Supercharger Stall 2' },
      { chargerNumber: 'CC-GGN-03', connectorType: 'Type 2', chargingSpeed: 'Normal', powerRating: 22, status: 'available', pricePerKwh: 15.0, description: '22kW AC Destination Bay' },
    ],
  },
  {
    name: 'Beach Road Volt Vizag',
    description: 'Breathtaking coastal EV destination charger on Ramakrishna Beach Road.',
    address: 'RK Beach Rd, Pandurangapuram',
    city: 'Visakhapatnam',
    state: 'Andhra Pradesh',
    postalCode: '530003',
    latitude: 17.7126,
    longitude: 83.3187,
    pricePerKwh: 14.5,
    operatingHours: '24 hours',
    phone: '+91 98765 22446',
    facilities: ['Parking', 'Restroom', 'Cafe', 'WiFi'],
    status: 'active',
    image: 'https://images.unsplash.com/photo-1558441719-aa34bbe54897?auto=format&fit=crop&w=800&q=80',
    averageRating: 4.7,
    totalReviews: 27,
    chargers: [
      { chargerNumber: 'BR-VZG-01', connectorType: 'CCS2', chargingSpeed: 'Rapid', powerRating: 60, status: 'available', pricePerKwh: 14.5, description: '60kW Coastal Supercharger' },
      { chargerNumber: 'BR-VZG-02', connectorType: 'Type 2', chargingSpeed: 'Normal', powerRating: 22, status: 'available', pricePerKwh: 12.5, description: '22kW AC Scenic Port' },
      { chargerNumber: 'BR-VZG-03', connectorType: 'GB/T', chargingSpeed: 'Normal', powerRating: 15, status: 'available', pricePerKwh: 12.5, description: '15kW Fleet Socket' },
    ],
  },
  {
    name: 'Kochi Marine Drive Hub',
    description: 'Express charging bays next to Marine Drive Promenade with fast turnaround.',
    address: 'Shanmugham Rd, Marine Drive',
    city: 'Kochi',
    state: 'Kerala',
    postalCode: '682031',
    latitude: 9.9796,
    longitude: 76.2755,
    pricePerKwh: 15.5,
    operatingHours: '24 hours',
    phone: '+91 98765 33557',
    facilities: ['Parking', 'Restroom', 'Cafe', 'Security'],
    status: 'active',
    image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=800&q=80',
    averageRating: 4.8,
    totalReviews: 33,
    chargers: [
      { chargerNumber: 'MD-KOC-01', connectorType: 'CCS2', chargingSpeed: 'Rapid', powerRating: 60, status: 'available', pricePerKwh: 15.5, description: '60kW Rapid Port' },
      { chargerNumber: 'MD-KOC-02', connectorType: 'Type 2', chargingSpeed: 'Normal', powerRating: 22, status: 'available', pricePerKwh: 13.0, description: '22kW Destination Port' },
    ],
  },
  {
    name: 'Koregaon Park Volt Hub Pune',
    description: 'Trendy lifestyle EV charging destination in Koregaon Park with artisan cafes and fast DC charging.',
    address: 'North Main Rd, Koregaon Park',
    city: 'Pune',
    state: 'Maharashtra',
    postalCode: '411001',
    latitude: 18.5362,
    longitude: 73.8958,
    pricePerKwh: 16.5,
    operatingHours: '24 hours',
    phone: '+91 98765 44668',
    facilities: ['Parking', 'Restroom', 'Cafe', 'WiFi', 'Security'],
    status: 'active',
    image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80',
    averageRating: 4.9,
    totalReviews: 48,
    chargers: [
      { chargerNumber: 'KP-PUN-01', connectorType: 'CCS2', chargingSpeed: 'Rapid', powerRating: 120, status: 'available', pricePerKwh: 16.5, description: '120kW Supercharger Bay' },
      { chargerNumber: 'KP-PUN-02', connectorType: 'CCS2', chargingSpeed: 'Fast', powerRating: 60, status: 'available', pricePerKwh: 16.5, description: '60kW Dual Gun Station' },
      { chargerNumber: 'KP-PUN-03', connectorType: 'Type 2', chargingSpeed: 'Fast', powerRating: 22, status: 'available', pricePerKwh: 14.0, description: '22kW Fast AC Port' },
    ],
  },
];

const runSeed = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/evcharge');
    console.log('[Seed] MongoDB connected.');

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

    console.log(`[Seed] Seeding ${moreStations.length} EV charging stations...`);

    for (const stData of moreStations) {
      const { chargers, ...stationInfo } = stData;

      let station = await ChargingStation.findOne({ name: stationInfo.name, city: stationInfo.city });
      if (!station) {
        station = await ChargingStation.create({
          ...stationInfo,
          createdBy: admin._id,
        });
        console.log(`[+] Created Station: "${station.name}" (${station.city})`);
      } else {
        // Update station info
        Object.assign(station, stationInfo);
        await station.save();
        console.log(`[*] Updated Station: "${station.name}" (${station.city})`);
      }

      for (const chData of chargers) {
        let existingCharger = await Charger.findOne({
          stationId: station._id,
          chargerNumber: chData.chargerNumber,
        });

        if (!existingCharger) {
          await Charger.create({
            ...chData,
            stationId: station._id,
          });
          console.log(`   -> Added Charger: ${chData.chargerNumber} (${chData.powerRating}kW ${chData.connectorType})`);
        } else {
          Object.assign(existingCharger, chData);
          await existingCharger.save();
        }
      }
    }

    const totalStations = await ChargingStation.countDocuments();
    const totalChargers = await Charger.countDocuments();
    console.log(`[Seed Success] Total Stations in DB: ${totalStations}, Total Chargers: ${totalChargers}`);
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]', err);
    process.exit(1);
  }
};

runSeed();
