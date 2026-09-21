const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const stationRoutes = require('./routes/stationRoutes');
const chargerRoutes = require('./routes/chargerRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const checkInRoutes = require('./routes/checkInRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const reportRoutes = require('./routes/reportRoutes');

// Phase 7 Route Imports
const reviewRoutes = require('./routes/reviewRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const predictionRoutes = require('./routes/predictionRoutes');
const pricingRoutes = require('./routes/pricingRoutes');
const fleetRoutes = require('./routes/fleetRoutes');
const ocppRoutes = require('./routes/ocppRoutes');
const loadManagementRoutes = require('./routes/loadManagementRoutes');

const notFound = require('./middleware/notFoundMiddleware');
const errorHandler = require('./middleware/errorMiddleware');

const app = express();

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// Gzip Compression
app.use(compression());

// General Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 300 : 3000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
});
app.use('/api', limiter);

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'stripe-signature',
    ],
  })
);

// Capture raw body for Stripe signature validation before JSON parsing
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// HTTP request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health Check Handler (Both /health and /api/health)
const healthHandler = (req, res) => {
  res.status(200).json({
    status: 'healthy',
    success: true,
    message: 'EVCharge API is running',
    environment: process.env.NODE_ENV || 'development',
    version: '1.7.0',
    timestamp: new Date().toISOString(),
    featureFlags: {
      maps: process.env.ENABLE_MAPS !== 'false',
      notifications: process.env.ENABLE_NOTIFICATIONS !== 'false',
      reviews: process.env.ENABLE_REVIEWS !== 'false',
      demandPrediction: process.env.ENABLE_DEMAND_PREDICTION !== 'false',
      dynamicPricing: process.env.ENABLE_DYNAMIC_PRICING !== 'false',
      fleet: process.env.ENABLE_FLEET !== 'false',
      ocpp: process.env.ENABLE_OCPP !== 'false',
      loadManagement: process.env.ENABLE_LOAD_MANAGEMENT !== 'false',
    },
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// Core API Routes (Phases 1 - 6)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/chargers', chargerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/check-in', checkInRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin/payments', paymentRoutes);
app.use('/api/admin/revenue', paymentRoutes);
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api/admin/reports', reportRoutes);

// Phase 7 Advanced Feature Routes
app.use('/api', reviewRoutes); // /api/reviews, /api/stations/:stationId/reviews, /api/admin/reviews
app.use('/api/notifications', notificationRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api', predictionRoutes); // /api/stations/:stationId/demand, /api/admin/predictions/demand
app.use('/api', pricingRoutes); // /api/pricing/active, /api/admin/pricing
app.use('/api/pricing', pricingRoutes);
app.use('/api/fleet', fleetRoutes);
app.use('/api/ocpp', ocppRoutes);
app.use('/api/admin/ocpp', ocppRoutes);
app.use('/api', loadManagementRoutes); // /api/stations/:stationId/load, /api/admin/stations/:stationId/load-limit
app.use('/api/admin/load-management', loadManagementRoutes);

// 404 & Error Middlewares
app.use(notFound);
app.use(errorHandler);

module.exports = app;
