const sorobanService = require('./sorobanService');
const prisma = require('../db/prisma');
const { ChainNFT } = require('../models/mongo');
const cacheService = require('./cacheService');
const config = require('../configs');

/**
 * Mint NFT via Soroban contract
 * Builds a transaction that the frontend signs with Freighter
 */
async function buildMintNftTransaction(toAddress, name, imageUrl) {
  try {
    if (!toAddress) {
      throw new Error('toAddress is required');
    }

    const nftContractId = config.contracts.nftCollectionId;
    if (!nftContractId) {
      throw new Error('NFT_COLLECTION_ID not configured');
    }

    const adminAddress = process.env.STELLAR_SOURCE || 'GAYWZSX43WUBRHM3F2QCWBL6ZOYSH7V5EOQOYMG6SMTGMM24RFEFCMHC';

    // Build arguments for mint function
    // mint(env: Env, to: Address, token_uri: String) -> u64
    const args = [
      sorobanService.addressToScVal(toAddress),
      sorobanService.stringToScVal(imageUrl),
    ];

    // Build the transaction (not signed yet)
    // The transaction source is the user's wallet (toAddress)
    // They will sign it with Freighter
    const txData = await sorobanService.buildContractInvokeTx(
      nftContractId,
      'mint',
      args,
      toAddress  // User's address signs the transaction
    );

    // Store temporary mint request in cache for tracking
    const mintRequestId = `mint-${toAddress}-${Date.now()}`;
    await cacheService.set(
      `mint-request:${mintRequestId}`,
      {
        toAddress,
        name,
        imageUrl,
        createdAt: new Date().toISOString(),
      },
      300 // 5 minute TTL
    );

    return {
      success: true,
      data: {
        transactionXDR: txData.transactionXDR,
        contractId: nftContractId,
        method: 'mint',
        mintRequestId,
        requiresSignature: true,
        signerAddress: toAddress,
      },
    };
  } catch (error) {
    console.error('Error building mint transaction:', error);
    throw error;
  }
}

/**
 * Process completed mint transaction
 * Called after frontend submits the signed transaction
 */
async function processMintTransaction(mintRequestId, txHash, tokenId, toAddress, name, imageUrl) {
  try {
    // Verify mint request exists
    const mintRequest = await cacheService.get(`mint-request:${mintRequestId}`);
    if (!mintRequest) {
      throw new Error('Mint request not found or expired');
    }

    // Create NFT record in database
    const nft = await prisma.nFT.create({
      data: {
        tokenId: String(tokenId),
        contractAddress: config.contracts.nftCollectionId,
        ownerAddress: toAddress.toUpperCase(),
        metadataUri: imageUrl,
        name: name || `NFT #${tokenId}`,
        image: imageUrl,
        txHash, // Store on-chain transaction hash
      },
    });

    // Store in MongoDB for indexing
    await ChainNFT.findOneAndUpdate(
      { contractAddress: config.contracts.nftCollectionId, tokenId: String(tokenId) },
      {
        contractAddress: config.contracts.nftCollectionId,
        tokenId: String(tokenId),
        ownerAddress: toAddress.toUpperCase(),
        name: name || `NFT #${tokenId}`,
        image: imageUrl,
        metadataUri: imageUrl,
        mintedBy: toAddress.toUpperCase(),
        mintedAt: new Date(),
        indexedAt: new Date(),
        txHash,
      },
      { upsert: true, new: true }
    );

    // Clear cache
    await cacheService.del('nfts:list');
    await cacheService.del(`nfts:owner:${toAddress.toUpperCase()}`);
    await cacheService.del(`mint-request:${mintRequestId}`);

    return {
      success: true,
      data: nft,
    };
  } catch (error) {
    console.error('Error processing mint transaction:', error);
    throw error;
  }
}

module.exports = {
  buildMintNftTransaction,
  processMintTransaction,
};
