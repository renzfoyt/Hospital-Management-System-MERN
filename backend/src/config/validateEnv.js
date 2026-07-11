const REQUIRED_ENV_VARS = [
  "MONGO_URI",
  "JWT_SECRET",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
];

/**
 * Fails fast with a clear message if required env vars are missing,
 * instead of letting the app start and crash confusingly later
 * (e.g. mongoose.connect(undefined) or a Redis call throwing deep
 * inside a request handler).
 */
export const validateEnv = () => {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      `Missing required environment variable(s): ${missing.join(", ")}\n` +
      `Copy backend/.env.example to backend/.env and fill in real values.`
    );
    process.exit(1);
  }
};

export default validateEnv;