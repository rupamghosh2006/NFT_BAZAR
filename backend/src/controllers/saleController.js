const saleService = require('../services/saleService');

async function listSales(req, res, next) {
  try {
    const { page, limit } = req.query;

    const result = await saleService.listSales({
      page: parseInt(page || '1', 10),
      limit: Math.min(parseInt(limit || '20', 10), 50),
    });

    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function getSalesByNft(req, res, next) {
  try {
    const { contractAddress, tokenId } = req.params;
    const { page, limit } = req.query;

    const result = await saleService.getSalesByNft(contractAddress, tokenId, {
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '20', 10),
    });

    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function getSalesByUser(req, res, next) {
  try {
    const { walletAddress } = req.params;
    const { page, limit, role } = req.query;

    const result = await saleService.getSalesByUser(walletAddress, {
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '20', 10),
      role,
    });

    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

module.exports = { listSales, getSalesByNft, getSalesByUser };
