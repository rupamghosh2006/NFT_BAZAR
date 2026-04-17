const express = require('express');
const router = express.Router();
const { buildMintTx, submitMintTx } = require('../controllers/sorobanMintController');

// Step 1: Build unsigned transaction for user to sign
router.post('/build', buildMintTx);

// Step 2: Submit signed transaction to blockchain
router.post('/submit', submitMintTx);

module.exports = router;
