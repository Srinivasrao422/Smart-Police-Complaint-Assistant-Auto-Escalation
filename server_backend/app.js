const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');

// Routes
const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const aiRoutes = require('./routes/aiRoutes');
const adminRoutes = require('./routes/adminRoutes');
const officerRoutes = require('./routes/officerRoutes');

// Middleware
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');

const app = express();


// ============================================
// 🔐 SECURITY (HELMET)
// ============================================
app.use(helmet({
  crossOriginResourcePolicy: false, // allow images/uploads
}));


// ============================================
// 🌐 CORS CONFIG (IMPORTANT)
// ============================================
const allowedOrigins = [
  "http://localhost:5173", // local frontend
  "https://your-vercel-app.vercel.app" // 🔥 replace with your real Vercel URL
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow Postman / mobile apps

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
}));


// ============================================
// 📦 BODY PARSER
// ============================================
app.use(express.json({ limit: '100kb' }));


// ============================================
// 📊 LOGGER
// ============================================
app.use(morgan('dev'));


// ============================================
// 🚦 RATE LIMITER
// ============================================
app.use(rateLimiter);


// ============================================
// 📂 STATIC FILES (UPLOADS)
// ============================================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// ============================================
// 🔗 API ROUTES
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/officer', officerRoutes);


// ============================================
// ❌ 404 HANDLER
// ============================================
app.use((req, res, next) => {
  const err = new Error(`Route not found: ${req.originalUrl}`);
  err.status = 404;
  next(err);
});


// ============================================
// ⚠️ GLOBAL ERROR HANDLER
// ============================================
app.use(errorHandler);


// ============================================
// 📤 EXPORT APP
// ============================================
module.exports = app;
