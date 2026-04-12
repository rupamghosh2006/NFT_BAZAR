const mintService = require('../services/mintService');

async function mint(req, res, next) {
  try {
    const { walletAddress } = req.user;
    const { name, image, metadataUri } = req.body;

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