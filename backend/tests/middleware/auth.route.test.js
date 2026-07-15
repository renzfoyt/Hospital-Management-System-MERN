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

jest.mock("../../src/utils/tokenRevocation.js", () => ({
  revokeToken: jest.fn(),
  isTokenRevoked: jest.fn().mockResolvedValue(false),
}));

import request from "supertest";
import { createApp } from "../../src/app.js";
import { Admin } from "../../models/Admin.js";
import bcrypt from "bcryptjs";
import { isTokenRevoked } from "../../src/utils/tokenRevocation.js";

const app = createApp();

const mockValidAdmin = () => {
  Admin.findOne.mockReturnValue({
    select: jest.fn().mockResolvedValue({
      _id: "admin1",
      username: "admin",
      password: "hashed",
    }),
  });
  bcrypt.compare.mockResolvedValue(true);
};

describe("POST /api/auth/login", () => {
  it("returns 400 when the request body fails validation", async () => {
    const res = await request(app).post("/api/auth/login").send({ username: "" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation failed");
  });

  it("sets an httpOnly adminToken cookie for valid credentials", async () => {
    mockValidAdmin();

    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "admin", password: "correct-password" });

    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty("token");

    const setCookie = res.headers["set-cookie"];
    expect(setCookie).toBeDefined();
    const adminCookie = setCookie.find((c) => c.startsWith("adminToken="));
    expect(adminCookie).toBeDefined();
    expect(adminCookie).toMatch(/HttpOnly/i);
    expect(adminCookie).toMatch(/SameSite=Lax/i);
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
    expect(res.headers["set-cookie"]).toBeUndefined();
  });
});

describe("cookie-authenticated session flow", () => {
  it("allows /api/auth/verify with the login cookie, then logout clears it", async () => {
    mockValidAdmin();
    isTokenRevoked.mockResolvedValue(false);

    const agent = request.agent(app); // persists cookies across requests

    const loginRes = await agent
      .post("/api/auth/login")
      .send({ username: "admin", password: "correct-password" });
    expect(loginRes.status).toBe(200);

    const verifyRes = await agent.get("/api/auth/verify");
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.admin).toMatchObject({ username: "admin" });

    const logoutRes = await agent.post("/api/auth/logout");
    expect(logoutRes.status).toBe(200);
    const clearedCookie = logoutRes.headers["set-cookie"].find((c) =>
      c.startsWith("adminToken="),
    );
    // clearCookie sends an expired/empty cookie
    expect(clearedCookie).toMatch(/adminToken=;/);
  });

  it("rejects /api/auth/verify with no cookie", async () => {
    const res = await request(app).get("/api/auth/verify");
    expect(res.status).toBe(401);
  });
});