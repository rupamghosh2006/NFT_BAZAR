const listingService = require('../services/listingService');

async function listListings(req, res, next) {
  try {
    const { page, limit, contractAddress, seller, sortBy, sortOrder, minPrice, maxPrice } = req.query;

    const result = await listingService.listListings({
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '20', 10),
      contractAddress,
      seller,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc',
      minPrice,
      maxPrice,
    });

    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function getListing(req, res, next) {
  try {
    const { id } = req.params;
    const listing = await listingService.getListingById(id);

    if (!listing) {
      return res.status(404).json({ success: false, error: { message: 'Listing not found' } });
    }

    res.json({ success: true, data: listing });
  } catch (err) {
    next(err);
  }
}

async function createListing(req, res, next) {
  try {
    const { nftId, price } = req.body;
    const { walletAddress } = req.user;

    if (!nftId || !price) {
      return res.status(400).json({ success: false, error: { message: 'nftId and price are required' } });
    }

    const listing = await listingService.createListing({
      nftId,
      sellerAddress: walletAddress,
      price,
    });

    res.status(201).json({ success: true, data: listing });
  } catch (err) {
    next(err);
  }
}

async function cancelListing(req, res, next) {
  try {
    const { id } = req.params;
    const { walletAddress } = req.user;

    const listing = await listingService.cancelListing(id, walletAddress);
    res.json({ success: true, data: listing });
  } catch (err) {
    next(err);
  }
}

module.exports = { listListings, getListing, createListing, cancelListing };
