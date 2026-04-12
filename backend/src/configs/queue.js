const { Queue } = require('bullmq');
const Redis = require('ioredis');

function buildRedisConfig() {
  const url = process.env.UPSTASH_REDIS_URL;
  if (url) {
    try {
      const parsed = new URL(url);
      return {
        host: parsed.hostname,
        port: parseInt(parsed.port || '6379', 10),
        password: parsed.password || undefined,
        tls: parsed.protocol === 'rediss:' ? {} : undefined,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
      };
    } catch {
      // fallback below
    }
  }
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
  };
}

const redisConfig = buildRedisConfig();

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
