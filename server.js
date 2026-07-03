const express  = require('express');
const cors     = require('cors');
require('dotenv').config();
const path = require('path');
const db = require('./config/db');

const app  = express(); // HARUS PALING ATAS SEBELUM app.use
const PORT = process.env.PORT || 3000;

// ── Middleware Global ──────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// static folder (PILIH SALAH SATU, jangan dobel)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));

// ── Import Routes ──────────────────────────────────────────────────────────
const authRoutes         = require('./routes/authRoutes');
const doctorRoutes       = require('./routes/doctorRoutes');
const appointmentRoutes  = require('./routes/appointmentRoutes');
const chatRoutes         = require('./routes/chatRoutes');
const healthRoutes       = require('./routes/healthRoutes');
const recordRoutes       = require('./routes/recordRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/doctors',       doctorRoutes);
app.use('/api/appointments',  appointmentRoutes);
app.use('/api/chat',          chatRoutes);
app.use('/api/health',        healthRoutes);
app.use('/api/records',       recordRoutes);
app.use('/api/notifications', notificationRoutes);
console.log("Notification routes loaded");
// ── Health Check ───────────────────────────────────────────────────────────
app.get('/api/health-check', (req, res) => {
  res.json({ status: 'OK', message: 'HealthSync API berjalan.' });
});

// ── Scheduler ───────────────────────────────────────────────────────────────
const { startScheduler } = require('./config/scheduler');
startScheduler();

// ── Root ───────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

(async () => {
  try {
    await db.query("SELECT 1");
    console.log("✅ Berhasil terkoneksi ke MySQL!");
  } catch (err) {
    console.error("❌ Gagal konek ke MySQL:", err);
  }
})();

// ── Start Server ───────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Server HealthSync berjalan di http://localhost:${PORT}`);
});