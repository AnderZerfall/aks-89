import { Redis } from "@upstash/redis";
import { z } from "zod";

const SyncTimestampSchema = z.iso.datetime({ offset: true });
const LAST_SYNC_KEY = "olx-sync:last-successful-at";

export const OlxSyncStateService = {
  getLastSuccessfulSync: async (): Promise<Date | null> => {
    const timestamp = await createRedisClient().get<string>(LAST_SYNC_KEY);
    if (timestamp === null) return null;

    return new Date(SyncTimestampSchema.parse(timestamp));
  },
  saveSuccessfulSync: async (timestamp: Date): Promise<void> => {
    await createRedisClient().set(
      LAST_SYNC_KEY,
      SyncTimestampSchema.parse(timestamp.toISOString()),
    );
  },
};

function createRedisClient(): Redis {
  const url =
    process.env.UPSTASH_KV_REST_API_URL ??
    process.env.UPSTASH_REDIS_REST_URL ??
    process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_KV_REST_API_TOKEN ??
    process.env.UPSTASH_REDIS_REST_TOKEN ??
    process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    throw new Error(
      "Missing Upstash credentials: set UPSTASH_KV_REST_API_URL and UPSTASH_KV_REST_API_TOKEN",
    );
  }

  return new Redis({ url, token });
}
