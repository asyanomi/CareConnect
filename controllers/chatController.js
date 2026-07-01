const db = require('../config/db');

// === KIRIM PESAN ===
const sendMessage = async (req, res) => {
  const { appointment_id, message } = req.body;
  const sender_id = req.user.id;

  if (!appointment_id || !message) {
    return res.status(400).json({ message: 'appointment_id dan pesan wajib diisi.' });
  }

  try {
    // Pastikan appointment ini melibatkan user yang sedang login
    // baik sebagai pasien maupun sebagai dokter
    const [appt] = await db.query(`
      SELECT a.id FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      WHERE a.id = ?
        AND (a.patient_id = ? OR d.user_id = ?)
        AND a.status IN ('confirmed', 'done')
    `, [appointment_id, sender_id, sender_id]);

    if (appt.length === 0) {
      return res.status(403).json({
        message: 'Anda tidak berhak mengirim pesan di konsultasi ini, atau konsultasi belum dikonfirmasi.'
      });
    }

    await db.query(
      'INSERT INTO messages (appointment_id, sender_id, message) VALUES (?, ?, ?)',
      [appointment_id, sender_id, message]
    );

    res.status(201).json({ message: 'Pesan berhasil dikirim.' });

  } catch (error) {
    console.error('Error sendMessage:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

// === AMBIL SEMUA PESAN DALAM SATU KONSULTASI ===
const getMessages = async (req, res) => {
  const { appointment_id } = req.params;
  const user_id = req.user.id;

  try {
    // Validasi bahwa user ini memang peserta konsultasi tersebut
    const [appt] = await db.query(`
      SELECT a.id FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      WHERE a.id = ?
        AND (a.patient_id = ? OR d.user_id = ?)
    `, [appointment_id, user_id, user_id]);

    if (appt.length === 0) {
      return res.status(403).json({ message: 'Akses ditolak.' });
    }

    // Ambil semua pesan beserta nama pengirim
    const [messages] = await db.query(`
      SELECT m.id, m.message, m.created_at,
             u.id AS sender_id, u.name AS sender_name, u.role AS sender_role
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.appointment_id = ?
      ORDER BY m.created_at ASC
    `, [appointment_id]);

    res.status(200).json({ messages });

  } catch (error) {
    console.error('Error getMessages:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

module.exports = { sendMessage, getMessages };