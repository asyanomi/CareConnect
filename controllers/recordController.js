const db = require('../config/db');
const path = require('path');
const fs = require('fs');

// ==========================
// DOKTER: Tambah Rekam Medis
// ==========================
const createRecord = async (req, res) => {
  const { patient_name, diagnosis, prescription } = req.body;
  const doctor_user_id = req.user.id;

  if (!patient_name || !diagnosis) {
    return res.status(400).json({
      message: 'Nama pasien dan diagnosis wajib diisi.'
    });
  }

  try {

    const [patientRows] = await db.query(
      `SELECT id
       FROM users
       WHERE name = ?
       AND role = 'patient'`,
      [patient_name]
    );

    if (patientRows.length === 0) {
      return res.status(404).json({
        message: 'Pasien tidak ditemukan.'
      });
    }

    const patient_id = patientRows[0].id;

    const [doctorRows] = await db.query(
      'SELECT id FROM doctors WHERE user_id = ?',
      [doctor_user_id]
    );

    if (doctorRows.length === 0) {
      return res.status(404).json({
        message: 'Profil dokter tidak ditemukan.'
      });
    }

    const doctor_id = doctorRows[0].id;

    const file_path = req.file
      ? req.file.filename
      : null;

    await db.query(
      `INSERT INTO medical_records
      (patient_id, doctor_id, diagnosis, prescription, file_path)
      VALUES (?, ?, ?, ?, ?)`,
      [
        patient_id,
        doctor_id,
        diagnosis,
        prescription,
        file_path
      ]
    );

    res.status(201).json({
      message: 'Rekam medis berhasil ditambahkan.'
    });

  } catch (error) {

    console.error('Error createRecord:', error);

    res.status(500).json({
      message: 'Terjadi kesalahan pada server.'
    });

  }
};

// ==========================
// PASIEN: Lihat Rekam Medis Sendiri
// ==========================
const getMyRecords = async (req, res) => {

  const patient_id = req.user.id;

  try {

    const [records] = await db.query(
      `SELECT
          r.id,
          u.name AS doctor_name,
          d.specialization,
          r.diagnosis,
          r.prescription,
          r.file_path,
          r.created_at
      FROM medical_records r
      JOIN doctors d ON r.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      WHERE r.patient_id = ?
      ORDER BY r.created_at DESC`,
      [patient_id]
    );

    res.status(200).json({
      records
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: 'Terjadi kesalahan pada server.'
    });

  }

};

// ==========================
// DOKTER: Lihat Riwayat Pasien
// ==========================
const getPatientRecords = async (req, res) => {
  const { patient_name } = req.params;
  const doctor_user_id = req.user.id;

  try {

    const [patientRows] = await db.query(
      `SELECT id
       FROM users
       WHERE name = ?
       AND role = 'patient'`,
      [patient_name]
    );

    if (patientRows.length === 0) {
      return res.status(404).json({
        message: 'Pasien tidak ditemukan'
      });
    }

    const patient_id = patientRows[0].id;

    const [records] = await db.query(`
      SELECT
        diagnosis,
        prescription,
        created_at
      FROM medical_records r
      JOIN doctors d
        ON r.doctor_id = d.id
      WHERE
        r.patient_id = ?
        AND d.user_id = ?
      ORDER BY created_at DESC
    `, [patient_id, doctor_user_id]);

    res.json({
      records
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: 'Server error'
    });

  }
};

// ==========================
// DOWNLOAD FILE
// ==========================
const downloadFile = async (req, res) => {

  const { id } = req.params;
  const user_id = req.user.id;
  const user_role = req.user.role;

  try {

    const [rows] = await db.query(
      'SELECT file_path, patient_id FROM medical_records WHERE id = ?',
      [id]
    );

    if (
      rows.length === 0 ||
      !rows[0].file_path
    ) {
      return res.status(404).json({
        message: 'File tidak ditemukan.'
      });
    }

    if (
      user_role === 'patient' &&
      rows[0].patient_id !== user_id
    ) {
      return res.status(403).json({
        message: 'Akses ditolak.'
      });
    }

    const filePath = path.join(
      __dirname,
      '../uploads',
      rows[0].file_path
    );

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message: 'File tidak ditemukan di server.'
      });
    }

    res.download(filePath);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: 'Terjadi kesalahan pada server.'
    });

  }

};

module.exports = {
  createRecord,
  getMyRecords,
  getPatientRecords,
  downloadFile
};