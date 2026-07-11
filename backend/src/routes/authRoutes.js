import express from "express";
import { login, logout } from "../controllers/authController.js";
import { validate } from "../middleware/validate.js";
import { loginSchema } from "../schemas/authSchema.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

router.post("/login", authRateLimiter, validate(loginSchema), login);
router.post("/logout", verifyToken, logout);

export default router;