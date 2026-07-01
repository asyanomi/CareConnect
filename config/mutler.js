const multer = require('multer');
const path   = require('path');

// Konfigurasi penyimpanan file ke folder /uploads
// dengan nama file yang diberi timestamp agar tidak bentrok
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Format nama: timestamp-namaasli.ext
    // Contoh: 1718000000000-hasil-lab.pdf
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

// Filter file — hanya izinkan PDF dan gambar
// untuk mencegah upload file berbahaya ke server
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);  // izinkan
  } else {
    cb(new Error('Hanya file PDF, JPG, dan PNG yang diizinkan.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // maksimal 5 MB
});

module.exports = upload;