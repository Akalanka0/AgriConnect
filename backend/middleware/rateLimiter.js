/**
 * Simple Rate Limiting Middleware
 * Prevents brute force attacks on login/register endpoints
 * 
 * Note: For production, consider using express-rate-limit package
 * npm install express-rate-limit
 */

// In-memory store (use Redis for production)
const requestCounts = new Map();

/**
 * Rate limiter middleware
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 */
export const rateLimiter = (maxRequests = 5, windowMs = 15 * 60 * 1000) => {
    return (req, res, next) => {
        const key = req.ip || req.connection.remoteAddress;
        const now = Date.now();
        const windowStart = now - windowMs;

        // Get or initialize request history for this IP
        if (!requestCounts.has(key)) {
            requestCounts.set(key, []);
        }

        const requests = requestCounts.get(key);

        // Filter out requests outside the time window
        const recentRequests = requests.filter(timestamp => timestamp > windowStart);

        // Check if limit exceeded
        if (recentRequests.length >= maxRequests) {
            const resetTime = new Date(recentRequests[0] + windowMs);
            return res.status(429).json({
                success: false,
                error: {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: 'Too many requests. Please try again later.',
                    retryAfter: resetTime.toISOString()
                }
            });
        }

        // Add current request timestamp
        recentRequests.push(now);
        requestCounts.set(key, recentRequests);

        // Clean up old entries periodically (every hour)
        if (Math.random() < 0.01) { // 1% chance on each request
            for (const [k, v] of requestCounts.entries()) {
                const recent = v.filter(timestamp => timestamp > windowStart);
                if (recent.length === 0) {
                    requestCounts.delete(k);
                } else {
                    requestCounts.set(k, recent);
                }
            }
        }

        next();
    };
};

/**
 * Stricter rate limiter for login endpoints
 */
export const loginRateLimiter = rateLimiter(5, 15 * 60 * 1000); // 5 requests per 15 minutes

/**
 * Standard rate limiter for registration
 */
export const registerRateLimiter = rateLimiter(3, 60 * 60 * 1000); // 3 requests per hour
