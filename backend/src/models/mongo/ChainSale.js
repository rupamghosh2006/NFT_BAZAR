const mongoose = require('mongoose');

const chainSaleSchema = new mongoose.Schema({
  saleId: { type: String, required: true },
  listingId: { type: String, required: true },
  nftId: { type: String, required: true },
  contractAddress: { type: String, required: true },
  tokenId: { type: String, required: true },
  buyerAddress: { type: String, required: true },
  sellerAddress: { type: String, required: true },
  price: { type: String, required: true },
  royaltyAmount: { type: String, default: '0' },
  txHash: { type: String, required: true },
  blockNumber: { type: Number },
  blockTimestamp: { type: Date, default: Date.now },
  indexedAt: { type: Date, default: Date.now },
}, { timestamps: true });

chainSaleSchema.index({ saleId: 1 }, { unique: true });
chainSaleSchema.index({ txHash: 1 }, { unique: true });
chainSaleSchema.index({ contractAddress: 1, tokenId: 1 });
chainSaleSchema.index({ buyerAddress: 1 });
chainSaleSchema.index({ sellerAddress: 1 });
chainSaleSchema.index({ blockNumber: 1 });
chainSaleSchema.index({ blockTimestamp: -1 });

module.exports = mongoose.model('ChainSale', chainSaleSchema);
