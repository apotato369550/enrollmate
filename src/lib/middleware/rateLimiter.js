/**
 * Simple in-memory rate limiter for API endpoints
 *
 * Usage in API route:
 *
 * import { rateLimit } from '../../../lib/middleware/rateLimiter.js';
 *
 * const limiter = rateLimit({ maxRequests: 10, windowMs: 60000 });
 *
 * export async function POST(request) {
 *   const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
 *   if (!limiter.check(clientIp)) {
 *     return Response.json({ error: 'Too many requests' }, { status: 429 });
 *   }
 *
 *   // Your endpoint code here
 * }
 */

class RateLimiter {
  constructor(maxRequests = 100, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();

    // Clean up old entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  check(identifier) {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get request history for this identifier
    let requests = this.requests.get(identifier) || [];

    // Filter out requests outside the time window
    requests = requests.filter(timestamp => timestamp > windowStart);

    // Check if limit exceeded
    if (requests.length >= this.maxRequests) {
      return false;
    }

    // Record this request
    requests.push(now);
    this.requests.set(identifier, requests);

    return true;
  }

  reset(identifier) {
    this.requests.delete(identifier);
  }

  cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    for (const [identifier, requests] of this.requests.entries()) {
      const filteredRequests = requests.filter(
        timestamp => timestamp > windowStart
      );

      if (filteredRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, filteredRequests);
      }
    }
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.requests.clear();
  }

  // Get stats for monitoring
  getStats(identifier) {
    const requests = this.requests.get(identifier) || [];
    const now = Date.now();
    const windowStart = now - this.windowMs;

    return {
      identifier,
      requestCount: requests.filter(t => t > windowStart).length,
      maxRequests: this.maxRequests,
      windowMs: this.windowMs,
      isLimited: requests.length >= this.maxRequests,
    };
  }
}

// Create per-endpoint limiters
const limiters = {};

/**
 * Create or get rate limiter for endpoint
 *
 * @param {Object} options - Limiter options
 * @param {number} options.maxRequests - Max requests allowed
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {string} options.key - Unique key for this limiter (default: random)
 *
 * @returns {RateLimiter} Rate limiter instance
 */
export function rateLimit({
  maxRequests = 100,
  windowMs = 60000,
  key = `limiter-${Date.now()}-${Math.random()}`,
} = {}) {
  if (!limiters[key]) {
    limiters[key] = new RateLimiter(maxRequests, windowMs);
  }

  return limiters[key];
}

/**
 * Get rate limiter statistics
 *
 * @param {string} key - Limiter key
 * @param {string} identifier - Client identifier (IP, user ID, etc.)
 *
 * @returns {Object} Rate limiter statistics
 */
export function getRateLimitStats(key, identifier) {
  const limiter = limiters[key];

  if (!limiter) {
    return null;
  }

  return limiter.getStats(identifier);
}

/**
 * Reset rate limiter for identifier
 *
 * @param {string} key - Limiter key
 * @param {string} identifier - Client identifier to reset
 */
export function resetRateLimit(key, identifier) {
  const limiter = limiters[key];

  if (limiter) {
    limiter.reset(identifier);
  }
}

/**
 * Middleware helper for Next.js API routes
 * Returns 429 (Too Many Requests) if limit exceeded
 *
 * Usage:
 *
 * import { rateLimitMiddleware } from '../../../lib/middleware/rateLimiter.js';
 *
 * const limiter = rateLimitMiddleware({ maxRequests: 10 });
 *
 * export async function POST(request) {
 *   const rateLimitResponse = await limiter(request);
 *   if (rateLimitResponse) return rateLimitResponse;
 *
 *   // Your endpoint code here
 * }
 */
export function rateLimitMiddleware({
  maxRequests = 100,
  windowMs = 60000,
  key = 'global',
  getIdentifier = (req) => req.headers.get('x-forwarded-for') || 'unknown',
} = {}) {
  const limiter = rateLimit({ maxRequests, windowMs, key });

  return async (request) => {
    const identifier = getIdentifier(request);

    if (!limiter.check(identifier)) {
      return Response.json(
        {
          error: 'Too many requests',
          retryAfter: Math.ceil(windowMs / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil(windowMs / 1000),
          },
        }
      );
    }

    return null; // Request is allowed
  };
}

export default rateLimit;
