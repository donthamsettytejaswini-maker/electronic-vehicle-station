const http = require('http');
const dotenv = require('dotenv');

// Load environment variables before importing modules that rely on them
dotenv.config();

const app = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./socket');
const { initActiveSimulations } = require('./services/chargingSimulationService');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Create HTTP server wrap around Express app
    const server = http.createServer(app);

    // 3. Initialize Socket.IO instance on the HTTP server
    initSocket(server);

    // 4. Start HTTP & WebSocket listener
    server.listen(PORT, async () => {
      console.log(
        `[EVCharge Server] Running in ${
          process.env.NODE_ENV || 'development'
        } mode on http://localhost:${PORT}`
      );
      console.log(
        `[EVCharge WebSocket] Socket.IO server active and listening on port ${PORT}`
      );
      console.log(
        `[EVCharge Health] API Health check available at http://localhost:${PORT}/api/health`
      );

      // 5. Rehydrate existing active simulations
      await initActiveSimulations();
    });
  } catch (error) {
    console.error(`[EVCharge Server Error] Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
