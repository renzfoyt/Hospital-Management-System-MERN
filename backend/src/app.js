import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import mongoose from "mongoose";
import { logger } from "./config/logger.js";
import formRoutes from "./routes/formRoutes.js";
import mongoSanitize from "express-mongo-sanitize";
import compression from "compression";
import rateLimiter from "./middleware/rateLimiter.js";
import authRoutes from "./routes/authRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

// Builds and returns the Express app WITHOUT connecting to Mongo or
// starting a listener. Kept separate from server.js so tests can import
// this directly (via supertest) without needing a real DB/Redis connection.
export const createApp = () => {
  const app = express();

  // Trust the first hop proxy (Render/Railway/nginx/etc.) so req.ip reflects
  // the real client IP instead of the proxy's — critical for the rate
  // limiter, which keys off req.ip. Without this, all traffic behind a
  // proxy can share one rate-limit bucket, or worse, be spoofable via
  // X-Forwarded-For.
  app.set("trust proxy", 1);

  app.use(
    pinoHttp({
      logger,
      // Keep health checks out of the logs — they'd otherwise spam every
      // few seconds from uptime monitors/load balancers.
      autoLogging: {
        ignore: (req) => req.url === "/api/health",
      },
    }),
  );

  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
    : ["http://localhost:5173", "http://localhost:5174"];

  //middleware
  app.use(helmet());
  app.use(compression()); // gzip/deflate responses to cut payload size over the wire
  app.use(cors({ origin: allowedOrigins }));
  app.use(express.json({ limit: "100kb" }));
  // Strips any keys starting with "$" or containing "." from req.body,
  // req.query, and req.params — blocks NoSQL operator-injection attempts
  // (e.g. { "username": { "$gt": "" } }) before they ever reach Mongoose.
  app.use(mongoSanitize());

  // Health check — used by hosting platforms (Docker/k8s/Render/Railway) to
  // know the app is alive and the DB connection is actually up, not just
  // that the process is running. Placed before the rate limiter since
  // monitoring pings can be frequent and shouldn't compete with real
  // traffic for that budget.
  app.get("/api/health", (req, res) => {
    const dbConnected = mongoose.connection.readyState === 1; // 1 = connected
    res.status(dbConnected ? 200 : 503).json({
      status: dbConnected ? "ok" : "degraded",
      db: dbConnected ? "connected" : "disconnected",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  app.use(rateLimiter); // Apply the rate limiter middleware to all routes
  //api
  app.use("/api", formRoutes);
  app.use("/api/auth", authRoutes); // Add the auth routes
  app.use("/api", doctorRoutes);

  // Must come after all routes: catches unmatched routes, then unhandled errors
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

export default createApp;
