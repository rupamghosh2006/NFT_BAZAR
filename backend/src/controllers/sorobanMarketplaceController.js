const {
  buildListNftTransaction,
  processListingTransaction,
  buildBuyNftTransaction,
  processBuyTransaction,
} = require('../services/nftMarketplaceService');

/**
 * Build list NFT transaction
 */
async function buildListTx(req, res, next) {
  try {
    const { nftContractId, sellerAddress, tokenId, priceInStroops } = req.body;

    if (!nftContractId || !sellerAddress || !tokenId || !priceInStroops) {
      return res.status(400).json({
        success: false,
        error: { message: 'nftContractId, sellerAddress, tokenId, and priceInStroops are required' },
      });
    }

    const txData = await buildListNftTransaction(nftContractId, sellerAddress, tokenId, priceInStroops);

    res.status(200).json(txData);
  } catch (err) {
    next(err);
  }
}

/**
 * Submit list NFT transaction
 */
async function submitListTx(req, res, next) {
  try {
    const { signedTxXDR, listingRequestId, nftContractId, tokenId, sellerAddress, priceInStroops, txHash } = req.body;

    if (!signedTxXDR || !listingRequestId || !nftContractId || !tokenId || !sellerAddress || !priceInStroops) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing required fields' },
      });
    }

    const listing = await processListingTransaction(
      listingRequestId,
      txHash,
      nftContractId,
      tokenId,
      sellerAddress,
      priceInStroops
    );

    res.status(201).json({
      success: true,
      data: listing.data,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Build buy NFT transaction
 */
async function buildBuyTx(req, res, next) {
  try {
    const { nftContractId, buyerAddress, tokenId } = req.body;

    if (!nftContractId || !buyerAddress || !tokenId) {
      return res.status(400).json({
        success: false,
        error: { message: 'nftContractId, buyerAddress, and tokenId are required' },
      });
    }

    const txData = await buildBuyNftTransaction(nftContractId, buyerAddress, tokenId);

    res.status(200).json(txData);
  } catch (err) {
    next(err);
  }
}

/**
 * Submit buy NFT transaction
 */
async function submitBuyTx(req, res, next) {
  try {
    const { signedTxXDR, buyRequestId, nftContractId, tokenId, buyerAddress, price, txHash } = req.body;

    if (!signedTxXDR || !buyRequestId || !nftContractId || !tokenId || !buyerAddress || !price) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing required fields' },
      });
    }

    const sale = await processBuyTransaction(
      buyRequestId,
      txHash,
      nftContractId,
      tokenId,
      buyerAddress,
      price
    );

    res.status(201).json({
      success: true,
      data: sale.data,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { buildListTx, submitListTx, buildBuyTx, submitBuyTx };
