import { redis } from "../config/upstash.js";

// Separate prefixes so these don't collide with rate-limit or
// revocation keys sharing the same Redis instance.
const FAILED_ATTEMPTS_PREFIX = "loginFailed:";
const LOCKOUT_PREFIX = "loginLocked:";

const MAX_FAILED_ATTEMPTS = 5;
const ATTEMPT_WINDOW_SECONDS = 15 * 60; // failed-attempt counter resets after 15 min of no failures
const LOCKOUT_SECONDS = 15 * 60; // account locked for 15 min once threshold is hit

const normalize = (username) => String(username || "").toLowerCase();

/**
 * Checks whether a username is currently locked out due to too many
 * recent failed login attempts. This is keyed by username, not IP —
 * closes the gap where an attacker rotating IPs could otherwise bypass
 * the per-IP auth rate limiter entirely.
 * @param {string} username
 * @returns {Promise<boolean>}
 */
export const isAccountLocked = async (username) => {
  const locked = await redis.get(`${LOCKOUT_PREFIX}${normalize(username)}`);
  return locked !== null;
};

/**
 * Records a failed login attempt for a username. Once MAX_FAILED_ATTEMPTS
 * is reached within the attempt window, locks the account for LOCKOUT_SECONDS.
 * @param {string} username
 */
export const recordFailedAttempt = async (username) => {
  const key = `${FAILED_ATTEMPTS_PREFIX}${normalize(username)}`;
  const attempts = await redis.incr(key);
  if (attempts === 1) {
    await redis.expire(key, ATTEMPT_WINDOW_SECONDS);
  }
  if (attempts >= MAX_FAILED_ATTEMPTS) {
    await redis.set(`${LOCKOUT_PREFIX}${normalize(username)}`, "1", {
      ex: LOCKOUT_SECONDS,
    });
  }
};

/**
 * Clears the failed-attempt counter for a username. Called on successful
 * login so a legitimate login resets the count instead of leaving stale
 * near-lockout state.
 * @param {string} username
 */
export const clearFailedAttempts = async (username) => {
  await redis.del(`${FAILED_ATTEMPTS_PREFIX}${normalize(username)}`);
};