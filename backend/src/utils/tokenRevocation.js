import { Redis } from "@upstash/redis";
import dotenv from "dotenv";

dotenv.config();

const redis = Redis.fromEnv();

// Prefix keeps revoked-token keys distinct from rate-limit keys
// sharing the same Redis instance.
const REVOCATION_PREFIX = "revoked:";

/**
 * Marks a token (by its jti) as revoked until it would have expired
 * naturally. Storing with a TTL means Redis auto-cleans the entry —
 * we never need a separate cleanup job.
 * @param {string} jti - unique token id (from crypto.randomUUID())
 * @param {number} expiresInSeconds - seconds until the token's original expiry
 */
export const revokeToken = async (jti, expiresInSeconds) => {
  if (!jti) return;
  const ttl = Math.max(expiresInSeconds, 1); // guard against 0/negative TTL
  await redis.set(`${REVOCATION_PREFIX}${jti}`, "1", { ex: ttl });
};

/**
 * Checks whether a token (by its jti) has been revoked (i.e. logged out).
 * @param {string} jti
 * @returns {Promise<boolean>}
 */
export const isTokenRevoked = async (jti) => {
  if (!jti) return false;
  const result = await redis.get(`${REVOCATION_PREFIX}${jti}`);
  return result !== null;
};