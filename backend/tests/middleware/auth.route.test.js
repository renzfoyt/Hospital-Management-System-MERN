jest.mock("../../src/middleware/rateLimiter.js", () => ({
  __esModule: true,
  default: (req, res, next) => next(),
  authRateLimiter: (req, res, next) => next(),
}));

jest.mock("../../models/Admin.js", () => ({
  Admin: { findOne: jest.fn() },
}));

jest.mock("bcryptjs", () => ({
  __esModule: true,
  default: { compare: jest.fn() },
}));

import request from "supertest";
import { createApp } from "../../src/app.js";
import { Admin } from "../../models/Admin.js";
import bcrypt from "bcryptjs";

const app = createApp();

describe("POST /api/auth/login", () => {
  it("returns 400 when the request body fails validation", async () => {
    const res = await request(app).post("/api/auth/login").send({ username: "" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation failed");
  });

  it("returns a token for valid credentials", async () => {
    Admin.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: "admin1",
        username: "admin",
        password: "hashed",
      }),
    });
    bcrypt.compare.mockResolvedValue(true);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "admin", password: "correct-password" });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe("string");
  });

  it("returns 401 for a wrong password", async () => {
    Admin.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: "admin1",
        username: "admin",
        password: "hashed",
      }),
    });
    bcrypt.compare.mockResolvedValue(false);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "admin", password: "wrong-password" });

    expect(res.status).toBe(401);
  });
});