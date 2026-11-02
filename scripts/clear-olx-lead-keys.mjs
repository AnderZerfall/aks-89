import { Redis } from "@upstash/redis";

const LEAD_KEY_PATTERN = "olx-leads:*";
const SCAN_COUNT = 100;

if (!process.argv.includes("--confirm")) {
  throw new Error(
    "Pass --confirm to delete all Upstash keys matching olx-leads:*",
  );
}

const url =
  process.env.UPSTASH_KV_REST_API_URL ??
  process.env.UPSTASH_REDIS_REST_URL ??
  process.env.KV_REST_API_URL;
const token =
  process.env.UPSTASH_KV_REST_API_TOKEN ??
  process.env.UPSTASH_REDIS_REST_TOKEN ??
  process.env.KV_REST_API_TOKEN;

if (!url || !token) {
  throw new Error("Missing Upstash Redis URL or token in .env");
}

const redis = new Redis({ url, token });
let cursor = "0";
let deletedCount = 0;

do {
  const [nextCursor, keys] = await redis.scan(cursor, {
    match: LEAD_KEY_PATTERN,
    count: SCAN_COUNT,
  });
  if (keys.length > 0) {
    deletedCount += await redis.del(...keys);
  }
  cursor = String(nextCursor);
} while (cursor !== "0");

console.log(`Deleted ${deletedCount} Upstash keys matching ${LEAD_KEY_PATTERN}`);
