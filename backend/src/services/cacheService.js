const redis = require('../configs/redis');

class CacheService {
  async get(key) {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error('Cache get error:', err.message);
      return null;
    }
  }

  async set(key, value, ttlSeconds) {
    try {
      await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (err) {
      console.error('Cache set error:', err.message);
    }
  }

  async del(key) {
    try {
      await redis.del(key);
    } catch (err) {
      console.error('Cache del error:', err.message);
    }
  }

  async delPattern(pattern) {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (err) {
      console.error('Cache delPattern error:', err.message);
    }
  }

  buildKey(prefix, params) {
    const parts = [prefix];
    if (params) {
      const sorted = Object.keys(params).sort();
      for (const key of sorted) {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          parts.push(`${key}:${params[key]}`);
        }
      }
    }
    return parts.join(':');
  }
}

module.exports = new CacheService();
