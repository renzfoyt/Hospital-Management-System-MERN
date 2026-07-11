import express from "express";
import cors from "cors";
import helmet from "helmet";
import formRoutes from "./routes/formRoutes.js";
import { connectDB } from "./config/db.js";
import dotenv from "dotenv";
import { validateEnv } from "./config/validateEnv.js";
import rateLimiter from "./middleware/rateLimiter.js";
import authRoutes from "./routes/authRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

dotenv.config();
validateEnv();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:5173", "http://localhost:5174"];

//middleware
app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "100kb" }));
app.use(rateLimiter); // Apply the rate limiter middleware to all routes
//api
app.use("/api", formRoutes);
app.use("/api/auth", authRoutes); // Add the auth routes
app.use("/api", doctorRoutes);

// Must come after all routes: catches unmatched routes, then unhandled errors
app.use(notFound);
app.use(errorHandler);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log("Server is running on port", PORT);
  });
});
