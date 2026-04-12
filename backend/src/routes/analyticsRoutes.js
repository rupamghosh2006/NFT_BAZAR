const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.get('/volume', analyticsController.getVolume);
router.get('/top-nfts', analyticsController.getTopNfts);
router.get('/stats', analyticsController.getMarketStats);

module.exports = router;
