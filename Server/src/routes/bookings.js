// server/src/routes/bookings.js
import { Router } from 'express';
import { db } from '../lib/db.js';

const router = Router();

// ========================================
// GET /api/services - جلب جميع الخدمات
// ========================================
router.get('/services', (req, res, next) => {
  try {
    const services = db.prepare(`
      SELECT id, name, price, minutes, category, description
      FROM services
      ORDER BY category, name ASC
    `).all();

    res.json({ success: true, count: services.length, data: services });
  } catch (err) {
    next(err);
  }
});

// ========================================
// GET /api/professionals - جلب جميع المحترفات
// ========================================
router.get('/professionals', (req, res, next) => {
  try {
    const professionals = db.prepare(`
      SELECT id, name, name_en, specialties, rating, available
      FROM professionals
      ORDER BY specialties, name ASC
    `).all();

    res.json({ success: true, count: professionals.length, data: professionals });
  } catch (err) {
    next(err);
  }
});

// ========================================
// GET /api/bookings - جلب جميع الحجوزات
// ========================================
router.get('/bookings', (req, res, next) => {
  try {
    const bookings = db.prepare(`
      SELECT 
        id, customer_name, contact_method, contact_value,
        date_iso, date_display, time_str, 
        professional_id, professional_name,
        total, status, created_at
      FROM bookings
      WHERE status = 'confirmed'
      ORDER BY created_at DESC
      LIMIT 50
    `).all();

    const data = bookings.map(booking => {
      const items = db.prepare(`
        SELECT id, service_id, service_name, price, minutes, 
               professional_id, professional_name, details
        FROM booking_items
        WHERE booking_id = ?
      `).all(booking.id);

      return {
        id: booking.id,
        customer_name: booking.customer_name,
        contact: { 
          method: booking.contact_method, 
          value: booking.contact_value 
        },
        date_iso: booking.date_iso,
        date_display: booking.date_display,
        time: booking.time_str,
        professional: {
          id: booking.professional_id,
          name: booking.professional_name
        },
        items: items,
        total: booking.total,
        status: booking.status,
        created_at: booking.created_at,
      };
    });

    res.json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
});

// ========================================
// GET /api/available-slots - الأوقات المتاحة
// ========================================
router.get('/available-slots', (req, res, next) => {
  try {
    const { date, professionalId } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'التاريخ مطلوب'
      });
    }

    // كل الأوقات المتاحة في اليوم
    const allSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
      '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
      '18:00', '18:30', '19:00', '19:30', '20:00'
    ];

    // جلب الحجوزات الموجودة
    let query = `
      SELECT DISTINCT time_str
      FROM bookings
      WHERE date_iso = ?
        AND status = 'confirmed'
    `;
    
    const params = [date];

    // لو محددة محترفة معينة
    if (professionalId && professionalId !== '1') {
      query += ` AND professional_id = ?`;
      params.push(professionalId);
    }

    const bookedSlots = db.prepare(query).all(...params);
    const bookedTimes = bookedSlots.map(b => b.time_str);

    // الأوقات المتاحة = كل الأوقات - المحجوزة
    const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));

    res.json({ 
      success: true, 
      date,
      total: allSlots.length,
      available: availableSlots.length,
      booked: bookedTimes.length,
      slots: availableSlots
    });
  } catch (err) {
    next(err);
  }
});

// ========================================
// POST /api/bookings - إنشاء حجز جديد
// ========================================
router.post('/bookings', (req, res, next) => {
  try {
    const payload = req.body ?? {};
    
    // التحقق من البيانات الأساسية
    if (!payload.customer_name?.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: 'الاسم مطلوب' 
      });
    }

    if (!payload.date_iso || !payload.time) {
      return res.status(400).json({ 
        success: false, 
        error: 'التاريخ والوقت مطلوبان' 
      });
    }

    if (!payload.contact?.value?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'يرجى إدخال رقم الجوال أو البريد الإلكتروني'
      });
    }

    const cleanContact = payload.contact.value.trim().replace(/[\s-]/g, '');

    // ربط الجوال بالاسم (قيد واحد مهم)
    const existingCustomer = db.prepare(`
      SELECT DISTINCT customer_name 
      FROM bookings 
      WHERE contact_value = ? 
        AND status = 'confirmed'
      LIMIT 1
    `).get(cleanContact);

    if (existingCustomer) {
      const existingName = existingCustomer.customer_name.toLowerCase().trim();
      const newName = payload.customer_name.toLowerCase().trim();
      
      if (existingName !== newName) {
        return res.status(409).json({
          success: false,
          error: `رقم الجوال مسجل باسم "${existingCustomer.customer_name}". يرجى استخدام نفس الاسم.`
        });
      }
    }

    // منع التكرار البسيط
    const duplicate = db.prepare(`
      SELECT id FROM bookings 
      WHERE contact_value = ? 
        AND date_iso = ? 
        AND time_str = ?
        AND status = 'confirmed'
    `).get(cleanContact, payload.date_iso, payload.time);

    if (duplicate) {
      return res.status(409).json({
        success: false,
        error: 'لديك حجز في نفس الوقت. اختاري وقتاً آخر.'
      });
    }

    // حفظ الحجز
    const insertBooking = db.prepare(`
      INSERT INTO bookings
        (customer_name, contact_method, contact_value, 
         date_iso, date_display, time_str, 
         professional_id, professional_name, total, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const bookingInfo = insertBooking.run(
      payload.customer_name.trim(),
      payload.contact?.method || 'phone',
      cleanContact,
      payload.date_iso,
      payload.date_display || payload.date_iso,
      payload.time,
      payload.professional?.id || null,
      payload.professional?.name || 'أي محترف',
      payload.total || 0,
      'confirmed'
    );

    const bookingId = bookingInfo.lastInsertRowid;

    // حفظ الخدمات
    if (payload.items && Array.isArray(payload.items)) {
      const insertItem = db.prepare(`
        INSERT INTO booking_items
          (booking_id, service_id, service_name, price, minutes,
           professional_id, professional_name, details)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      payload.items.forEach(item => {
        insertItem.run(
          bookingId,
          item.service_id || null,
          item.service_name || item.title || item.name,
          item.price || 0,
          item.minutes || 45,
          item.professional_id || payload.professional?.id || null,
          item.professional_name || payload.professional?.name || null,
          item.details || null
        );
      });
    }

    console.log(`✅ حجز جديد #${bookingId} - ${payload.customer_name} - ${payload.time}`);

    return res.status(201).json({ 
      success: true, 
      id: bookingId,
      message: 'تم الحجز بنجاح' 
    });
  } catch (err) {
    console.error('❌ خطأ في الحجز:', err);
    next(err);
  }
});

// ========================================
// DELETE /api/bookings/:id/items/:itemId - حذف خدمة واحدة
// ========================================
router.delete('/bookings/:id/items/:itemId', (req, res, next) => {
  try {
    const { id, itemId } = req.params;
    
    if (!id || !itemId) {
      return res.status(400).json({
        success: false,
        error: 'معرّف الحجز والخدمة مطلوبان'
      });
    }

    // التحقق من وجود الحجز
    const booking = db.prepare('SELECT id, total, status FROM bookings WHERE id = ?').get(id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'الحجز غير موجود'
      });
    }
    
    // التحقق من حالة الحجز
    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'لا يمكن تعديل حجز ملغي'
      });
    }

    // جلب جميع الخدمات في الحجز
    const items = db.prepare('SELECT * FROM booking_items WHERE booking_id = ?').all(id);
    
    if (items.length <= 1) {
      return res.status(400).json({
        success: false,
        error: 'لا يمكن حذف الخدمة الوحيدة. قومي بإلغاء الحجز بالكامل بدلاً من ذلك.'
      });
    }

    // حذف الخدمة باستخدام ID الحقيقي
    const itemToDelete = db.prepare('SELECT * FROM booking_items WHERE id = ? AND booking_id = ?').get(itemId, id);
    
    if (!itemToDelete) {
      return res.status(404).json({
        success: false,
        error: 'الخدمة غير موجودة'
      });
    }

    // حذف الخدمة
    db.prepare('DELETE FROM booking_items WHERE id = ?').run(itemId);

    // تحديث الإجمالي
    const newTotal = booking.total - (itemToDelete.price || 0);
    db.prepare('UPDATE bookings SET total = ? WHERE id = ?').run(newTotal, id);

    console.log(`🗑️ تم حذف خدمة من الحجز #${id}`);

    res.json({ 
      success: true, 
      message: 'تم حذف الخدمة بنجاح',
      newTotal: newTotal
    });
  } catch (err) {
    console.error('❌ خطأ في حذف الخدمة:', err);
    next(err);
  }
});

// ========================================
// DELETE /api/bookings/:id - إلغاء حجز كامل
// ========================================
router.delete('/bookings/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'معرّف الحجز مطلوب'
      });
    }

    // تحديث حالة الحجز إلى ملغي
    const result = db.prepare(`
      UPDATE bookings 
      SET status = 'cancelled'
      WHERE id = ?
    `).run(id);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'الحجز غير موجود'
      });
    }

    console.log(`🗑️ تم إلغاء الحجز #${id}`);

    res.json({ 
      success: true, 
      message: 'تم إلغاء الحجز بنجاح' 
    });
  } catch (err) {
    console.error('❌ خطأ في إلغاء الحجز:', err);
    next(err);
  }
});

export default router;