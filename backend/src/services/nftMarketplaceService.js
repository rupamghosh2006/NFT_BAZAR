const sorobanService = require('./sorobanService');
const prisma = require('../db/prisma');
const { ChainListing, ChainSale } = require('../models/mongo');
const cacheService = require('./cacheService');
const config = require('../configs');

/**
 * Build transaction to list NFT on marketplace
 * list_nft(env: Env, nft: Address, seller: Address, token_id: u64, price: i128)
 */
async function buildListNftTransaction(nftContractId, sellerAddress, tokenId, priceInStroops) {
  try {
    if (!nftContractId || !sellerAddress || tokenId === undefined || !priceInStroops) {
      throw new Error('Missing required parameters: nftContractId, sellerAddress, tokenId, priceInStroops');
    }

    const marketplaceContractId = config.contracts.marketplaceId;
    if (!marketplaceContractId) {
      throw new Error('MARKETPLACE_ID not configured');
    }

    const adminAddress = process.env.STELLAR_SOURCE || 'GAYWZSX43WUBRHM3F2QCWBL6ZOYSH7V5EOQOYMG6SMTGMM24RFEFCMHC';

    // Build arguments for list_nft function
    // list_nft(env: Env, nft: Address, seller: Address, token_id: u64, price: i128)
    const args = [
      sorobanService.addressToScVal(nftContractId),
      sorobanService.addressToScVal(sellerAddress),
      sorobanService.u64ToScVal(tokenId),
      sorobanService.i128ToScVal(priceInStroops),
    ];

    const txData = await sorobanService.buildContractInvokeTx(
      marketplaceContractId,
      'list_nft',
      args,
      adminAddress
    );

    // Store listing request
    const listingRequestId = `list-${nftContractId}-${tokenId}-${Date.now()}`;
    await cacheService.set(
      `listing-request:${listingRequestId}`,
      {
        nftContractId,
        sellerAddress,
        tokenId,
        priceInStroops,
        createdAt: new Date().toISOString(),
      },
      300
    );

    return {
      success: true,
      data: {
        transactionXDR: txData.transactionXDR,
        contractId: marketplaceContractId,
        method: 'list_nft',
        listingRequestId,
        requiresSignature: true,
        signerAddress: sellerAddress,
      },
    };
  } catch (error) {
    console.error('Error building list NFT transaction:', error);
    throw error;
  }
}

/**
 * Process completed listing transaction
 */
async function processListingTransaction(listingRequestId, txHash, nftContractId, tokenId, sellerAddress, priceInStroops) {
  try {
    const listingRequest = await cacheService.get(`listing-request:${listingRequestId}`);
    if (!listingRequest) {
      throw new Error('Listing request not found or expired');
    }

    // Create listing record
    const listing = await prisma.listing.create({
      data: {
        contractAddress: nftContractId,
        tokenId: String(tokenId),
        sellerAddress: sellerAddress.toUpperCase(),
        price: priceInStroops.toString(),
        active: true,
        txHash,
      },
    });

    // Store in MongoDB
    await ChainListing.findOneAndUpdate(
      { contractAddress: nftContractId, tokenId: String(tokenId) },
      {
        contractAddress: nftContractId,
        tokenId: String(tokenId),
        seller: sellerAddress.toUpperCase(),
        price: priceInStroops.toString(),
        active: true,
        listedAt: new Date(),
        txHash,
      },
      { upsert: true, new: true }
    );

    // Clear cache
    await cacheService.del('listings:list');
    await cacheService.del(`listing-request:${listingRequestId}`);

    return {
      success: true,
      data: listing,
    };
  } catch (error) {
    console.error('Error processing listing transaction:', error);
    throw error;
  }
}

/**
 * Build transaction to buy NFT from marketplace
 * buy_nft(env: Env, nft: Address, buyer: Address, token_id: u64)
 */
async function buildBuyNftTransaction(nftContractId, buyerAddress, tokenId) {
  try {
    if (!nftContractId || !buyerAddress || tokenId === undefined) {
      throw new Error('Missing required parameters: nftContractId, buyerAddress, tokenId');
    }

    const marketplaceContractId = config.contracts.marketplaceId;
    if (!marketplaceContractId) {
      throw new Error('MARKETPLACE_ID not configured');
    }

    const adminAddress = process.env.STELLAR_SOURCE || 'GAYWZSX43WUBRHM3F2QCWBL6ZOYSH7V5EOQOYMG6SMTGMM24RFEFCMHC';

    // Build arguments for buy_nft function
    // buy_nft(env: Env, nft: Address, buyer: Address, token_id: u64)
    const args = [
      sorobanService.addressToScVal(nftContractId),
      sorobanService.addressToScVal(buyerAddress),
      sorobanService.u64ToScVal(tokenId),
    ];

    const txData = await sorobanService.buildContractInvokeTx(
      marketplaceContractId,
      'buy_nft',
      args,
      adminAddress
    );

    // Store buy request
    const buyRequestId = `buy-${nftContractId}-${tokenId}-${Date.now()}`;
    await cacheService.set(
      `buy-request:${buyRequestId}`,
      {
        nftContractId,
        buyerAddress,
        tokenId,
        createdAt: new Date().toISOString(),
      },
      300
    );

    return {
      success: true,
      data: {
        transactionXDR: txData.transactionXDR,
        contractId: marketplaceContractId,
        method: 'buy_nft',
        buyRequestId,
        requiresSignature: true,
        signerAddress: buyerAddress,
      },
    };
  } catch (error) {
    console.error('Error building buy NFT transaction:', error);
    throw error;
  }
}

/**
 * Process completed buy transaction
 */
async function processBuyTransaction(buyRequestId, txHash, nftContractId, tokenId, buyerAddress, price) {
  try {
    const buyRequest = await cacheService.get(`buy-request:${buyRequestId}`);
    if (!buyRequest) {
      throw new Error('Buy request not found or expired');
    }

    // Get listing info
    const listing = await prisma.listing.findUnique({
      where: {
        contractAddress_tokenId: {
          contractAddress: nftContractId,
          tokenId: String(tokenId),
        },
      },
    });

    if (!listing) {
      throw new Error('Listing not found');
    }

    // Create sale record
    const sale = await prisma.sale.create({
      data: {
        contractAddress: nftContractId,
        tokenId: String(tokenId),
        buyerAddress: buyerAddress.toUpperCase(),
        sellerAddress: listing.sellerAddress,
        price: price.toString(),
        txHash,
      },
    });

    // Store in MongoDB
    await ChainSale.findOneAndUpdate(
      { contractAddress: nftContractId, tokenId: String(tokenId), txHash },
      {
        contractAddress: nftContractId,
        tokenId: String(tokenId),
        buyer: buyerAddress.toUpperCase(),
        seller: listing.sellerAddress,
        price: price.toString(),
        soldAt: new Date(),
        txHash,
      },
      { upsert: true, new: true }
    );

    // Update NFT owner
    await prisma.nFT.update({
      where: {
        contractAddress_tokenId: {
          contractAddress: nftContractId,
          tokenId: String(tokenId),
        },
      },
      data: {
        ownerAddress: buyerAddress.toUpperCase(),
      },
    });

    // Deactivate listing
    await prisma.listing.update({
      where: {
        contractAddress_tokenId: {
          contractAddress: nftContractId,
          tokenId: String(tokenId),
        },
      },
      data: {
        active: false,
      },
    });

    // Clear cache
    await cacheService.del('sales:list');
    await cacheService.del('listings:list');
    await cacheService.del(`buy-request:${buyRequestId}`);

    return {
      success: true,
      data: sale,
    };
  } catch (error) {
    console.error('Error processing buy transaction:', error);
    throw error;
  }
}

module.exports = {
  buildListNftTransaction,
  processListingTransaction,
  buildBuyNftTransaction,
  processBuyTransaction,
};
