import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import { logger } from "./config/logger.js";
import formRoutes from "./routes/formRoutes.js";
import mongoSanitize from "express-mongo-sanitize";
import compression from "compression";
import rateLimiter from "./middleware/rateLimiter.js";
import authRoutes from "./routes/authRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

export const createApp = () => {
  const app = express();

  app.set("trust proxy", 1);

  app.use(
    pinoHttp({
      logger,
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
  app.use(compression());
  // credentials: true is required for the browser to send/receive the
  // httpOnly admin auth cookie cross-origin (frontend on :5173, backend on
  // :5000 in dev, or separate domains in prod). Paired with an explicit
  // origin allowlist above — never combine credentials:true with origin:"*",
  // browsers reject that combination anyway since it would let ANY site
  // read cookie-authenticated responses.
  app.use(cors({ origin: allowedOrigins, credentials: true }));
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());
  app.use(mongoSanitize());

  app.get("/api/health", (req, res) => {
    const dbConnected = mongoose.connection.readyState === 1;
    res.status(dbConnected ? 200 : 503).json({
      status: dbConnected ? "ok" : "degraded",
      db: dbConnected ? "connected" : "disconnected",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  app.use(rateLimiter);
  //api
  app.use("/api", formRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api", doctorRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

export default createApp;