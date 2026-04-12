const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/nonce', authLimiter, authController.getNonce);
router.post('/verify', authLimiter, authController.verify);

module.exports = router;
