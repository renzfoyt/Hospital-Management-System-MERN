jest.mock("../../src/utils/tokenRevocation.js", () => ({
  isTokenRevoked: jest.fn(),
}));

import jwt from "jsonwebtoken";
import verifyToken from "../../src/middleware/verifyToken.js";
import { isTokenRevoked } from "../../src/utils/tokenRevocation.js";

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const signTestToken = (overrides = {}) =>
  jwt.sign(
    { id: "admin1", username: "admin", jti: "jti-1", ...overrides },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );

describe("verifyToken", () => {
  it("rejects when no cookie is present", async () => {
    const req = { cookies: {} };
    const res = mockRes();
    const next = jest.fn();

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Unauthorized: no token provided",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects a malformed/invalid token", async () => {
    const req = { cookies: { adminToken: "not-a-real-token" } };
    const res = mockRes();
    const next = jest.fn();

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Unauthorized: invalid or expired token",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects a valid but revoked token", async () => {
    isTokenRevoked.mockResolvedValue(true);
    const token = signTestToken();
    const req = { cookies: { adminToken: token } };
    const res = mockRes();
    const next = jest.fn();

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Unauthorized: token has been revoked",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next() and attaches req.admin for a valid, non-revoked token", async () => {
    isTokenRevoked.mockResolvedValue(false);
    const token = signTestToken();
    const req = { cookies: { adminToken: token } };
    const res = mockRes();
    const next = jest.fn();

    await verifyToken(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.admin.username).toBe("admin");
    expect(req.admin.jti).toBe("jti-1");
  });
});