const mongoose = require('mongoose');

const royaltyReceiptSchema = new mongoose.Schema({
  receiptId: { type: String, required: true },
  saleId: { type: String, required: true },
  txHash: { type: String, required: true },
  recipientAddress: { type: String, required: true },
  role: { type: String, enum: ['creator', 'staker', 'treasury'], required: true },
  percentage: { type: Number, required: true },
  amount: { type: String, required: true },
  claimed: { type: Boolean, default: false },
  claimTxHash: { type: String },
  blockNumber: { type: Number },
  blockTimestamp: { type: Date, default: Date.now },
  indexedAt: { type: Date, default: Date.now },
}, { timestamps: true });

royaltyReceiptSchema.index({ receiptId: 1 }, { unique: true });
royaltyReceiptSchema.index({ saleId: 1 });
royaltyReceiptSchema.index({ recipientAddress: 1 });
royaltyReceiptSchema.index({ claimed: 1 });

module.exports = mongoose.model('RoyaltyReceipt', royaltyReceiptSchema);
