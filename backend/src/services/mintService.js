const { server, StellarSdk } = require('../configs/stellar');
const prisma = require('../db/prisma');
const { ChainNFT } = require('../models/mongo');
const cacheService = require('./cacheService');
const config = require('../configs');

async function mintNft({ toAddress, name, image, metadataUri }) {
  if (!toAddress) throw Object.assign(new Error('toAddress is required'), { statusCode: 400 });

  const tokenId = `stellar-${Date.now()}-${Math.floor(Math.random() * 999999)}`;

  let user = await prisma.user.findUnique({ where: { walletAddress: toAddress.toUpperCase() } });
  if (!user) {
    user = await prisma.user.create({
      data: { walletAddress: toAddress.toUpperCase(), nonce: '' },
    });
  }

  const nft = await prisma.nFT.create({
    data: {
      tokenId,
      contractAddress: config.contracts.nftCollectionId,
      ownerAddress: toAddress.toUpperCase(),
      metadataUri: metadataUri || '',
      name: name || `NFT #${tokenId.slice(-6)}`,
      image: image || '',
    },
  });

  await ChainNFT.findOneAndUpdate(
    { contractAddress: config.contracts.nftCollectionId, tokenId },
    {
      contractAddress: config.contracts.nftCollectionId,
      tokenId,
      ownerAddress: toAddress.toUpperCase(),
      name: name || `NFT #${tokenId.slice(-6)}`,
      image: image || '',
      metadataUri: metadataUri || '',
      mintedBy: toAddress.toUpperCase(),
      mintedAt: new Date(),
      indexedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  await cacheService.del('nfts:list');
  await cacheService.del(`nfts:owner:${toAddress.toUpperCase()}`);

  return nft;
}

module.exports = { mintNft };