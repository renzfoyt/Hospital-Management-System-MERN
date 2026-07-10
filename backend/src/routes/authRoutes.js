import express from "express";
import { login } from "../controllers/authController.js";
import { validate } from "../middleware/validate.js";
import { loginSchema } from "../schemas/authSchema.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.post("/login", authRateLimiter, validate(loginSchema), login);

export default router;