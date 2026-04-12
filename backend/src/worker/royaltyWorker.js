const { Worker } = require('bullmq');
const { redisConfig } = require('../configs/queue');
const royaltyService = require('../services/royaltyService');
const { getSourceKeypair, StellarSdk } = require('../configs/stellar');
const config = require('../configs');

const worker = new Worker(
  'royalty-claim-queue',
  async (job) => {
    const { walletAddress, earningIds, amounts } = job.data;
    console.log(`[RoyaltyWorker] Processing claim for ${walletAddress}, ${earningIds.length} earnings`);

    const keypair = getSourceKeypair();
    if (!keypair) {
      throw new Error('Stellar source keypair not configured for claims');
    }

    const totalAmount = amounts.reduce((sum, a) => sum + BigInt(a), 0n).toString();

    console.log(`[RoyaltyWorker] Would submit claim tx for ${totalAmount} to ${walletAddress}`);

    const simulatedTxHash = `simulated_${Date.now()}_${walletAddress}`;

    await royaltyService.markAsClaimed(earningIds, simulatedTxHash);

    return { txHash: simulatedTxHash, walletAddress, earningIds };
  },
  {
    connection: redisConfig,
    concurrency: 2,
  }
);

worker.on('completed', (job) => {
  console.log(`[RoyaltyWorker] Claim job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`[RoyaltyWorker] Claim job ${job?.id} failed:`, err.message);
});

console.log('[Worker] Royalty claim worker started');

module.exports = worker;
