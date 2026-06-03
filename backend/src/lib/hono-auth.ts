import { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { verifyToken, AuthPayload } from "./auth";

export const requireHonoAuth = async (c: Context, next: Next) => {
  const authHeader = c.req.header("authorization");
  const queryToken = c.req.query("token");
  const cookieToken = getCookie(c, "token");

  let token: string | undefined;

  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  } else if (cookieToken) {
    token = cookieToken;
  } else if (queryToken) {
    token = queryToken;
  }

  if (!token) {
    return c.json({ error: "Token não fornecido" }, 401);
  }

  try {
    const user = verifyToken(token);
    c.set("user", user);
    await next();
  } catch (err: unknown) {
    const error = err as Error;
    if (error.name === "TokenExpiredError") {
      return c.json({ error: "Token expirado", code: "TOKEN_EXPIRED" }, 401);
    }
    return c.json({ 
      error: "Token inválido", 
      details: error.message 
    }, 401);
  }
};
