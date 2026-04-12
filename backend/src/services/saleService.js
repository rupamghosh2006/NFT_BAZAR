const prisma = require('../db/prisma');
const { ChainSale } = require('../models/mongo');
const cacheService = require('./cacheService');
const config = require('../configs');

const ROYALTY_PERCENTAGES = {
  creator: 50,
  staker: 30,
  treasury: 20,
};

class SaleService {
  async listSales({ page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;

    const cacheKey = cacheService.buildKey('sales', { page, limit });
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        include: { nft: true, buyer: true, seller: true, listing: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.sale.count(),
    ]);

    const result = {
      data: sales.slice(0, 20),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };

    await cacheService.set(cacheKey, result, Math.min(config.cache.ttlAnalytics, 60));
    return result;
  }

  async getSalesByNft(contractAddress, tokenId, { page = 1, limit = 20 } = {}) {
    const nft = await prisma.nFT.findUnique({
      where: { contractAddress_tokenId: { contractAddress: contractAddress.toUpperCase(), tokenId: tokenId.toString() } },
    });
    if (!nft) return { data: [], pagination: { page, limit, total: 0 } };

    const skip = (page - 1) * limit;
    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where: { nftId: nft.id },
        include: { buyer: true, seller: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.sale.count({ where: { nftId: nft.id } }),
    ]);

    return { data: sales, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getSalesByUser(walletAddress, { page = 1, limit = 20, role } = {}) {
    const normalized = walletAddress.toUpperCase();
    const skip = (page - 1) * limit;

    let buyerWhere = { buyerAddress: normalized };
    let sellerWhere = { sellerAddress: normalized };

    if (role === 'buyer') sellerWhere = {};
    if (role === 'seller') buyerWhere = {};

    const [asBuyer, asSeller] = await Promise.all([
      prisma.sale.findMany({ where: buyerWhere, include: { nft: true, listing: true }, orderBy: { createdAt: 'desc' } }),
      prisma.sale.findMany({ where: sellerWhere, include: { nft: true, listing: true }, orderBy: { createdAt: 'desc' } }),
    ]);

    let combined = [...asBuyer, ...asSeller];
    const seen = new Set();
    combined = combined.filter((s) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });

    combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = combined.length;
    const paginated = combined.slice(skip, skip + limit);

    return {
      data: paginated,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async recordSale({ listingId, nftId, buyerAddress, sellerAddress, price, txHash, royaltyAmount }) {
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw Object.assign(new Error('Listing not found'), { statusCode: 404 });

    const nft = await prisma.nFT.findUnique({ where: { id: nftId } });

    const existingSale = await prisma.sale.findUnique({ where: { listingId } });
    if (existingSale) return existingSale;

    const sale = await prisma.sale.create({
      data: {
        listingId,
        nftId,
        buyerAddress: buyerAddress.toUpperCase(),
        sellerAddress: sellerAddress.toUpperCase(),
        price: price.toString(),
        txHash,
        royaltyAmount: royaltyAmount.toString(),
      },
    });

    if (nft) {
      await prisma.nFT.update({
        where: { id: nftId },
        data: { ownerAddress: buyerAddress.toUpperCase() },
      });
    }

    const { ChainNFT } = require('../models/mongo');
    if (nft) {
      await ChainNFT.updateOne(
        { contractAddress: nft.contractAddress, tokenId: nft.tokenId },
        { ownerAddress: buyerAddress.toUpperCase(), lastSalePrice: price.toString(), lastSaleTxHash: txHash, indexedAt: new Date() }
      );
    }

    const royalty = royaltyAmount || '0';
    const royaltyBps = parseInt(royalty, 10);
    const recipients = [
      { address: config.contracts.creatorAddress, role: 'creator', pct: ROYALTY_PERCENTAGES.creator },
      { address: config.contracts.stakersAddress, role: 'staker', pct: ROYALTY_PERCENTAGES.staker },
      { address: config.contracts.treasuryAddress, role: 'treasury', pct: ROYALTY_PERCENTAGES.treasury },
    ];

    const earnings = [];
    for (const r of recipients) {
      const amount = Math.floor(royaltyBps * r.pct / 100).toString();
      const earning = await prisma.royaltyEarning.create({
        data: {
          recipientAddress: r.address,
          amount,
          saleId: sale.id,
          claimed: false,
        },
      });
      earnings.push(earning);

      const { RoyaltyReceipt } = require('../models/mongo');
      await RoyaltyReceipt.create({
        receiptId: earning.id,
        saleId: sale.id,
        txHash: txHash || '',
        recipientAddress: r.address,
        role: r.role,
        percentage: r.pct,
        amount,
        claimed: false,
      });
    }

    const { ChainSale } = require('../models/mongo');
    await ChainSale.findOneAndUpdate(
      { saleId: sale.id },
      {
        saleId: sale.id,
        listingId,
        nftId,
        contractAddress: nft?.contractAddress || '',
        tokenId: nft?.tokenId || '',
        buyerAddress: buyerAddress.toUpperCase(),
        sellerAddress: sellerAddress.toUpperCase(),
        price: price.toString(),
        royaltyAmount: royalty,
        txHash: txHash || '',
        blockTimestamp: new Date(),
        indexedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    await cacheService.delPattern('listings:*');
    await cacheService.delPattern('nfts:*');
    await cacheService.delPattern('sales:*');
    await cacheService.delPattern('analytics:*');

    return { sale, earnings };
  }
}

module.exports = new SaleService();
