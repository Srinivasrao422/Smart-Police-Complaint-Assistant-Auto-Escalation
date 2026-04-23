require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const app = require('./app');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

global.io = io;

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (payload) => {
    const userId = typeof payload === 'string' ? payload : payload?.userId;
    const role = typeof payload === 'object' ? payload?.role : undefined;

    if (userId) {
      socket.join(userId);
    }

    if (role === 'admin' || role === 'super-admin') {
      socket.join('admins');
    }
  });

  socket.on('join-complaint', (complaintId) => {
    if (complaintId) {
      socket.join(`complaint:${complaintId}`);
    }
  });

  socket.on('message', (payload) => {
    if (!payload?.complaint) return;
    io.to('admins').emit('message', payload);
    io.to(`complaint:${payload.complaint}`).emit('message', payload);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

connectDB()
  .then(() => {
    // initialize default admin if configured
    const initAdmin = require('./utils/initAdmin');
    const initOfficers = require('./utils/initOfficers');
    initAdmin()
      .then(() => {
        return initOfficers();
      })
      .then(() => {
        server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
      })
      .catch((err) => {
        console.error('Admin init failed', err);
        process.exit(1);
      });
  })
  .catch((err) => {
    console.error('Failed to start server', err);
    process.exit(1);
  });
