const { Worker, QueueEvents } = require('bullmq');
const { redisConfig } = require('../configs/queue');
const indexer = require('../indexer/indexer');

const worker = new Worker(
  'indexer-queue',
  async (job) => {
    const { txHash, ledger, operations, sourceAccount, createdAt } = job.data;
    await indexer.processTransaction(txHash, ledger, operations, sourceAccount, createdAt);
  },
  {
    connection: redisConfig,
    concurrency: 5,
    limiter: { max: 10, duration: 1000 },
  }
);

worker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err.message);
});

worker.on('error', (err) => {
  console.error('[Worker] Worker error:', err.message);
});

console.log('[Worker] Indexer worker started');

module.exports = worker;
