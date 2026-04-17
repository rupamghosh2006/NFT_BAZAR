const { buildMintNftTransaction, processMintTransaction } = require('../services/nftMintService');
const sorobanService = require('../services/sorobanService');
const { xdr } = require('@stellar/stellar-sdk');

/**
 * Build mint transaction (step 1)
 * Returns unsigned transaction XDR for frontend to sign with Freighter
 * User pays gas fees
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
 * Frontend sends back the signed transaction
 * Backend validates and submits to Soroban network
 */
async function submitMintTx(req, res, next) {
  try {
    const { signedTxXDR, mintRequestId, walletAddress, name, imageUrl } = req.body;

    if (!signedTxXDR || !mintRequestId) {
      return res.status(400).json({
        success: false,
        error: { message: 'signedTxXDR and mintRequestId are required' },
      });
    }

    // Submit signed transaction to Soroban network
    const result = await sorobanService.submitTransaction(signedTxXDR);

    // Check if transaction had an error
    if (result.status === 'ERROR') {
      console.error('Contract execution error:', result.errorResult);
      
      return res.status(400).json({
        success: false,
        error: { 
          message: 'Contract execution failed',
          details: result.errorResult?._attributes || result.errorResult,
          txHash: result.hash
        },
      });
    }

    // Extract transaction hash
    const txHash = result.id || result.hash;

    // Extract gas fee information
    // result.ledger contains the ledger information
    // result.resultMetaXdr contains transaction metadata with fee info
    let gasFeeStroops = 0;
    let gasFeeLumens = 0;
    
    try {
      // The fee is encoded in the transaction metadata
      if (result.resultMetaXdr) {
        // Parse the XDR to get fee information
        const meta = xdr.TransactionMeta.fromXDR(result.resultMetaXdr, 'base64');
        // Fee information is in different formats depending on transaction version
        // Try to extract from the result
        if (meta.v === 3 && meta.v3()) {
          // V3 format with soroban
          const txResult = meta.v3().txResult();
          if (txResult && txResult.result()) {
            const feeCharged = txResult.result().feeCharged?.();
            gasFeeStroops = feeCharged ? parseInt(feeCharged.toString()) : 0;
          }
        }
      }
    } catch (e) {
      console.log('Note: Could not extract gas fee from metadata:', e.message);
    }
    
    // Convert stroops to lumens (1 lumen = 10,000,000 stroops)
    gasFeeLumens = (gasFeeStroops / 10000000).toFixed(7);

    // Generate token ID based on timestamp + random
    const tokenId = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 10000);

    // Process the transaction result and create NFT record
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
        explorerUrl: `https://stellar.expert/explorer/testnet/tx/${txHash}`,
        gasFeeLumens,
        gasFeeStroops,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { buildMintTx, submitMintTx };
