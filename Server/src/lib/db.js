// server/src/lib/db.js
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// نحفظ قاعدة البيانات في ملف داخل مجلد server
const DB_PATH = path.join(__dirname, '..', '..', 'salon.db');

// إنشاء اتصال بقاعدة البيانات
export const db = new Database(DB_PATH);

// إنشاء الجداول عند أول تشغيل
export function initDb() {
  // جدول الخدمات
  db.exec(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price INTEGER NOT NULL DEFAULT 0,
      minutes INTEGER NOT NULL DEFAULT 45,
      description TEXT,
      category TEXT
    )
  `);

  // جدول المحترفين/الموظفين
  db.exec(`
    CREATE TABLE IF NOT EXISTS professionals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      name_en TEXT,
      specialties TEXT NOT NULL,
      image TEXT,
      rating REAL DEFAULT 5.0,
      available INTEGER DEFAULT 1
    )
  `);

  // جدول الحجوزات
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      contact_method TEXT,
      contact_value TEXT,
      date_iso TEXT NOT NULL,
      date_display TEXT,
      time_str TEXT NOT NULL,
      professional_id INTEGER,
      professional_name TEXT,
      total INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'confirmed',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (professional_id) REFERENCES professionals(id)
    )
  `);

  // جدول عناصر الحجز (الخدمات المختارة)
  db.exec(`
    CREATE TABLE IF NOT EXISTS booking_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      service_id INTEGER,
      service_name TEXT NOT NULL,
      price INTEGER NOT NULL DEFAULT 0,
      minutes INTEGER NOT NULL DEFAULT 45,
      professional_id INTEGER,
      professional_name TEXT,
      details TEXT,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
      FOREIGN KEY (service_id) REFERENCES services(id),
      FOREIGN KEY (professional_id) REFERENCES professionals(id)
    )
  `);

  console.log('✅ تم إنشاء الجداول بنجاح');
}

// إغلاق قاعدة البيانات عند إيقاف التطبيق
process.on('exit', () => db.close());
process.on('SIGHUP', () => process.exit(128 + 1));
process.on('SIGINT', () => process.exit(128 + 2));
process.on('SIGTERM', () => process.exit(128 + 15));