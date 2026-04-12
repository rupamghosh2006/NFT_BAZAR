const express = require('express');
const router = express.Router();
const royaltyController = require('../controllers/royaltyController');
const { authMiddleware } = require('../middleware/auth');

router.get('/:walletAddress', royaltyController.getClaimableBalance);
router.get('/history/:walletAddress', royaltyController.getEarningsHistory);
router.post('/claim', authMiddleware, royaltyController.claim);

module.exports = router;
