// server/src/app.js
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { initDb } from "./lib/db.js";
import bookingsRouter from './routes/bookings.js';

const app = express();

// للحصول على __dirname في ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS + JSON
const ALLOWED = (process.env.ALLOWED_ORIGINS || "").split(",").filter(Boolean);
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (ALLOWED.length === 0 || ALLOWED.includes(origin)) return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());

// ✅ خدمة ملفات HTML من مجلد frontend
const frontendPath = path.join(__dirname, "../../frontend");
app.use(express.static(frontendPath));

// Health check
app.get("/health", (req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || "dev" });
});

// ✅ تهيئة قاعدة البيانات (إنشاء الجداول)
initDb();

// ✅ استخدام routes للحجوزات والخدمات
app.use('/api', bookingsRouter);

// ✅ الصفحة الرئيسية
app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "home.html"));
});

// معالج الأخطاء
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ success: false, error: err.message });
});

export default app;