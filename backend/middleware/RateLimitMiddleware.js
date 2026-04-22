/**
 * Elite Rate Limiting Middleware (Security Phase 9)
 * Implements the Token Bucket algorithm to protect Flayra APIs from spam.
 */

const userBuckets = new Map();

/**
 * Configuration for different Elite tiers
 * Currently: 10 requests per minute for swiping/OTP, 60 for others.
 */
const CONFIG = {
    DEFAULT: { capacity: 60, refillRate: 1 }, // 60 per minute
    STRICT: { capacity: 10, refillRate: 0.16 } // 10 per minute (~1 every 6s)
};

const getRateLimiter = (tier = 'DEFAULT') => {
    const { capacity, refillRate } = CONFIG[tier];

    return (req, res, next) => {
        const userId = req.user ? req.user._id.toString() : req.ip;
        const key = `${tier}:${userId}`;
        
        let bucket = userBuckets.get(key);
        const now = Date.now();

        if (!bucket) {
            bucket = { tokens: capacity, lastRefill: now };
        } else {
            // Refill tokens based on time elapsed
            const elapsed = (now - bucket.lastRefill) / 1000;
            bucket.tokens = Math.min(capacity, bucket.tokens + (elapsed * refillRate));
            bucket.lastRefill = now;
        }

        if (bucket.tokens >= 1) {
            bucket.tokens -= 1;
            userBuckets.set(key, bucket);
            next();
        } else {
            console.warn(`[SECURITY] Rate Limit Exceeded for User: ${userId} on Tier: ${tier}`);
            res.status(429).json({ 
                error: 'Too many requests', 
                message: 'Flayra Elite protects its users from spam. Please slow down.'
            });
        }
    };
};

exports.limitDefault = getRateLimiter('DEFAULT');
exports.limitStrict = getRateLimiter('STRICT');

/**
 * Periodically clear dead user buckets to prevent memory leaks
 */
setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of userBuckets.entries()) {
        if (now - bucket.lastRefill > 300000) { // 5 minutes inactivity
            userBuckets.delete(key);
        }
    }
}, 300000);
