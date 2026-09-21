const { Server } = require('socket.io');

let io = null;

const initSocket = (httpServer) => {
  const allowedOrigins = [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://localhost:3000',
  ];

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          callback(null, true);
        }
      },
      methods: ['GET', 'POST', 'PATCH'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    // Client joins session room
    socket.on('join:session', (sessionId) => {
      if (sessionId) {
        socket.join(`session:${sessionId}`);
      }
    });

    socket.on('leave:session', (sessionId) => {
      if (sessionId) {
        socket.leave(`session:${sessionId}`);
      }
    });

    // Client joins user room
    socket.on('join:user', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
      }
    });

    // Admin joins monitoring room
    socket.on('join:admin', () => {
      socket.join('admin:sessions');
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  return io;
};

const getIO = () => {
  return io;
};

// Helper event emitters
const emitSessionEvent = (event, sessionData) => {
  if (!io) return;
  const sessionId = sessionData._id || sessionData.id;
  const userId = sessionData.userId?._id || sessionData.userId;

  // Emit to specific session room
  if (sessionId) {
    io.to(`session:${sessionId}`).emit(event, sessionData);
  }

  // Emit to user room
  if (userId) {
    io.to(`user:${userId}`).emit(event, sessionData);
  }

  // Emit to admin monitoring room
  io.to('admin:sessions').emit(event, sessionData);
};

const emitChargerStatusUpdate = (chargerId, stationId, status) => {
  if (!io) return;
  io.emit('charger:statusUpdated', { chargerId, stationId, status });
};

const emitBookingStatusUpdate = (bookingId, userId, status) => {
  if (!io) return;
  if (userId) {
    io.to(`user:${userId}`).emit('booking:statusUpdated', { bookingId, status });
  }
  io.to('admin:sessions').emit('booking:statusUpdated', { bookingId, status });
};

module.exports = {
  initSocket,
  getIO,
  emitSessionEvent,
  emitChargerStatusUpdate,
  emitBookingStatusUpdate,
};
