const db = require('../config/db');

// Fungsi bantu: hitung BMI
const calculateBMI = (weight, height) => {
  if (!weight || !height || height === 0) return { bmi: null, category: null };
  const heightInMeter = height / 100;
  const bmi = weight / (heightInMeter * heightInMeter);
  const rounded = parseFloat(bmi.toFixed(2));

  let category;
  if (rounded < 18.5)       category = 'Underweight';
  else if (rounded < 25.0)  category = 'Normal';
  else if (rounded < 30.0)  category = 'Overweight';
  else                       category = 'Obesitas';

  return { bmi: rounded, category };
};

// === CATAT DATA KESEHATAN BARU ===
const addHealthLog = async (req, res) => {
  let { weight, height, blood_pressure, calories, notes, log_date } = req.body;
  const user_id = req.user.id;

  if (!log_date) {
    return res.status(400).json({ message: 'Tanggal log wajib diisi.' });
  }

  // PERBAIKAN: Ubah koma ke titik agar dipahami database
  const w = parseFloat(String(weight).replace(',', '.'));
  const h = parseFloat(String(height).replace(',', '.'));

  if (isNaN(w) || isNaN(h)) {
    return res.status(400).json({ message: 'Berat dan tinggi harus angka yang valid.' });
  }

  try {
    const { bmi, category } = calculateBMI(w, h);

    await db.query(`
      INSERT INTO health_logs 
        (user_id, weight, height, bmi, bmi_category, blood_pressure, calories, notes, log_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [user_id, w, h, bmi, category, blood_pressure, calories, notes, log_date]);

    res.status(201).json({ message: 'Data berhasil disimpan.', bmi, bmi_category: category });
  } catch (error) {
    console.error('Error addHealthLog:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.', detail: error.message });
  }
};

// === FUNGSI LAINNYA ===
const getMyHealthLogs = async (req, res) => {
  try {
    console.log('req.user =', req.user);

    const [logs] = await db.query(
      'SELECT * FROM health_logs WHERE user_id = ? ORDER BY log_date DESC',
      [req.user.id]
    );

    res.status(200).json({ logs });

  } catch (error) {
    console.error('getMyHealthLogs ERROR:', error);

    res.status(500).json({
      message: error.message
    });
  }
};

const getLatestLog = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM health_logs WHERE user_id = ? ORDER BY log_date DESC LIMIT 1', [req.user.id]);
    res.status(200).json({ log: rows[0] || null });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

const deleteHealthLog = async (req, res) => {
  try {
    await db.query('DELETE FROM health_logs WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.status(200).json({ message: 'Data berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

const getHealthChartData = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT log_date, weight, bmi, calories 
      FROM health_logs WHERE user_id = ? AND log_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      ORDER BY log_date ASC`, [req.user.id]);

    res.status(200).json({
      labels: rows.map(r => r.log_date),
      weightData: rows.map(r => r.weight),
      bmiData: rows.map(r => r.bmi),
      caloriesData: rows.map(r => r.calories)
    });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

// EXPORT HANYA SATU KALI DI SINI
module.exports = { addHealthLog, getMyHealthLogs, getLatestLog, deleteHealthLog, getHealthChartData };