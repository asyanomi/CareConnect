const db = require('../config/db');

// CREATE PROFILE
const createDoctorProfile = async (req, res) => {

  const {
    specialization,
    bio,
    phone,
    schedule,
    is_available
  } = req.body;

  const user_id = req.user.id;

  try {

    const [existing] = await db.query(
      'SELECT id FROM doctors WHERE user_id = ?',
      [user_id]
    );

    if (existing.length > 0) {

      return res.status(409).json({
        message: 'Profil dokter sudah ada.'
      });

    }

    await db.query(
      `INSERT INTO doctors
      (
        user_id,
        specialization,
        bio,
        phone,
        schedule,
        is_available
      )
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        specialization,
        bio,
        phone,
        schedule
          ? JSON.stringify(schedule)
          : '{}',
        1
      ]
    );

    res.status(201).json({
      message: 'Profil dokter berhasil dibuat.'
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: error.message
    });

  }

};

// GET ALL DOCTORS
const getAllDoctors = async (req, res) => {
  try {

const [doctors] = await db.query(`
  SELECT 
    d.id,
    u.name,
    u.email,
    d.specialization,
    d.bio,
    d.phone,
    d.schedule,
    d.is_available
  FROM doctors d
  JOIN users u ON d.user_id = u.id
`);

    res.json({
      doctors
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: error.message
    });
  }
};

// GET DOCTOR BY ID
const getDoctorById = async (req, res) => {
  try {

    const [rows] = await db.query(`
      SELECT
        d.id,
        u.name,
        u.email,
        d.specialization,
        d.schedule
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      WHERE d.id = ?
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'Dokter tidak ditemukan'
      });
    }

    res.json({
      doctor: rows[0]
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: error.message
    });
  }
};

// UPDATE SCHEDULE
const updateSchedule = async (req, res) => {
  try {

    await db.query(
      'UPDATE doctors SET schedule = ? WHERE user_id = ?',
      [
        JSON.stringify(req.body.schedule),
        req.user.id
      ]
    );

    res.json({
      message: 'Jadwal berhasil diperbarui'
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: error.message
    });
  }
};
const updateStatus = async (req, res) => {

  console.log('USER LOGIN:', req.user);
  console.log('BODY:', req.body);

  const { is_available } = req.body;

  try {

    const [doctor] = await db.query(
      'SELECT * FROM doctors WHERE user_id = ?',
      [req.user.id]
    );

    console.log('DOCTOR:', doctor);

    if (doctor.length === 0) {
      return res.status(404).json({
        message: 'Dokter tidak ditemukan'
      });
    }

    await db.query(
      'UPDATE doctors SET is_available = ? WHERE user_id = ?',
      [is_available, req.user.id]
    );

    res.json({
      message: 'Status dokter berhasil diperbarui'
    });

  } catch(error) {

    console.error(error);

    res.status(500).json({
      message: error.message
    });

  }
};
const getDoctorRecords = async (req,res)=>{

    const doctor_user_id = req.user.id;

    const [records] = await db.query(`
        SELECT
            u.name as patient_name,
            r.diagnosis,
            r.prescription,
            r.created_at
        FROM medical_records r
        JOIN users u
            ON r.patient_id = u.id
        JOIN doctors d
            ON r.doctor_id = d.id
        WHERE d.user_id = ?
        ORDER BY r.created_at DESC
    `,[doctor_user_id]);

    res.json({records});

};
module.exports = {
  createDoctorProfile,
  getAllDoctors,
  getDoctorById,
  updateSchedule,
  updateStatus,
  getDoctorRecords
};