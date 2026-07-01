const express = require('express');
const router  = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getDoctorNotifications,
  readNotification,
  readAllNotifications
} = require('../controllers/notificationController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

// Semua endpoint notifikasi memerlukan token
// karena notifikasi bersifat personal per pengguna
router.get('/',              verifyToken, getNotifications);
router.put('/read/:id',      verifyToken, markAsRead);
router.put('/read-all',      verifyToken, markAllAsRead);

router.get(
    "/doctor/notifications",
    verifyToken,
    authorizeRole("doctor"),
    getDoctorNotifications
);

router.put(
    "/doctor/notifications/read/:id",
    verifyToken,
    authorizeRole("doctor"),
    readNotification
);

router.put(
    "/doctor/notifications/read-all",
    verifyToken,
    authorizeRole("doctor"),
    readAllNotifications
);
module.exports = router;