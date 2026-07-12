import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Admin } from "../../models/Admin.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { revokeToken } from "../utils/tokenRevocation.js";

// Kept as one source of truth so login (jwt.sign) and logout
// (expiresInSeconds fallback) never drift apart.
const TOKEN_TTL_SECONDS = 2 * 60 * 60; // 2 hours

/**
 * @typedef {Object} LoginRequestBody
 * @property {string} username
 * @property {string} password
 */

/**
 * Admin login — checks credentials, returns a JWT if valid.
 * username/password presence is already guaranteed by the loginSchema
 * validation middleware, so this only handles the "do they match" logic.
 * @param {import("express").Request<{}, {}, LoginRequestBody>} req
 * @param {import("express").Response} res
 */
export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  const admin = await Admin.findOne({ username }).select("+password");
  if (!admin) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  // jti (JWT ID) uniquely identifies this token so it can be individually
  // revoked on logout, without invalidating any other active session.
  const jti = crypto.randomUUID();

  const token = jwt.sign(
    { id: admin._id, username: admin.username, jti },
    process.env.JWT_SECRET,
    { expiresIn: TOKEN_TTL_SECONDS }
  );

  res.status(200).json({
    message: "Login successful",
    token,
  });
});

/**
 * Admin logout — revokes the current token's jti so it can no longer be
 * used, even though it hasn't naturally expired yet. Relies on verifyToken
 * having already run and attached the decoded payload to req.admin.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export const logout = asyncHandler(async (req, res) => {
  const { jti, exp } = req.admin;

  const expiresInSeconds = exp - Math.floor(Date.now() / 1000);
  await revokeToken(jti, expiresInSeconds);

  res.status(200).json({ message: "Logout successful" });
});