const { Queue } = require('bullmq');
const config = require('./index');

const redisConfig = {
  host: config.redis.host,
  port: config.redis.port,
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
};

const QUEUE_NAMES = {
  INDEXER: 'indexer-queue',
  NOTIFICATION: 'notification-queue',
  ROYALTY_CLAIM: 'royalty-claim-queue',
};

const cache = {};

function createQueue(name) {
  if (!cache[name]) {
    cache[name] = new Queue(name, { connection: redisConfig });
  }
  return cache[name];
}

function getIndexerQueue() { return createQueue(QUEUE_NAMES.INDEXER); }
function getNotificationQueue() { return createQueue(QUEUE_NAMES.NOTIFICATION); }
function getRoyaltyClaimQueue() { return createQueue(QUEUE_NAMES.ROYALTY_CLAIM); }

module.exports = {
  QUEUE_NAMES,
  redisConfig,
  createQueue,
  getIndexerQueue,
  getNotificationQueue,
  getRoyaltyClaimQueue,
};
