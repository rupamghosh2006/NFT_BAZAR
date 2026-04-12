const express = require('express');
const router = express.Router();
const mintController = require('../controllers/mintController');
const { authMiddleware } = require('../middleware/auth');

router.post('/', authMiddleware, mintController.mint);

module.exports = router;