import { logger } from "./logger.js";

const REQUIRED_ENV_VARS = [
  "MONGO_URI",
  "JWT_SECRET",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

// A JWT_SECRET shorter than this is easy to brute-force offline once an
// attacker has a signed token to test guesses against. 32 chars matches
// what `openssl rand -hex 32` (the value we recommend in .env.example)
// produces at minimum — real generated secrets clear this easily.
const MIN_JWT_SECRET_LENGTH = 32;

export const validateEnv = () => {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    logger.error(
      `Missing required environment variable(s): ${missing.join(", ")}. ` +
      `Copy backend/.env.example to backend/.env and fill in real values.`
    );
    process.exit(1);
  }

  if (process.env.JWT_SECRET.length < MIN_JWT_SECRET_LENGTH) {
    logger.error(
      `JWT_SECRET is too short (${process.env.JWT_SECRET.length} chars, ` +
      `minimum ${MIN_JWT_SECRET_LENGTH}). Generate a strong one with: ` +
      `openssl rand -hex 32`
    );
    process.exit(1);
  }
};

export default validateEnv;