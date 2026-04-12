const royaltyService = require('../services/royaltyService');

async function getClaimableBalance(req, res, next) {
  try {
    const { walletAddress } = req.params;
    const result = await royaltyService.getClaimableBalance(walletAddress);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getEarningsHistory(req, res, next) {
  try {
    const { walletAddress } = req.params;
    const { page, limit } = req.query;

    const result = await royaltyService.getEarningsHistory(walletAddress, {
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '20', 10),
    });

    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function claim(req, res, next) {
  try {
    const { earningIds } = req.body;
    const { walletAddress } = req.user;

    const result = await royaltyService.claim(walletAddress, earningIds || []);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getDistribution(req, res, next) {
  try {
    const result = await royaltyService.getRoyaltyDistribution();
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = { getClaimableBalance, getEarningsHistory, claim, getDistribution };
