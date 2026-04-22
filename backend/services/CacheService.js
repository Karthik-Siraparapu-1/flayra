/**
 * Advanced High-Performance Cache Service (Elite DSA)
 * Provides in-memory storage with TTL (Time-To-Live) support.
 * Designed to be swapped with Redis for extreme scale.
 */

class CacheEntry {
    constructor(data, ttlSeconds) {
        this.data = data;
        this.expiresAt = Date.now() + (ttlSeconds * 1000);
    }

    isExpired() {
        return Date.now() > this.expiresAt;
    }
}

const cacheMap = new Map();

/**
 * Set a value in the cache with a specific TTL
 */
exports.set = (key, value, ttlSeconds = 300) => {
    cacheMap.set(key, new CacheEntry(value, ttlSeconds));
};

/**
 * Get a value from the cache if it hasn't expired
 */
exports.get = (key) => {
    const entry = cacheMap.get(key);
    
    if (!entry) return null;

    if (entry.isExpired()) {
        cacheMap.delete(key);
        return null;
    }

    return entry.data;
};

/**
 * Delete a specific cache key
 */
exports.delete = (key) => {
    cacheMap.delete(key);
};

/**
 * Clear all cache entries
 */
exports.clearAll = () => {
    cacheMap.clear();
};

/**
 * Periodic Cleanup (Every 5 minutes)
 * Ensures expired memory is freed up.
 */
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of cacheMap.entries()) {
        if (entry.expiresAt < now) {
            cacheMap.delete(key);
        }
    }
}, 300000);
