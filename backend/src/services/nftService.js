const prisma = require('../db/prisma');
const { ChainNFT } = require('../models/mongo');
const cacheService = require('./cacheService');
const config = require('../configs');

class NftService {
  async listNfts({ page = 1, limit = 20, owner, contractAddress, listed, minPrice, maxPrice, sortBy = 'createdAt', sortOrder = 'desc' } = {}) {
    const skip = (page - 1) * limit;

    const where = {};
    if (owner) where.ownerAddress = owner.toUpperCase();
    if (contractAddress) where.contractAddress = contractAddress;

    const includeListing = listed !== undefined;

    const cacheKey = cacheService.buildKey('nfts', { page, limit, owner, contractAddress, listed, minPrice, maxPrice, sortBy, sortOrder });

    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    let listingsFilter = {};
    if (listed === true) {
      listingsFilter = { active: true };
    } else if (listed === false) {
      listingsFilter = { active: false };
    }

    const orderBy = {};
    if (['createdAt', 'tokenId'].includes(sortBy)) {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    const [nfts, total] = await Promise.all([
      prisma.nFT.findMany({
        where,
        include: {
          listing: includeListing ? { where: listingsFilter } : false,
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.nFT.count({ where }),
    ]);

    const result = {
      data: nfts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + nfts.length < total,
      },
    };

    await cacheService.set(cacheKey, result, config.cache.ttlNfts);
    return result;
  }

  async getNftByToken(contractAddress, tokenId) {
    const cacheKey = cacheService.buildKey('nft', { contractAddress, tokenId });

    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const nft = await prisma.nFT.findUnique({
      where: {
        contractAddress_tokenId: {
          contractAddress: contractAddress.toUpperCase(),
          tokenId: tokenId.toString(),
        },
      },
      include: {
        listing: true,
        sales: {
          include: { buyer: true, seller: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!nft) return null;

    await cacheService.set(cacheKey, nft, config.cache.ttlNfts);
    return nft;
  }

  async getNftsByOwner(walletAddress, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const normalized = walletAddress.toUpperCase();

    const [nfts, total] = await Promise.all([
      prisma.nFT.findMany({
        where: { ownerAddress: normalized },
        include: { listing: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.nFT.count({ where: { ownerAddress: normalized } }),
    ]);

    return {
      data: nfts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async mintNft({ tokenId, contractAddress, ownerAddress, metadataUri, name, image }) {
    const normalizedOwner = ownerAddress.toUpperCase();
    const normalizedContract = contractAddress.toUpperCase();

    const existing = await prisma.nFT.findUnique({
      where: { contractAddress_tokenId: { contractAddress: normalizedContract, tokenId: tokenId.toString() } },
    });

    if (existing) {
      throw Object.assign(new Error('NFT already exists'), { statusCode: 409 });
    }

    let user = await prisma.user.findUnique({ where: { walletAddress: normalizedOwner } });
    if (!user) {
      user = await prisma.user.create({ data: { walletAddress: normalizedOwner } });
    }

    const nft = await prisma.nFT.create({
      data: {
        tokenId: tokenId.toString(),
        contractAddress: normalizedContract,
        ownerAddress: normalizedOwner,
        metadataUri,
        name,
        image,
      },
    });

    await ChainNFT.findOneAndUpdate(
      { contractAddress: normalizedContract, tokenId: tokenId.toString() },
      {
        contractAddress: normalizedContract,
        tokenId: tokenId.toString(),
        ownerAddress: normalizedOwner,
        metadataUri,
        name,
        image,
        mintedBy: normalizedOwner,
        mintedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    await cacheService.delPattern('nfts:*');

    return nft;
  }

  async transferNft(contractAddress, tokenId, fromAddress, toAddress) {
    const normalized = contractAddress.toUpperCase();
    const updated = await prisma.nFT.update({
      where: {
        contractAddress_tokenId: { contractAddress: normalized, tokenId: tokenId.toString() },
      },
      data: { ownerAddress: toAddress.toUpperCase() },
    });

    await ChainNFT.updateOne(
      { contractAddress: normalized, tokenId: tokenId.toString() },
      { ownerAddress: toAddress.toUpperCase(), indexedAt: new Date() }
    );

    await cacheService.delPattern('nfts:*');
    await cacheService.del(`nft:${normalized}:${tokenId}`);

    return updated;
  }
}

module.exports = new NftService();
