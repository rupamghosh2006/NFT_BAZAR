const express = require('express');
const router = express.Router();
const nftController = require('../controllers/nftController');
const { authMiddleware } = require('../middleware/auth');

router.get('/', nftController.listNfts);
router.get('/owner/:walletAddress', nftController.getNftsByOwner);
router.get('/:contractAddress/:tokenId', nftController.getNft);
router.post('/mint', authMiddleware, nftController.mintNft);

module.exports = router;
