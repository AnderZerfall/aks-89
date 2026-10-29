import { Redis } from "@upstash/redis";
import { z } from "zod";

const SyncTimestampSchema = z.iso.datetime({ offset: true });
const LAST_SYNC_KEY = "olx-sync:last-successful-at";
const IMPORTED_PRODUCT_SYNC_KEY_PREFIX = "olx-sync:imported-product:";

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
  getImportedProductSyncAt: async (article: string): Promise<Date | null> => {
    const timestamp = await createRedisClient().get<string>(
      getImportedProductSyncKey(article),
    );
    if (timestamp === null) return null;

    return new Date(SyncTimestampSchema.parse(timestamp));
  },
  saveImportedProductSyncAt: async (
    article: string,
    timestamp: Date,
  ): Promise<void> => {
    await createRedisClient().set(
      getImportedProductSyncKey(article),
      SyncTimestampSchema.parse(timestamp.toISOString()),
    );
  },
};

function getImportedProductSyncKey(article: string): string {
  return `${IMPORTED_PRODUCT_SYNC_KEY_PREFIX}${encodeURIComponent(article)}`;
}

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
