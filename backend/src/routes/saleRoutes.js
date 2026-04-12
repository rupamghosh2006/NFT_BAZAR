const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');

router.get('/', saleController.listSales);
router.get('/nft/:contractAddress/:tokenId', saleController.getSalesByNft);
router.get('/user/:walletAddress', saleController.getSalesByUser);

module.exports = router;
