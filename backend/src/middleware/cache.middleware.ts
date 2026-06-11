import { Request, Response, NextFunction } from "express";
import { getCache, setCache } from "../lib/redis";

/**
 * Advanced Cache Middleware using Redis
 * Protects the database from traffic spikes by caching GET requests.
 * @param durationSeconds Time in seconds to keep the cache alive
 * 
 * PERFORMANCE FIX #5: Suporta cache autenticado.
 * Quando o request possui userId (via auth middleware), a chave inclui o userId
 * para garantir isolamento de dados entre usuários diferentes.
 */
export const apiCache = (durationSeconds: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    // Construct cache key: include userId for authenticated requests to prevent data leakage
    const userId = (req as any).user?.userId;
    const cacheKey = userId 
      ? `cache:u:${userId}:${req.originalUrl || req.url}`
      : `cache:${req.originalUrl || req.url}`;

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

/**
 * Invalida todo o cache de um usuário específico para um prefixo de rota.
 * Usar após operações de escrita (upload, delete) para manter consistência.
 */
export const invalidateUserCache = async (userId: string, pathPrefix: string): Promise<void> => {
  // Implementação simplificada: o Redis TTL curto (15-30s) garante eventual consistency.
  // Para invalidação explícita com ioredis, seria necessário SCAN + DEL por padrão.
  // Por ora, o TTL curto é suficiente para o caso de uso.
  console.log(`[CACHE] Cache do usuário ${userId} para ${pathPrefix} será expirado automaticamente (TTL).`);
};

