import { Request, Response, NextFunction } from "express";
import { getCache, setCache } from "../lib/redis";

/**
 * Advanced Cache Middleware using Redis
 * Protects the database from traffic spikes by caching GET requests.
 * @param durationSeconds Time in seconds to keep the cache alive
 */
export const apiCache = (durationSeconds: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    // Bypass cache if user is authenticated (unless it's a strictly public endpoint without user context)
    // For our specific use case, we only apply this to public endpoints anyway.
    
    // Construct cache key based on URL + Query params
    const cacheKey = `cache:${req.originalUrl || req.url}`;

    try {
      const cachedResponse = await getCache(cacheKey);

      if (cachedResponse) {
        res.setHeader("X-Cache", "HIT");
        res.setHeader("Content-Type", "application/json");
        return res.send(cachedResponse);
      }

      // If missing, hijack the res.json/res.send to intercept the payload before it goes to the client
      const originalJson = res.json.bind(res);
      const originalSend = res.send.bind(res);

      res.setHeader("X-Cache", "MISS");

      // Override res.json
      res.json = (body: any) => {
        // Save to cache asynchronously, don't await
        if (res.statusCode >= 200 && res.statusCode < 300) {
          setCache(cacheKey, JSON.stringify(body), durationSeconds).catch(console.error);
        }
        return originalJson(body);
      };

      // Override res.send (for stringified JSON payloads)
      res.send = (body: any) => {
        if (res.statusCode >= 200 && res.statusCode < 300 && typeof body === "string") {
          // Verify if it's actually JSON before caching
          try {
            JSON.parse(body);
            setCache(cacheKey, body, durationSeconds).catch(console.error);
          } catch (e) {
            // Not JSON, ignore
          }
        }
        return originalSend(body);
      };

      next();
    } catch (err) {
      console.error("[CACHE MIDDLEWARE] Unexpected error:", err);
      // Fallback: proceed to DB if cache logic completely fails
      next();
    }
  };
};
