// Server/src/lib/db.js
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// مسار قاعدة البيانات
const DB_PATH = path.resolve(__dirname, '../../salon.db');

console.log('📊 Database path:', DB_PATH);

// إنشاء اتصال بقاعدة البيانات
export const db = new Database(DB_PATH);

// تفعيل Foreign Keys
db.pragma('foreign_keys = ON');

// إنشاء الجداول
export function initDb() {
  console.log('📊 جاري إنشاء قاعدة البيانات...');

  // جدول الخدمات
  db.exec(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price INTEGER NOT NULL DEFAULT 0,
      minutes INTEGER NOT NULL DEFAULT 45,
      description TEXT,
      category TEXT NOT NULL
    )
  `);

  // جدول المحترفات
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
      contact_value TEXT NOT NULL,
      date_iso TEXT NOT NULL,
      date_display TEXT,
      time_str TEXT NOT NULL,
      professional_id INTEGER,
      professional_name TEXT,
      service_name TEXT,
      service_price INTEGER,
      total INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'confirmed',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (professional_id) REFERENCES professionals(id)
    )
  `);

  // إضافة الأعمدة الجديدة إذا لم تكن موجودة
  try {
    db.exec(`ALTER TABLE bookings ADD COLUMN service_name TEXT;`);
  } catch (e) {
    // العمود موجود بالفعل
  }
  try {
    db.exec(`ALTER TABLE bookings ADD COLUMN service_price INTEGER;`);
  } catch (e) {
    // العمود موجود بالفعل
  }

  // جدول عناصر الحجز
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

// إغلاق قاعدة البيانات
const closeDb = () => {
  console.log('🔒 جاري إغلاق قاعدة البيانات...');
  db.close();
};

process.on('exit', closeDb);
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));