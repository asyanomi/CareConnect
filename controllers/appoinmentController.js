const db = require('../config/db');

// === PASIEN: Buat booking baru ===
const createAppointment = async (req, res) => {
  const { doctor_id, date, time, notes } = req.body;
  const patient_id = req.user.id;

  if (!doctor_id || !date || !time) {
    return res.status(400).json({ message: 'Doctor ID, tanggal, dan jam wajib diisi.' });
  }

  try {
    // Cek apakah dokter tersebut ada
    const [doctor] = await db.query('SELECT id FROM doctors WHERE id = ?', [doctor_id]);
    if (doctor.length === 0) {
      return res.status(404).json({ message: 'Dokter tidak ditemukan.' });
    }

    // Cek apakah slot tanggal dan jam sudah dipesan
    const [conflict] = await db.query(
      `SELECT id FROM appointments 
       WHERE doctor_id = ? AND date = ? AND time = ? 
       AND status NOT IN ('cancelled')`,
      [doctor_id, date, time]
    );
    if (conflict.length > 0) {
      return res.status(409).json({ message: 'Slot waktu ini sudah dipesan. Pilih waktu lain.' });
    }

    await db.query(
      'INSERT INTO appointments (patient_id, doctor_id, date, time, notes) VALUES (?, ?, ?, ?, ?)',
      [patient_id, doctor_id, date, time, notes]
    );
    // Ambil user_id dokter
const [doctorUser] = await db.query(
    "SELECT user_id FROM doctors WHERE id = ?",
    [doctor_id]
);

// Ambil nama pasien
const [patient] = await db.query(
    "SELECT name FROM users WHERE id = ?",
    [patient_id]
);

// Simpan notifikasi
await db.query(
`
INSERT INTO notifications
(user_id,title,message,is_read)
VALUES (?,?,?,0)
`,
[
    doctorUser[0].user_id,
    "Booking Baru",
    `${patient[0].name} melakukan booking pada ${date} pukul ${time}`
]);

    res.status(201).json({ message: 'Booking berhasil! Menunggu konfirmasi dokter.' });

  } catch (error) {
    console.error('Error createAppointment:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

// === PASIEN: Lihat riwayat booking milik sendiri ===
const getMyAppointments = async (req, res) => {
  const patient_id = req.user.id;

  try {
    const [rows] = await db.query(`
      SELECT a.id, u.name AS doctor_name, d.specialization,
             a.date, a.time, a.status, a.notes
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      WHERE a.patient_id = ?
      ORDER BY a.date DESC, a.time DESC
    `, [patient_id]);

    res.status(200).json({ appointments: rows });

  } catch (error) {
    console.error('Error getMyAppointments:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

// === DOKTER: Lihat semua booking yang masuk untuk dokter ini ===
const getDoctorAppointments = async (req,res)=>{

    try{

        const [rows] = await db.query(`
            SELECT
                a.*,
                u.name AS patient_name
            FROM appointments a
            JOIN users u
            ON a.patient_id = u.id
            JOIN doctors d
            ON a.doctor_id = d.id
            WHERE d.user_id = ?
            ORDER BY a.date DESC, a.time DESC
        `,
        [req.user.id]);

        res.json({
            appointments: rows
        });

    }catch(error){

        console.error(error);

        res.status(500).json({
            message:'Server Error'
        });

    }

};

// === DOKTER: Update status booking (confirm / done / cancel) ===
const updateAppointmentStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const user_id = req.user.id;
  console.log("User Login:", user_id);
  console.log("Appointment ID:", id);
  console.log("Status:", status);

  const validStatuses = ['confirmed', 'done', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Status tidak valid.' });
  }

  try {
    // Pastikan appointment ini memang milik dokter yang sedang login
    const [rows] = await db.query(`
      SELECT a.id FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      WHERE a.id = ? AND d.user_id = ?
    `, [id, user_id]);
    console.log(rows);
    if (rows.length === 0) {
      return res.status(403).json({ message: 'Anda tidak berhak mengubah appointment ini.' });
    }

    await db.query('UPDATE appointments SET status = ? WHERE id = ?', [status, id]);

    res.status(200).json({ message: `Status appointment berhasil diubah menjadi '${status}'.` });

  } catch (error) {
    console.error('Error updateAppointmentStatus:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

module.exports = {
  createAppointment,
  getMyAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
};