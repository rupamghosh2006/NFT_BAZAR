const mintService = require('../services/mintService');

async function mint(req, res, next) {
  try {
    const { walletAddress, name, image, metadataUri } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: { message: 'walletAddress is required in request body' },
      });
    }

    const nft = await mintService.mintNft({
      toAddress: walletAddress,
      name,
      image,
      metadataUri,
    });

    res.status(201).json({ success: true, data: nft });
  } catch (err) {
    next(err);
  }
}

module.exports = { mint };
