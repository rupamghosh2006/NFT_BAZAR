const { buildMintNftTransaction, processMintTransaction } = require('../services/nftMintService');
const sorobanService = require('../services/sorobanService');

/**
 * Build mint transaction (step 1)
 * Sends back unsigned transaction XDR for frontend to sign
 */
async function buildMintTx(req, res, next) {
  try {
    const { walletAddress, name, imageUrl } = req.body;

    if (!walletAddress || !imageUrl) {
      return res.status(400).json({
        success: false,
        error: { message: 'walletAddress and imageUrl are required' },
      });
    }

    const txData = await buildMintNftTransaction(walletAddress, name, imageUrl);

    res.status(200).json(txData);
  } catch (err) {
    next(err);
  }
}

/**
 * Submit mint transaction (step 2)
 * Frontend sends the signed transaction
 */
async function submitMintTx(req, res, next) {
  try {
    const { signedTxXDR, mintRequestId, tokenId } = req.body;

    if (!signedTxXDR || !mintRequestId || tokenId === undefined) {
      return res.status(400).json({
        success: false,
        error: { message: 'signedTxXDR, mintRequestId, and tokenId are required' },
      });
    }

    // Submit to Soroban
    const result = await sorobanService.submitTransaction(signedTxXDR);

    // Extract transaction info (will be in result based on Soroban response)
    const txHash = result.id || result.tx_id;

    // Get wallet and NFT info from cache (would need to parse from request)
    const { walletAddress, name, imageUrl } = req.body;

    // Process the transaction
    const nftData = await processMintTransaction(
      mintRequestId,
      txHash,
      tokenId,
      walletAddress,
      name,
      imageUrl
    );

    res.status(201).json({
      success: true,
      data: {
        nft: nftData.data,
        txHash,
        explorerUrl: `https://stellar.expert/explorer/testnet/contract/${nftData.data.contractAddress}`,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { buildMintTx, submitMintTx };
