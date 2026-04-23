const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const aiRoutes = require('./routes/aiRoutes');
const adminRoutes = require('./routes/adminRoutes');
const officerRoutes = require('./routes/officerRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();


// 🔥 HELMET (important for security)
app.use(helmet({
  crossOriginResourcePolicy: false, // allow images/files
}));


// 🔥 CORS FIX (IMPORTANT PART)
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://smart-police-complaint-assistant-auto-escalation-detjh9onp.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (mobile apps, postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("❌ Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

// 🔥 Handle preflight requests
app.options('*', cors());


// 🔥 BODY PARSER
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));


// 🔥 LOGGER
app.use(morgan('dev'));


// 🔥 STATIC FILES (for uploads/images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// 🔥 ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/officer', officerRoutes);


// 🔥 404 HANDLER
app.use((req, res, next) => {
  const err = new Error(`Route not found: ${req.originalUrl}`);
  err.status = 404;
  next(err);
});


// 🔥 ERROR HANDLER
app.use(errorHandler);


module.exports = app;
