const mongoose = require('mongoose');

const chainNFTsSchema = new mongoose.Schema({
  contractAddress: { type: String, required: true },
  tokenId: { type: String, required: true },
  ownerAddress: { type: String, required: true },
  name: { type: String },
  description: { type: String },
  image: { type: String },
  metadataUri: { type: String },
  attributes: { type: mongoose.Schema.Types.Mixed, default: {} },
  mintedBy: { type: String },
  mintedAt: { type: Date },
  lastSalePrice: { type: String },
  lastSaleTxHash: { type: String },
  indexedAt: { type: Date, default: Date.now },
}, { timestamps: true });

chainNFTsSchema.index({ contractAddress: 1, tokenId: 1 }, { unique: true });
chainNFTsSchema.index({ ownerAddress: 1 });
chainNFTsSchema.index({ contractAddress: 1 });
chainNFTsSchema.index({ tokenId: 1 });

module.exports = mongoose.model('ChainNFT', chainNFTsSchema);
