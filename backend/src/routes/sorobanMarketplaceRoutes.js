const express = require('express');
const router = express.Router();
const {
  buildListTx,
  submitListTx,
  buildBuyTx,
  submitBuyTx,
} = require('../controllers/sorobanMarketplaceController');

// Listing endpoints
router.post('/list/build', buildListTx);
router.post('/list/submit', submitListTx);

// Buying endpoints
router.post('/buy/build', buildBuyTx);
router.post('/buy/submit', submitBuyTx);

module.exports = router;
