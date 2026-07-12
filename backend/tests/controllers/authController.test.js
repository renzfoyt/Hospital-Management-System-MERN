// Mocks must come before importing the module under test — babel-jest
// hoists jest.mock() calls above imports automatically.
jest.mock("../../models/Admin.js", () => ({
  Admin: { findOne: jest.fn() },
}));
jest.mock("bcryptjs", () => ({
  __esModule: true,
  default: { compare: jest.fn() },
}));
jest.mock("../../src/utils/tokenRevocation.js", () => ({
  revokeToken: jest.fn(),
}));

import jwt from "jsonwebtoken";
import { Admin } from "../../models/Admin.js";
import bcrypt from "bcryptjs";
import { revokeToken } from "../../src/utils/tokenRevocation.js";
import { login, logout } from "../../src/controllers/authController.js";

// login/logout are wrapped in asyncHandler, which fires the async work but
// doesn't return a promise the caller can await directly. This flushes the
// microtask queue so the mocked DB/bcrypt calls resolve before assertions.
const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("authController.login", () => {
  it("returns a signed JWT on valid credentials", async () => {
    Admin.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: "admin123",
        username: "admin",
        password: "hashed-password",
      }),
    });
    bcrypt.compare.mockResolvedValue(true);

    const req = { body: { username: "admin", password: "correct-password" } };
    const res = mockRes();

    login(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0][0];
    expect(payload.message).toBe("Login successful");
    expect(typeof payload.token).toBe("string");

    // Confirm the token actually carries the expected claims
    const decoded = jwt.verify(payload.token, process.env.JWT_SECRET);
    expect(decoded.username).toBe("admin");
    expect(decoded.id).toBe("admin123");
    expect(typeof decoded.jti).toBe("string");
  });

  it("returns 401 when the username doesn't exist", async () => {
    Admin.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    const req = { body: { username: "ghost", password: "whatever" } };
    const res = mockRes();

    login(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid username or password",
    });
  });

  it("returns 401 when the password is wrong", async () => {
    Admin.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: "admin123",
        username: "admin",
        password: "hashed-password",
      }),
    });
    bcrypt.compare.mockResolvedValue(false);

    const req = { body: { username: "admin", password: "wrong-password" } };
    const res = mockRes();

    login(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid username or password",
    });
  });
});

describe("authController.logout", () => {
  it("revokes the token's jti and confirms logout", async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const req = {
      admin: { jti: "some-jti", exp: nowSeconds + 3600 },
    };
    const res = mockRes();

    logout(req, res, jest.fn());
    await flushPromises();

    expect(revokeToken).toHaveBeenCalledWith("some-jti", expect.any(Number));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Logout successful" });
  });
});