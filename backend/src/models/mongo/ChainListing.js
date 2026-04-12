const mongoose = require('mongoose');

const chainListingSchema = new mongoose.Schema({
  listingId: { type: String, required: true },
  nftId: { type: String, required: true },
  contractAddress: { type: String, required: true },
  tokenId: { type: String, required: true },
  sellerAddress: { type: String, required: true },
  price: { type: String, required: true },
  txHash: { type: String },
  blockNumber: { type: Number },
  blockTimestamp: { type: Date, default: Date.now },
  active: { type: Boolean, default: true },
  indexedAt: { type: Date, default: Date.now },
}, { timestamps: true });

chainListingSchema.index({ listingId: 1 }, { unique: true });
chainListingSchema.index({ contractAddress: 1, tokenId: 1 });
chainListingSchema.index({ sellerAddress: 1 });
chainListingSchema.index({ active: 1 });
chainListingSchema.index({ blockNumber: 1 });

module.exports = mongoose.model('ChainListing', chainListingSchema);
