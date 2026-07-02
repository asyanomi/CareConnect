const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// === REGISTER ===
const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  // Validasi input tidak boleh kosong
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Nama, email, dan password wajib diisi.' });
  }

  try {
    // Cek apakah email sudah terdaftar
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email sudah terdaftar.' });
    }

    // Enkripsi password sebelum disimpan ke database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tentukan role — hanya izinkan 'patient' atau 'doctor' saat register
    const userRole = role === 'doctor' ? 'doctor' : 'patient';

    // Simpan user baru ke database
// Simpan user baru ke database
const [result] = await db.query(
  'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
  [name, email, hashedPassword, userRole]
);

const userId = result.insertId;

// Jika dokter, otomatis buat profil dokter
if (userRole === 'doctor') {
  await db.query(
    `INSERT INTO doctors
    (user_id, specialization, phone, bio, is_available)
    VALUES (?, ?, ?, ?, ?)`,
    [
      userId,
      'Belum diisi',
      '-',
      'Profil dokter belum diperbarui',
      1
    ]
  );
}

res.status(201).json({
  message: 'Registrasi berhasil! Silakan login.'
});

  } catch (error) {
  console.error(error);

  res.status(500).json({
    success: false,
    message: error.message,
    code: error.code,
    sqlMessage: error.sqlMessage
  });
}
};
// === LOGIN ===
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email dan password wajib diisi.' });
  }

  try {
    // Cari user berdasarkan email
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Email atau password salah.' });
    }

    const user = users[0];

    // Bandingkan password yang diinput dengan hash di database
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Email atau password salah.' });
    }

    // Buat JWT token yang berisi data user
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' } // token berlaku 24 jam
    );

    res.status(200).json({
      message: 'Login berhasil!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
  console.error(error);

  res.status(500).json({
    success: false,
    message: error.message,
    code: error.code,
    sqlMessage: error.sqlMessage
  });
}
};
// === GET PROFILE (butuh token) ===
const getProfile = async (req, res) => {
  try {
    // req.user diisi oleh middleware verifyToken
    const [users] = await db.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }

    res.status(200).json({ user: users[0] });

  } catch (error) {
    console.error('Error getProfile:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

module.exports = { register, login, getProfile };