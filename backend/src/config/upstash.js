import {Ratelimit} from "@upstash/ratelimit";
import {Redis} from "@upstash/redis";

import dotenv from "dotenv";

dotenv.config();

const redis = Redis.fromEnv();

//rate limit 100 requests per 15 minutes (general API traffic)
const rateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "15 m"),
    prefix: "ratelimit:general",
});

// rate limit 5 requests per 15 minutes (login attempts only —
// tighter budget to slow down credential-stuffing/brute-force)
export const authRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "15 m"),
    prefix: "ratelimit:auth",
});

export default rateLimit;