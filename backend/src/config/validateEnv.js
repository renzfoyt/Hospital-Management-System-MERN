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

export const validateEnv = () => {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    logger.error(
      `Missing required environment variable(s): ${missing.join(", ")}. ` +
      `Copy backend/.env.example to backend/.env and fill in real values.`
    );
    process.exit(1);
  }
};

export default validateEnv;