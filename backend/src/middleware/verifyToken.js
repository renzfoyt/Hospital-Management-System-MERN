import jwt from "jsonwebtoken";
import { isTokenRevoked } from "../utils/tokenRevocation.js";

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.adminToken;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: no token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (await isTokenRevoked(decoded.jti)) {
      return res.status(401).json({ message: "Unauthorized: token has been revoked" });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: invalid or expired token" });
  }
};

export default verifyToken;