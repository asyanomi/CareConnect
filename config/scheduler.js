const cron = require('node-cron');
const db   = require('./db');
const { createNotification } = require('../controllers/notificationController');

const startScheduler = () => {

  // ── JOB 1: Cek appointment besok (berjalan setiap hari pukul 08.00) ──────
  // Sintaks cron '0 8 * * *' dibaca sebagai:
  // menit=0, jam=8, tanggal=*, bulan=*, hari=* (setiap hari pukul 08:00)
  cron.schedule('0 8 * * *', async () => {
    console.log('[Scheduler] Mengecek appointment besok...');

    try {
      // Ambil semua appointment yang dijadwalkan besok
      // dan statusnya masih 'confirmed' (sudah dikonfirmasi dokter)
      const [appointments] = await db.query(`
        SELECT a.id, a.time, a.patient_id,
               u.name AS doctor_name
        FROM appointments a
        JOIN doctors d ON a.doctor_id = d.id
        JOIN users u   ON d.user_id   = u.id
        WHERE a.date   = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
          AND a.status = 'confirmed'
      `);

      // Kirim notifikasi personal ke setiap pasien
      for (const appt of appointments) {
        await createNotification(
          appt.patient_id,
          'Reminder Konsultasi Besok',
          `Anda memiliki jadwal konsultasi dengan ${appt.doctor_name} ` +
          `besok pukul ${appt.time}. Harap hadir tepat waktu.`
        );
      }

      console.log(`[Scheduler] ${appointments.length} reminder konsultasi terkirim.`);

    } catch (error) {
      console.error('[Scheduler] Error cek appointment:', error);
    }
  });

  // ── JOB 2: Reminder catat kesehatan harian (setiap hari pukul 19.00) ─────
  // Mendorong pasien untuk mengisi data health tracker setiap malam
  // sehingga data tren kesehatan mereka tetap lengkap dan akurat
  cron.schedule('0 19 * * *', async () => {
    console.log('[Scheduler] Mengirim reminder health tracker...');

    try {
      // Cari pasien yang belum mencatat data kesehatan hari ini
      const [patients] = await db.query(`
        SELECT u.id, u.name
        FROM users u
        WHERE u.role = 'patient'
          AND u.id NOT IN (
            SELECT DISTINCT user_id
            FROM health_logs
            WHERE log_date = CURDATE()
          )
      `);

      for (const patient of patients) {
        await createNotification(
          patient.id,
          'Jangan Lupa Catat Kesehatanmu!',
          `Hai ${patient.name}, kamu belum mencatat data kesehatan hari ini. ` +
          `Yuk buka Health Tracker dan catat berat badan, tekanan darah, serta kalorimu.`
        );
      }

      console.log(`[Scheduler] ${patients.length} reminder health tracker terkirim.`);

    } catch (error) {
      console.error('[Scheduler] Error reminder health tracker:', error);
    }
  });

  // ── JOB 3: Notifikasi appointment baru ke dokter (setiap 30 menit) ───────
  // Memberitahu dokter jika ada booking baru yang masih 'pending'
  // dan belum mendapat notifikasi (ditandai dengan flag notif_sent)
  cron.schedule('*/30 * * * *', async () => {
    try {
      const [pending] = await db.query(`
        SELECT a.id, a.date, a.time,
               d.user_id AS doctor_user_id,
               u.name    AS patient_name
        FROM appointments a
        JOIN doctors d ON a.doctor_id = d.id
        JOIN users u   ON a.patient_id = u.id
        WHERE a.status = 'pending'
          AND a.created_at >= NOW() - INTERVAL 30 MINUTE
      `);

      for (const appt of pending) {
        await createNotification(
          appt.doctor_user_id,
          '🔔 Booking Baru Masuk',
          `Pasien ${appt.patient_name} mengajukan booking konsultasi ` +
          `pada ${appt.date} pukul ${appt.time}. Segera konfirmasi.`
        );
      }

    } catch (error) {
      console.error('[Scheduler] Error notifikasi booking:', error);
    }
  });

  console.log('[Scheduler] Semua cron job berhasil dijalankan.');
};

module.exports = { startScheduler };