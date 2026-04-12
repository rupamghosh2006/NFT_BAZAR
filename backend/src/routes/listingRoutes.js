const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listingController');
const { authMiddleware } = require('../middleware/auth');

router.get('/', listingController.listListings);
router.get('/:id', listingController.getListing);
router.post('/', authMiddleware, listingController.createListing);
router.delete('/:id', authMiddleware, listingController.cancelListing);

module.exports = router;
