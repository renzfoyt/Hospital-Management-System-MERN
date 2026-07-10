import rateLimit, { authRateLimit } from "../config/upstash.js";

/**
 * Factory: turns any Upstash Ratelimit instance into Express middleware.
 * Keeps the general limiter and the tighter auth limiter sharing one
 * implementation instead of two copy-pasted middlewares.
 */
const createRateLimiter = (limiter, message = "Too many requests. Please try again later.") =>
  async (req, res, next) => {
    try {
      const { success } = await limiter.limit(req.ip);
      if (!success) {
        return res.status(429).json({ message });
      }
      next();
    } catch (error) {
      console.error("Rate limiter error:", error);
      // Respond once and stop — do NOT also call next(error) here, that
      // would send a second response down the chain after headers are
      // already sent.
      res.status(500).json({ message: "Internal server error" });
    }
  };

// General API traffic — 100 requests / 15 min per IP
const rateLimiter = createRateLimiter(rateLimit);

// Login attempts only — 5 requests / 15 min per IP, to slow down
// credential-stuffing/brute-force against /api/auth/login
export const authRateLimiter = createRateLimiter(
  authRateLimit,
  "Too many login attempts. Please try again in a few minutes."
);

export default rateLimiter;