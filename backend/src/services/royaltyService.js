const prisma = require('../db/prisma');
const { RoyaltyReceipt } = require('../models/mongo');
const { royaltyClaimQueue } = require('../configs/queue');
const cacheService = require('./cacheService');

class RoyaltyService {
  async getClaimableBalance(walletAddress) {
    const normalized = walletAddress.toUpperCase();

    const earnings = await prisma.royaltyEarning.findMany({
      where: { recipientAddress: normalized, claimed: false },
    });

    const total = earnings.reduce((sum, e) => sum + BigInt(e.amount), 0n);

    return {
      walletAddress: normalized,
      claimableAmount: total.toString(),
      pendingCount: earnings.length,
      earnings: earnings.slice(0, 50),
    };
  }

  async getEarningsHistory(walletAddress, { page = 1, limit = 20 } = {}) {
    const normalized = walletAddress.toUpperCase();
    const skip = (page - 1) * limit;

    const [earnings, total] = await Promise.all([
      prisma.royaltyEarning.findMany({
        where: { recipientAddress: normalized },
        include: { sale: { include: { nft: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.royaltyEarning.count({ where: { recipientAddress: normalized } }),
    ]);

    return {
      data: earnings,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async claim(walletAddress, earningIds = []) {
    const normalized = walletAddress.toUpperCase();

    let where = { recipientAddress: normalized, claimed: false };
    if (earningIds.length > 0) {
      where = { ...where, id: { in: earningIds } };
    }

    const earnings = await prisma.royaltyEarning.findMany({ where });

    if (earnings.length === 0) {
      throw Object.assign(new Error('No unclaimed earnings found'), { statusCode: 404 });
    }

    await royaltyClaimQueue.add('claim-royalties', {
      walletAddress: normalized,
      earningIds: earnings.map((e) => e.id),
      amounts: earnings.map((e) => e.amount),
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });

    return {
      jobId: Date.now().toString(),
      status: 'queued',
      walletAddress: normalized,
      count: earnings.length,
      totalAmount: earnings.reduce((sum, e) => sum + BigInt(e.amount), 0n).toString(),
      message: 'Claim transaction queued for processing',
    };
  }

  async markAsClaimed(earningIds, txHash) {
    await prisma.royaltyEarning.updateMany({
      where: { id: { in: earningIds } },
      data: { claimed: true },
    });

    await RoyaltyReceipt.updateMany({
      where: { receiptId: { in: earningIds } },
      data: { claimed: true, claimTxHash: txHash },
    });
  }

  async getRoyaltyDistribution() {
    const cacheKey = 'analytics:royalty-distribution';
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const totalClaimed = await prisma.royaltyEarning.groupBy({
      by: ['recipientAddress'],
      where: { claimed: true },
      _sum: { amount: true },
    });

    const totalUnclaimed = await prisma.royaltyEarning.groupBy({
      by: ['recipientAddress'],
      where: { claimed: false },
      _sum: { amount: true },
    });

    const distribution = {};
    for (const r of totalClaimed) {
      distribution[r.recipientAddress] = distribution[r.recipientAddress] || { claimed: '0', unclaimed: '0' };
      distribution[r.recipientAddress].claimed = r._sum.amount.toString();
    }
    for (const r of totalUnclaimed) {
      distribution[r.recipientAddress] = distribution[r.recipientAddress] || { claimed: '0', unclaimed: '0' };
      distribution[r.recipientAddress].unclaimed = r._sum.amount.toString();
    }

    const result = {
      distribution: Object.entries(distribution).map(([address, amounts]) => ({
        recipientAddress: address,
        totalClaimed: amounts.claimed,
        totalUnclaimed: amounts.unclaimed,
      })),
    };

    await cacheService.set(cacheKey, result, 300);
    return result;
  }
}

module.exports = new RoyaltyService();
