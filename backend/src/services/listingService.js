const prisma = require('../db/prisma');
const { ChainListing } = require('../models/mongo');
const cacheService = require('./cacheService');
const config = require('../configs');

class ListingService {
  async listListings({ page = 1, limit = 20, contractAddress, seller, sortBy = 'createdAt', sortOrder = 'desc', minPrice, maxPrice } = {}) {
    const skip = (page - 1) * limit;

    const where = { active: true };
    if (contractAddress) where.nft = { contractAddress: contractAddress.toUpperCase() };
    if (seller) where.sellerAddress = seller.toUpperCase();
    if (minPrice) where.price = { ...where.price, gte: minPrice };
    if (maxPrice) where.price = { ...where.price, lte: maxPrice };

    const orderBy = {};
    if (sortBy === 'price') {
      orderBy.price = sortOrder;
    } else if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    const cacheKey = cacheService.buildKey('listings', { page, limit, contractAddress, seller, sortBy, sortOrder, minPrice, maxPrice });
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: { nft: true, seller: true },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.listing.count({ where }),
    ]);

    const result = {
      data: listings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + listings.length < total,
      },
    };

    await cacheService.set(cacheKey, result, config.cache.ttlListings);
    return result;
  }

  async getListingById(id) {
    const cacheKey = `listing:${id}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: { nft: true, seller: true, sale: true },
    });

    if (listing) {
      await cacheService.set(cacheKey, listing, config.cache.ttlListings);
    }
    return listing;
  }

  async createListing({ nftId, sellerAddress, price }) {
    const existingListing = await prisma.listing.findUnique({ where: { nftId } });
    if (existingListing && existingListing.active) {
      throw Object.assign(new Error('NFT already listed'), { statusCode: 409 });
    }

    const nft = await prisma.nFT.findUnique({ where: { id: nftId } });
    if (!nft) throw Object.assign(new Error('NFT not found'), { statusCode: 404 });
    if (nft.ownerAddress !== sellerAddress.toUpperCase()) {
      throw Object.assign(new Error('Not the owner of this NFT'), { statusCode: 403 });
    }

    const listing = await prisma.listing.upsert({
      where: { nftId },
      create: {
        nftId,
        sellerAddress: sellerAddress.toUpperCase(),
        price: price.toString(),
        active: true,
      },
      update: {
        price: price.toString(),
        active: true,
      },
    });

    await ChainListing.findOneAndUpdate(
      { listingId: listing.id },
      {
        listingId: listing.id,
        nftId: listing.nftId,
        contractAddress: nft.contractAddress,
        tokenId: nft.tokenId,
        sellerAddress: listing.sellerAddress,
        price: listing.price,
        active: true,
        indexedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    await cacheService.delPattern('listings:*');
    await cacheService.delPattern('nfts:*');

    return listing;
  }

  async cancelListing(id, walletAddress) {
    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) throw Object.assign(new Error('Listing not found'), { statusCode: 404 });
    if (listing.sellerAddress !== walletAddress.toUpperCase()) {
      throw Object.assign(new Error('Not authorized to cancel this listing'), { statusCode: 403 });
    }
    if (!listing.active) {
      throw Object.assign(new Error('Listing already inactive'), { statusCode: 400 });
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: { active: false },
    });

    await ChainListing.updateOne(
      { listingId: id },
      { active: false, indexedAt: new Date() }
    );

    await cacheService.delPattern('listings:*');
    await cacheService.delPattern('nfts:*');

    return updated;
  }

  async markListingInactive(id) {
    return prisma.listing.update({
      where: { id },
      data: { active: false },
    });
  }
}

module.exports = new ListingService();
