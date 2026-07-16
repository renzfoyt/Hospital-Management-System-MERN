import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Admin } from "../../models/Admin.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { revokeToken } from "../utils/tokenRevocation.js";
import {
  isAccountLocked,
  recordFailedAttempt,
  clearFailedAttempts,
} from "../utils/accountLockout.js";

const TOKEN_TTL_SECONDS = 2 * 60 * 60; // 2 hours
const COOKIE_NAME = "adminToken";

// Shared so login (set) and logout (clear) always agree on cookie attributes.
// httpOnly: JS on the page can never read this cookie — closes off the XSS
// token-theft path that localStorage was exposed to.
// secure: only sent over HTTPS in production (allowed over HTTP in dev so
// localhost keeps working without a local TLS cert).
// sameSite: "lax" is enough here since the frontend and backend cookie
// exchange is same-site in the normal deploy shape (or first-party fetch),
// and "lax" still allows the cookie on normal navigation/top-level requests.
// TODO: no CSRF token yet. Currently covered by sameSite:"lax" + the
// explicit CORS allowlist in app.js (blocks cross-site state-changing
// requests and cross-origin response reads). Revisit if this ever gets
// multiple admin roles or higher-stakes actions (bulk delete, data export,
// managing other admins) — add a double-submit CSRF token at that point.
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: TOKEN_TTL_SECONDS * 1000,
  path: "/",
};

export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (await isAccountLocked(username)) {
    return res.status(429).json({
      message:
        "Too many failed login attempts. Please try again in a few minutes.",
    });
  }

  const admin = await Admin.findOne({ username }).select("+password");
  if (!admin) {
    await recordFailedAttempt(username);
    return res.status(401).json({ message: "Invalid username or password" });
  }

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) {
    await recordFailedAttempt(username);
    return res.status(401).json({ message: "Invalid username or password" });
  }

  await clearFailedAttempts(username);

  const jti = crypto.randomUUID();

  const token = jwt.sign(
    { id: admin._id, username: admin.username, jti },
    process.env.JWT_SECRET,
    { expiresIn: TOKEN_TTL_SECONDS },
  );

  res.cookie(COOKIE_NAME, token, cookieOptions);
  res.status(200).json({ message: "Login successful" });
});

export const logout = asyncHandler(async (req, res) => {
  const { jti, exp } = req.admin;

  const expiresInSeconds = exp - Math.floor(Date.now() / 1000);
  await revokeToken(jti, expiresInSeconds);

  res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: undefined });
  res.status(200).json({ message: "Logout successful" });
});

export const verify = asyncHandler(async (req, res) => {
  // If we got here, verifyToken already confirmed the cookie is valid
  // and not revoked — this endpoint just tells the frontend "yes, you're
  // logged in" so RequireAdminAuth has something to check on mount.
  res
    .status(200)
    .json({ admin: { id: req.admin.id, username: req.admin.username } });
});
