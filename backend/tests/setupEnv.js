// Runs before the test framework loads any modules. Provides fake-but-present
// env vars so modules that read process.env at import time (e.g.
// config/upstash.js calling Redis.fromEnv()) don't crash during tests.
// Nothing here ever makes a real network call — tests mock those modules
// directly wherever a request would actually go out (see tests/mocks/).
process.env.JWT_SECRET = "test-jwt-secret";
process.env.MONGO_URI = "mongodb://localhost:27017/hms-test";
process.env.UPSTASH_REDIS_REST_URL = "https://test-instance.upstash.io";
process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
process.env.LOG_LEVEL = "silent"; // keep pino-http quiet during `npm test`

process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
process.env.CLOUDINARY_API_KEY = "test-key";
process.env.CLOUDINARY_API_SECRET = "test-secret";  