const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const path = require("path");

// routes
const authRoutes = require("./routes/authRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const userRoutes = require("./routes/userRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const aiRoutes = require("./routes/aiRoutes");
const adminRoutes = require("./routes/adminRoutes");
const officerRoutes = require("./routes/officerRoutes");

// middleware
const errorHandler = require("./middleware/errorHandler");
const rateLimiter = require("./middleware/rateLimiter");

const app = express();


// ==========================================
// 🔥🔥🔥 CORS FIX (MOST IMPORTANT)
// ==========================================
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // allow all (safe for now)
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  res.header("Access-Control-Allow-Credentials", "true");

  // ✅ handle preflight requests
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// optional cors package (keep for safety)
app.use(cors());


// ==========================================
// 🔐 SECURITY
// ==========================================
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);


// ==========================================
// 📦 MIDDLEWARES
// ==========================================
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));
app.use(rateLimiter);


// ==========================================
// 📁 STATIC FILES
// ==========================================
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// ==========================================
// 🚀 ROUTES
// ==========================================
app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/officer", officerRoutes);


// ==========================================
// ❌ 404 HANDLER
// ==========================================
app.use((req, res, next) => {
  const err = new Error(`Route not found: ${req.originalUrl}`);
  err.status = 404;
  next(err);
});


// ==========================================
// 🧯 ERROR HANDLER
// ==========================================
app.use(errorHandler);


module.exports = app;
