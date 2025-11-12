// Server/seed.js
import { db } from './src/lib/db.js';  // ✅ صحيح

console.log('🌱 بدء إضافة بيانات صالون BONITA TOUCH...\n');

// ========================================
// مسح البيانات القديمة
// ========================================
db.prepare('DELETE FROM booking_items').run();
db.prepare('DELETE FROM bookings').run();
db.prepare('DELETE FROM services').run();
db.prepare('DELETE FROM professionals').run();
console.log('✅ تم مسح البيانات القديمة\n');

// ========================================
// إضافة الخدمات
// ========================================
console.log('📝 إضافة خدمات الصالون...\n');

const services = [
  // قسم الأظافر 💅
  { name: 'بديكير', price: 90, minutes: 40, category: 'أظافر', description: 'تنظيف وعناية بالقدمين' },
  { name: 'مناكير', price: 90, minutes: 30, category: 'أظافر', description: 'تنظيف وعناية باليدين' },
  { name: 'لون أظافر', price: 60, minutes: 18, category: 'أظافر', description: 'وضع لون/تجديد اللون' },
  
  // قسم الشعر 💇‍♀️
  { name: 'استشوار', price: 100, minutes: 35, category: 'شعر', description: 'تجفيف وتصفيف سريع' },
  { name: 'تسريحة', price: 200, minutes: 52, category: 'شعر', description: 'تسريحة مناسبة للمناسبة' },
  
  // قسم الميكب 💄
  { name: 'ميكب ناعم', price: 300, minutes: 45, category: 'ميكب', description: 'لوك خفيف يومي بإطلالة طبيعية' },
  { name: 'ميكب ثقيل', price: 400, minutes: 60, category: 'ميكب', description: 'لوك مناسبات كامل وثابت' },
];

const insertService = db.prepare(
  'INSERT INTO services (name, price, minutes, category, description) VALUES (?, ?, ?, ?, ?)'
);

services.forEach((service, index) => {
  insertService.run(service.name, service.price, service.minutes, service.category, service.description);
  console.log(`   ${index + 1}. ✅ ${service.name} (${service.category}) - ${service.price} ريال - ${service.minutes} دقيقة`);
});

console.log(`\n🎉 تم إضافة ${services.length} خدمة بنجاح!\n`);

// ========================================
// إضافة المحترفات
// ========================================
console.log('👩‍💼 إضافة المحترفات...\n');

const professionals = [
  // عام
  { name: 'أي محترف', name_en: 'Any Specialist', specialties: 'أظافر، شعر، ميكب', rating: null },
  
  // أظافر
  { name: 'جنا', name_en: 'Jana', specialties: 'أظافر', rating: 4.9 },
  { name: 'ليا', name_en: 'Lea', specialties: 'أظافر', rating: 4.4 },
  { name: 'سالي', name_en: 'Sally', specialties: 'أظافر', rating: 4.8 },
  
  // شعر
  { name: 'ريان', name_en: 'Reen', specialties: 'شعر', rating: 4.9 },
  { name: 'جي جي', name_en: 'JaJa', specialties: 'شعر', rating: 5.0 },
  
  // ميكب
  { name: 'كارول', name_en: 'Carol', specialties: 'ميكب', rating: 4.8 },
  { name: 'جوسي', name_en: 'Josie', specialties: 'ميكب', rating: null },
  { name: 'هايرا', name_en: 'Haira', specialties: 'ميكب', rating: 5.0 },
];

const insertProfessional = db.prepare(
  'INSERT INTO professionals (name, name_en, specialties, rating) VALUES (?, ?, ?, ?)'
);

professionals.forEach((prof, index) => {
  insertProfessional.run(prof.name, prof.name_en, prof.specialties, prof.rating);
  const ratingStr = prof.rating ? `⭐ ${prof.rating}` : '⭐ —';
  console.log(`   ${index + 1}. ✅ ${prof.name} | ${prof.name_en} - ${prof.specialties} - ${ratingStr}`);
});

console.log(`\n🎉 تم إضافة ${professionals.length} محترفة بنجاح!\n`);

// ========================================
// إضافة حجز تجريبي (اختياري)
// ========================================
console.log('📅 إضافة حجز تجريبي...\n');

const insertBooking = db.prepare(`
  INSERT INTO bookings 
  (customer_name, contact_method, contact_value, date_iso, date_display, time_str, professional_id, professional_name, total, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const booking = insertBooking.run(
  'نورة أحمد',
  'phone',
  '0501234567',
  '2025-10-15',
  'السبت 11 ربيع الآخر',
  '12:15',
  2,
  'ليا | Lea',
  300,
  'confirmed'
);

const bookingId = booking.lastInsertRowid;

// إضافة تفاصيل الحجز
const insertBookingItem = db.prepare(`
  INSERT INTO booking_items 
  (booking_id, service_id, service_name, price,minutes, professional_id, professional_name)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

insertBookingItem.run(bookingId, 4, 'استشوار', 100, 35, 5, 'ريان | Reen');
insertBookingItem.run(bookingId, 5, 'تسريحة', 200, 52, 5, 'ريان | Reen');

console.log('   ✅ تم إضافة حجز تجريبي لـ نورة أحمد (استشوار + تسريحة)\n');

// ========================================
// عرض ملخص
// ========================================
console.log('═'.repeat(70));
console.log('💅 BONITA TOUCH - النعيم، جدة');
console.log('═'.repeat(70));
console.log('📊 ملخص البيانات:');
console.log('─'.repeat(70));

const servicesCount = db.prepare('SELECT COUNT(*) as count FROM services').get();
console.log(`   📋 الخدمات: ${servicesCount.count}`);

const profsCount = db.prepare('SELECT COUNT(*) as count FROM professionals').get();
console.log(`   👩‍💼 المحترفات: ${profsCount.count}`);

const bookingsCount = db.prepare('SELECT COUNT(*) as count FROM bookings').get();
console.log(`   📅 الحجوزات: ${bookingsCount.count}`);

console.log('─'.repeat(70));

// عرض الخدمات حسب الأقسام
console.log('\n📋 الخدمات حسب الأقسام:\n');

const categories = ['أظافر', 'شعر', 'ميكب'];
categories.forEach(cat => {
  const items = db.prepare('SELECT name, price, minutes FROM services WHERE category = ?').all(cat);
  console.log(`   ${cat === 'أظافر' ? '💅' : cat === 'شعر' ? '💇‍♀️' : '💄'} ${cat}:`);
  items.forEach(item => {
    console.log(`      • ${item.name} - ${item.price} ريال - ${item.minutes} دقيقة`);
  });
  console.log('');
});

console.log('═'.repeat(70));
console.log('\n✅ تم إضافة جميع البيانات بنجاح!');
console.log('💡 الآن يمكنك تشغيل السيرفر بـ: npm run dev\n');

db.close();