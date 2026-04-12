const Redis = require('ioredis');
const config = require('./index');

const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
  lazyConnect: true,
  connectTimeout: 5000,
});

redis.on('error', () => {});
redis.on('connect', () => console.log('Redis connected'));

module.exports = redis;
