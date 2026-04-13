const nftService = require('../services/nftService');

async function listNfts(req, res, next) {
  try {
    const { page, limit, owner, contractAddress, listed, minPrice, maxPrice, sortBy, sortOrder } = req.query;

    const result = await nftService.listNfts({
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '20', 10),
      owner,
      contractAddress,
      listed: listed !== undefined ? listed === 'true' : undefined,
      minPrice,
      maxPrice,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc',
    });

    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function getNft(req, res, next) {
  try {
    const { contractAddress, tokenId } = req.params;
    const nft = await nftService.getNftByToken(contractAddress, tokenId);

    if (!nft) {
      return res.status(404).json({ success: false, error: { message: 'NFT not found' } });
    }

    res.json({ success: true, data: nft });
  } catch (err) {
    next(err);
  }
}

async function getNftsByOwner(req, res, next) {
  try {
    const { walletAddress } = req.params;
    const { page, limit } = req.query;

    console.log(`[getNftsByOwner] walletAddress=${walletAddress}`);

    const result = await nftService.getNftsByOwner(walletAddress, {
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '20', 10),
    });

    console.log(`[getNftsByOwner] found ${result.data.length} NFTs for ${walletAddress}`);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[getNftsByOwner] error:', err.message);
    next(err);
  }
}

async function mintNft(req, res, next) {
  try {
    const { tokenId, contractAddress, metadataUri, name, image } = req.body;
    const { walletAddress } = req.user;

    if (!tokenId || !contractAddress) {
      return res.status(400).json({ success: false, error: { message: 'tokenId and contractAddress are required' } });
    }

    const nft = await nftService.mintNft({
      tokenId,
      contractAddress,
      ownerAddress: walletAddress,
      metadataUri,
      name,
      image,
    });

    res.status(201).json({ success: true, data: nft });
  } catch (err) {
    next(err);
  }
}

module.exports = { listNfts, getNft, getNftsByOwner, mintNft };
