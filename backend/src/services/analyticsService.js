const prisma = require('../db/prisma');
const cacheService = require('./cacheService');
const config = require('../configs');
const { Op } = require;

class AnalyticsService {
  async getVolume({ period = 'all' } = {}) {
    const cacheKey = cacheService.buildKey('analytics:volume', { period });
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    let dateFilter = {};
    const now = new Date();

    if (period === 'daily') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      dateFilter = { createdAt: { gte: startOfDay } };
    } else if (period === 'weekly') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { createdAt: { gte: weekAgo } };
    }

    const [daily, weekly, allTime, count] = await Promise.all([
      prisma.sale.aggregate({
        where: { createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) } },
        _sum: { price: true },
        _count: true,
      }),
      prisma.sale.aggregate({
        where: { createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
        _sum: { price: true },
        _count: true,
      }),
      prisma.sale.aggregate({
        _sum: { price: true, royaltyAmount: true },
        _count: true,
      }),
      prisma.sale.count({ where: dateFilter }),
    ]);

    const result = {
      daily: {
        volume: daily._sum.price || '0',
        sales: daily._count || 0,
      },
      weekly: {
        volume: weekly._sum.price || '0',
        sales: weekly._count || 0,
      },
      allTime: {
        volume: allTime._sum.price || '0',
        sales: allTime._count || 0,
        totalRoyalty: allTime._sum.royaltyAmount || '0',
      },
    };

    await cacheService.set(cacheKey, result, config.cache.ttlAnalytics);
    return result;
  }

  async getTopNfts({ limit = 10 } = {}) {
    const cacheKey = cacheService.buildKey('analytics:top-nfts', { limit });
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const topSales = await prisma.sale.findMany({
      include: { nft: true },
      orderBy: { price: 'desc' },
      take: limit,
    });

    const result = {
      data: topSales.map((s) => ({
        nft: s.nft,
        salePrice: s.price,
        saleId: s.id,
        sellerAddress: s.sellerAddress,
        buyerAddress: s.buyerAddress,
        soldAt: s.createdAt,
      })),
    };

    await cacheService.set(cacheKey, result, config.cache.ttlAnalytics);
    return result;
  }

  async getMarketStats() {
    const cacheKey = 'analytics:market-stats';
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const [
      totalNfts,
      totalListings,
      totalSales,
      totalUsers,
    ] = await Promise.all([
      prisma.nFT.count(),
      prisma.listing.count({ where: { active: true } }),
      prisma.sale.count(),
      prisma.user.count(),
    ]);

    const result = {
      totalNfts,
      totalListings,
      totalSales,
      totalUsers,
    };

    await cacheService.set(cacheKey, result, config.cache.ttlAnalytics);
    return result;
  }
}

module.exports = new AnalyticsService();
