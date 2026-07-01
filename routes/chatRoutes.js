const express = require('express');
const router = express.Router();
const { sendMessage, getMessages } = require('../controllers/chatController');
const { verifyToken } = require('../middleware/authMiddleware');

// Kedua route ini bisa diakses oleh pasien maupun dokter
// sehingga tidak menggunakan authorizeRole — cukup verifyToken
router.post('/send', verifyToken, sendMessage);
router.get('/:appointment_id', verifyToken, getMessages);

module.exports = router;