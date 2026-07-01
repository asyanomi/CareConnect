const express = require('express');
const router = express.Router();
const {
  createDoctorProfile,
  getAllDoctors,
  getDoctorById,
  updateSchedule,
  updateStatus
} = require('../controllers/doctorController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

// Publik — siapa saja bisa melihat daftar dokter
router.get('/', getAllDoctors);
router.get('/:id', getDoctorById);

// Hanya role 'doctor' yang bisa mengakses
router.post(
    '/profile',
    verifyToken,
    createDoctorProfile
);
router.put('/schedule', verifyToken, authorizeRole('doctor'), updateSchedule);
router.put(
  '/status',
  verifyToken,
  updateStatus
);

module.exports = router;