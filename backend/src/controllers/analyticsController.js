const analyticsService = require('../services/analyticsService');

async function getVolume(req, res, next) {
  try {
    const { period } = req.query;
    const result = await analyticsService.getVolume({ period });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getTopNfts(req, res, next) {
  try {
    const { limit } = req.query;
    const result = await analyticsService.getTopNfts({ limit: parseInt(limit || '10', 10) });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function getMarketStats(req, res, next) {
  try {
    const result = await analyticsService.getMarketStats();
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = { getVolume, getTopNfts, getMarketStats };
