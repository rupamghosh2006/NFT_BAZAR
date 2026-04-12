const authService = require('../services/authService');
const stellarService = require('../services/stellarService');

async function getNonce(req, res, next) {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ success: false, error: { message: 'walletAddress is required' } });
    }

    if (!stellarService.validateAddress(walletAddress)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid Stellar address' } });
    }

    const result = await authService.getNonce(walletAddress);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function verify(req, res, next) {
  try {
    const { walletAddress, signature, message } = req.body;

    if (!walletAddress || !signature) {
      return res.status(400).json({ success: false, error: { message: 'walletAddress and signature are required' } });
    }

    const result = await authService.verifyAndLogin(walletAddress, signature, message);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = { getNonce, verify };
