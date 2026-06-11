import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
let redisClient: Redis | null = null;

if (redisUrl) {
  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 1, // Fail fast to not block the event loop
    retryStrategy(times) {
      if (times > 3) {
        // Stop retrying after 3 attempts
        return null;
      }
      return Math.min(times * 50, 2000);
    },
  });

  redisClient.on("error", (err) => {
    console.error("[REDIS] Connection Error:", err.message);
  });
  
  redisClient.on("connect", () => {
    console.log("[REDIS] Connected successfully.");
  });
}

/**
 * Gets a value from cache
 */
export const getCache = async (key: string): Promise<string | null> => {
  if (!redisClient || redisClient.status !== "ready") return null;
  try {
    return await redisClient.get(key);
  } catch (err: any) {
    console.error(`[REDIS] Error getting cache for key ${key}:`, err.message);
    return null;
  }
};

/**
 * Sets a value in cache with expiration
 * @param key Cache key
 * @param value Stringified value
 * @param expireSeconds Expiration in seconds
 */
export const setCache = async (key: string, value: string, expireSeconds: number): Promise<void> => {
  if (!redisClient || redisClient.status !== "ready") return;
  try {
    await redisClient.setex(key, expireSeconds, value);
  } catch (err: any) {
    console.error(`[REDIS] Error setting cache for key ${key}:`, err.message);
  }
};

/**
 * Deletes a value from cache
 */
export const delCache = async (key: string): Promise<void> => {
  if (!redisClient || redisClient.status !== "ready") return;
  try {
    await redisClient.del(key);
  } catch (err: any) {
    console.error(`[REDIS] Error deleting cache for key ${key}:`, err.message);
  }
};

export default redisClient;
