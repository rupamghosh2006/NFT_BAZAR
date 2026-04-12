const redis = require('../configs/redis');

class CacheService {
  async get(key) {
    try {
      const data = await redis.get(key);
      if (!data) return null;
      try {
        return JSON.parse(data);
      } catch {
        return data;
      }
    } catch (err) {
      console.error('Cache get error:', err.message);
      return null;
    }
  }

  async set(key, value, ttlSeconds) {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      await redis.set(key, serialized, { ex: ttlSeconds });
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

  async delPattern(_pattern) {
    // Upstash HTTP doesn't support KEYS command in serverless environments
    // Individual keys must be tracked and deleted separately
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
