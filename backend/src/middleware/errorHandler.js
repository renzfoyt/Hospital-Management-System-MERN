import { logger } from "../config/logger.js";

/**
 * Catches requests to routes that don't exist. Register this AFTER all
 * real routes and BEFORE errorHandler.
 */
export const notFound = (req, res) => {
  res
    .status(404)
    .json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

/**
 * Centralized error handler. Every asyncHandler-wrapped controller funnels
 * unexpected errors here instead of repeating try/catch + console.error +
 * res.status(...) boilerplate in every function.
 *
 * Must be the LAST app.use() call, with all four (err, req, res, next)
 * parameters present — that's how Express recognizes it as an error handler.
 */
export const errorHandler = (err, req, res, next) => {
  logger.error({ err }, err.message || "Unhandled error");

  // Mongoose validation error (e.g. a required field missing at the DB layer,
  // as a backstop behind the zod validation middleware)
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({ message: "Validation failed", errors });
  }

  // Mongoose bad ObjectId, e.g. GET /admin/doctors/not-a-real-id
  if (err.name === "CastError") {
    return res
      .status(400)
      .json({ message: `Invalid ${err.path}: ${err.value}` });
  }

  // Mongoose duplicate key, e.g. Admin.username unique constraint
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    return res.status(409).json({ message: `${field} already exists` });
  }

  // Malformed/expired JWT that reaches here instead of being caught inline
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res
      .status(401)
      .json({ message: "Unauthorized: invalid or expired token" });
  }
  // Multer errors (e.g. file too large) — give a clearer message than
  // the generic 500 fallback below would.
  if (err.name === "MulterError") {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Image must be 5MB or smaller"
        : err.message;
    return res.status(400).json({ message });
  }
  
  const status = err.statusCode || 500;
  res.status(status).json({
    message: status === 500 ? "Internal server error" : err.message,
  });
};
