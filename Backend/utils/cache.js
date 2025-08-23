const Redis = require('redis');

class CacheManager {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.fallbackCache = new Map(); // In-memory fallback
    this.maxRetries = 3;
    this.retryCount = 0;
    this.retryDelay = 5000; // 5 seconds
  }

  async connect() {
    if (this.isConnected) return;

    try {
      // Parse Redis URL if provided, otherwise use individual config
      const redisUrl = process.env.REDIS_URL;
      
      if (redisUrl) {
        // Parse Redis URL format: redis://:password@host:port
        console.log('🔗 Connecting to Redis via URL...');
        this.client = Redis.createClient({
          url: redisUrl,
          socket: {
            connectTimeout: 5000,
            reconnectStrategy: (retries) => {
              if (retries >= this.maxRetries) {
                console.log('❌ Max Redis connection retries exceeded, using fallback cache');
                return false;
              }
              return Math.min(retries * 1000, 5000);
            }
          }
        });
      } else {
        // Use individual config parameters
        console.log('🔗 Connecting to Redis via config...');
        this.client = Redis.createClient({
          socket: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT) || 6379,
            connectTimeout: 5000,
            reconnectStrategy: (retries) => {
              if (retries >= this.maxRetries) {
                console.log('❌ Max Redis connection retries exceeded, using fallback cache');
                return false;
              }
              return Math.min(retries * 1000, 5000);
            }
          },
          password: process.env.REDIS_PASSWORD,
        });
      }

      this.client.on('error', (err) => {
        console.warn('⚠️ Redis connection error, using fallback cache:', err.message);
        this.isConnected = false;
        this.retryCount++;
      });

      this.client.on('connect', () => {
        console.log('✅ Connected to Redis');
        this.isConnected = true;
        this.retryCount = 0;
      });

      this.client.on('reconnecting', () => {
        console.log('🔄 Reconnecting to Redis...');
      });

      this.client.on('end', () => {
        console.log('🔌 Redis connection closed');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      console.warn('⚠️ Failed to connect to Redis, using fallback cache:', error.message);
      // Graceful degradation - use in-memory cache
      this.client = null;
      this.isConnected = false;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('ℹ️ Continuing with in-memory fallback cache...');
      }
    }
  }

  async getCachedData(key) {
    if (this.isConnected && this.client) {
      try {
        const data = await this.client.get(key);
        return data ? JSON.parse(data) : null;
      } catch (error) {
        console.warn('Redis get error, using fallback:', error.message);
        return this.fallbackCache.get(key) || null;
      }
    }
    
    // Use fallback cache
    return this.fallbackCache.get(key) || null;
  }

  async cacheData(key, data, ttl = 3600) {
    if (this.isConnected && this.client) {
      try {
        await this.client.setEx(key, ttl, JSON.stringify(data));
        return true;
      } catch (error) {
        console.warn('Redis set error, using fallback:', error.message);
        this.fallbackCache.set(key, data);
        return true;
      }
    }

    // Use fallback cache with TTL simulation
    this.fallbackCache.set(key, data);
    // Simple TTL cleanup for fallback (optional)
    if (ttl > 0) {
      setTimeout(() => {
        this.fallbackCache.delete(key);
      }, ttl * 1000);
    }
    return true;
  }

  async invalidateCache(pattern) {
    if (this.isConnected && this.client) {
      try {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          await this.client.del(keys);
        }
        return true;
      } catch (error) {
        console.warn('Redis invalidation error, using fallback:', error.message);
        // Fallback: clear keys matching pattern from in-memory cache
        for (const key of this.fallbackCache.keys()) {
          if (key.includes(pattern.replace('*', ''))) {
            this.fallbackCache.delete(key);
          }
        }
        return true;
      }
    }

    // Use fallback cache
    for (const key of this.fallbackCache.keys()) {
      if (key.includes(pattern.replace('*', ''))) {
        this.fallbackCache.delete(key);
      }
    }
    return true;
  }

  async clearAll() {
    if (this.isConnected && this.client) {
      try {
        await this.client.flushAll();
        this.fallbackCache.clear(); // Also clear fallback
        return true;
      } catch (error) {
        console.warn('Redis clear error, using fallback:', error.message);
        this.fallbackCache.clear();
        return true;
      }
    }

    // Use fallback cache
    this.fallbackCache.clear();
    return true;
  }

  async quit() {
    if (this.client && this.isConnected) {
      try {
        await this.client.quit();
        this.isConnected = false;
        console.log('Redis connection closed');
      } catch (error) {
        console.error('Error closing Redis connection:', error);
      }
    }
  }
}

const cacheManager = new CacheManager();

// Initialize cache connection
cacheManager.connect();

module.exports = {
  getCachedData: (key) => cacheManager.getCachedData(key),
  cacheData: (key, data, ttl) => cacheManager.cacheData(key, data, ttl),
  invalidateCache: (pattern) => cacheManager.invalidateCache(pattern),
  clearCache: () => cacheManager.clearAll(),
  connect: () => cacheManager.connect(),
  quit: () => cacheManager.quit()
};
