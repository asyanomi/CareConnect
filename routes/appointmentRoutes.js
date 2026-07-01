const express = require("express");
const router = express.Router();

const {
    createAppointment,
    getMyAppointments,
    getDoctorAppointments,
    updateAppointmentStatus,
} = require("../controllers/appoinmentController");

const {
    verifyToken,
    authorizeRole
} = require("../middleware/authMiddleware");


// =====================
// PASIEN
// =====================

// Booking Janji
router.post(
    "/",
    verifyToken,
    authorizeRole("patient"),
    createAppointment
);

// Lihat jadwal milik sendiri
router.get(
    "/my",
    verifyToken,
    authorizeRole("patient"),
    getMyAppointments
);

// Batalkan booking

// =====================
// DOKTER
// =====================

// Lihat semua booking
router.get(
    "/doctor",
    verifyToken,
    authorizeRole("doctor"),
    getDoctorAppointments
);

// Confirm / Done / Cancel
router.put(
    "/status/:id",
    verifyToken,
    authorizeRole("doctor"),
    updateAppointmentStatus
);


module.exports = router;