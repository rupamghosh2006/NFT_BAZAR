const express = require('express');
const router = express.Router();
const { buildMintTx, submitMintTx } = require('../controllers/sorobanMintController');

// Step 1: Build unsigned mint transaction
router.post('/build', buildMintTx);

// Step 2: Submit signed mint transaction
router.post('/submit', submitMintTx);

module.exports = router;
