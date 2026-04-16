const express = require('express');
const router = express.Router();
const multer = require('multer');
const uploadController = require('../controllers/uploadController');

// Configure multer for file upload (in-memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

// POST /api/upload - Upload image to Pinata
router.post('/', upload.single('image'), uploadController.uploadImage);

module.exports = router;
