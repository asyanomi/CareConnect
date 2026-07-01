const db = require('../config/db');

// === AMBIL SEMUA NOTIFIKASI MILIK USER ===
const getNotifications = async (req, res) => {
  const user_id = req.user.id;

  try {
    const [rows] = await db.query(`
      SELECT id, title, message, is_read, created_at
      FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `, [user_id]);

    // Hitung jumlah notifikasi yang belum dibaca
    // untuk ditampilkan sebagai badge di navbar
    const unreadCount = rows.filter(n => n.is_read === 0).length;

    res.status(200).json({ notifications: rows, unreadCount });

  } catch (error) {
    console.error('Error getNotifications:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

// === TANDAI SATU NOTIFIKASI SEBAGAI SUDAH DIBACA ===
const markAsRead = async (req, res) => {
  const { id }  = req.params;
  const user_id = req.user.id;

  try {
    // Pastikan notifikasi ini memang milik user yang sedang login
    // sebelum mengubah statusnya — ini adalah penerapan object-level authorization
    await db.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [id, user_id]
    );

    res.status(200).json({ message: 'Notifikasi ditandai sudah dibaca.' });

  } catch (error) {
    console.error('Error markAsRead:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

// === TANDAI SEMUA NOTIFIKASI SEBAGAI SUDAH DIBACA ===
const markAllAsRead = async (req, res) => {
  const user_id = req.user.id;

  try {
    await db.query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
      [user_id]
    );

    res.status(200).json({ message: 'Semua notifikasi telah ditandai dibaca.' });

  } catch (error) {
    console.error('Error markAllAsRead:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

// === FUNGSI BANTU: Buat notifikasi baru (dipanggil dari modul lain) ===
// Fungsi ini tidak menjadi endpoint HTTP — ia dipanggil secara internal
// oleh scheduler dan controller lain yang membutuhkan pengiriman notifikasi
const createNotification = async (user_id, title, message) => {
  try {
    await db.query(
      'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
      [user_id, title, message]
    );
  } catch (error) {
    console.error('Error createNotification:', error);
  }
};
const getDoctorNotifications = async(req,res)=>{

    try{

        const [rows] = await db.query(
        `
        SELECT *
        FROM notifications
        WHERE user_id=?
        ORDER BY created_at DESC
        `,
        [req.user.id]
        );

        const unread =
            rows.filter(n=>!n.is_read).length;

        res.json({
            notifications:rows,
            unreadCount:unread
        });

    }catch(err){

        console.log(err);

        res.status(500).json({
            message:"Server Error"
        });

    }

};
const readNotification = async(req,res)=>{

    await db.query(
    "UPDATE notifications SET is_read=1 WHERE id=?",
    [req.params.id]
    );

    res.json({
        message:"OK"
    });

};
const readAllNotifications = async(req,res)=>{

    await db.query(
    "UPDATE notifications SET is_read=1 WHERE user_id=?",
    [req.user.id]
    );

    res.json({
        message:"OK"
    });

};

module.exports = { getNotifications, markAsRead, markAllAsRead, createNotification, getDoctorNotifications, readAllNotifications, readNotification };