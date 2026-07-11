import jwt from "jsonwebtoken";
import { isTokenRevoked } from "../utils/tokenRevocation.js";

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: no token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Reject tokens that were explicitly logged out, even if they
    // haven't hit their natural expiry yet.
    if (await isTokenRevoked(decoded.jti)) {
      return res.status(401).json({ message: "Unauthorized: token has been revoked" });
    }

    req.admin = decoded; // attach admin info (id, username, jti, exp) to the request
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: invalid or expired token" });
  }
};

export default verifyToken;