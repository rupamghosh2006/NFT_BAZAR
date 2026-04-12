const { Queue, Worker, QueueEvents } = require('bullmq');
const config = require('./index');

const redisConfig = {
  host: config.redis.host,
  port: config.redis.port,
};

const QUEUE_NAMES = {
  INDEXER: 'indexer-queue',
  NOTIFICATION: 'notification-queue',
  ROYALTY_CLAIM: 'royalty-claim-queue',
};

function createQueue(name) {
  return new Queue(name, { connection: redisConfig });
}

const indexerQueue = createQueue(QUEUE_NAMES.INDEXER);
const notificationQueue = createQueue(QUEUE_NAMES.NOTIFICATION);
const royaltyClaimQueue = createQueue(QUEUE_NAMES.ROYALTY_CLAIM);

module.exports = {
  QUEUE_NAMES,
  redisConfig,
  createQueue,
  indexerQueue,
  notificationQueue,
  royaltyClaimQueue,
};
