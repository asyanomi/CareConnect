const express  = require('express');
const router   = express.Router();
const upload   = require('../config/mutler');
const {
  createRecord,
  getMyRecords,
  getPatientRecords,
  downloadFile
} = require('../controllers/recordController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

// Pasien melihat rekam medis milik sendiri
router.get('/my', verifyToken, authorizeRole('patient'), getMyRecords);

// Dokter menambah rekam medis — upload.single('file') adalah middleware Multer
// 'file' adalah nama field di form yang membawa file
router.post('/', verifyToken, authorizeRole('doctor'), upload.single('file'), createRecord);

// Dokter melihat rekam medis pasien tertentu
router.get(
  '/patient/:patient_name',
  verifyToken,
  authorizeRole('doctor'),
  getPatientRecords
);

// Download file (pasien & dokter)
router.get('/download/:id', verifyToken, downloadFile);

module.exports = router;