const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const aiRoutes = require('./routes/aiRoutes');
const adminRoutes = require('./routes/adminRoutes');
const officerRoutes = require('./routes/officerRoutes');
const errorHandler = require('./middleware/errorHandler');
const path = require('path');

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '100kb' }));
app.use(morgan('dev'));
// rate limiter
const rateLimiter = require('./middleware/rateLimiter');
app.use(rateLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/officer', officerRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((req, res, next) => {
  const err = new Error(`Route not found: ${req.originalUrl}`);
  err.status = 404;
  next(err);
});

app.use(errorHandler);

module.exports = app;
