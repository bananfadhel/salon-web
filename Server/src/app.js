// server/src/app.js
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { initDb } from "./lib/db.js";
import bookingsRouter from './routes/bookings.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ========================================
// Middleware
// ========================================

// CORS - للتطوير والإنتاج
const ALLOWED = (process.env.ALLOWED_ORIGINS || "").split(",").filter(Boolean);
app.use(
  cors({
    origin: (origin, cb) => {
      // السماح للطلبات بدون origin (مثل Postman)
      if (!origin) return cb(null, true);
      // إذا ما في قائمة محددة، اسمحي للكل
      if (ALLOWED.length === 0) return cb(null, true);
      // إذا في قائمة، تحققي
      if (ALLOWED.includes(origin)) return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());

// Request Logger (اختياري - يساعد في التتبع)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ========================================
// Static Files
// ========================================

const frontendPath = path.join(__dirname, "../../frontend");
app.use(express.static(frontendPath));

// ========================================
// Database
// ========================================

initDb();

// ========================================
// Routes
// ========================================

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    ok: true, 
    env: process.env.NODE_ENV || "dev",
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api', bookingsRouter);

// الصفحة الرئيسية
app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "home.html"));
});

// ========================================
// Error Handlers
// ========================================

// 404
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: "الصفحة غير موجودة" 
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  res.status(err.statusCode || 500).json({ 
    success: false, 
    error: err.message || "حدث خطأ في السيرفر" 
  });
});

export default app;