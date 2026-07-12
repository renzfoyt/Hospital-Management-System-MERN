import mongoose from "mongoose";
import dotenv from "dotenv";
import { logger } from "./config/logger.js";
import { createApp } from "./app.js";
import { connectDB } from "./config/db.js";
import { validateEnv } from "./config/validateEnv.js";

dotenv.config({ quiet: true });
validateEnv();

const app = createApp();
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  const server = app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });

  // Graceful shutdown: on redeploy/restart, the host sends SIGTERM (or
  // SIGINT locally via Ctrl+C). Stop accepting new connections, let
  // in-flight requests finish, then close the Mongo connection cleanly
  // instead of yanking it out from under active queries.
  const shutdown = (signal) => {
    logger.info(`${signal} received: shutting down gracefully`);

    server.close(async () => {
      logger.info("HTTP server closed");
      try {
        await mongoose.connection.close();
        logger.info("MongoDB connection closed");
        process.exit(0);
      } catch (error) {
        logger.error({ err: error }, "Error during shutdown");
        process.exit(1);
      }
    });

    setTimeout(() => {
      logger.error("Forced shutdown: cleanup took too long");
      process.exit(1);
    }, 10_000).unref();
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
});