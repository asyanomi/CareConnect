const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// Route publik — tidak perlu token
router.post('/register', register);
router.post('/login', login);

// Route privat — wajib menyertakan token
router.get('/profile', verifyToken, getProfile);

module.exports = router;