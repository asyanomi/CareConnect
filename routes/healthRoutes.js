const express = require('express');
const router  = express.Router();
const {
  addHealthLog,
  getMyHealthLogs,
  getLatestLog,
  deleteHealthLog,
  getHealthChartData   // 1. Import chart ditaruh di sini bersama yang lain
} = require('../controllers/healthController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

// Semua route health tracker hanya untuk pasien yang sudah login
router.post('/',        verifyToken, authorizeRole('patient'), addHealthLog);
router.get('/all',      verifyToken, authorizeRole('patient'), getMyHealthLogs);
router.get('/latest',   verifyToken, authorizeRole('patient'), getLatestLog);
router.get('/chart',    verifyToken, authorizeRole('patient'), getHealthChartData); // 2. Rute chart ditaruh di sini
router.delete('/:id',   verifyToken, authorizeRole('patient'), deleteHealthLog);

module.exports = router;