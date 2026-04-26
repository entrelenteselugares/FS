import { Request as ExpressRequest, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fotosegundo-dev-secret-2026";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "fotosegundo-refresh-secret-2026";

export interface AuthPayload {
  userId: string;
  role: string;
  nome: string;
}

export interface AuthRequest extends ExpressRequest {
  user?: AuthPayload;
}

/** Gera token de acesso (curta duração: 1 hora) */
export const generateToken = (payload: AuthPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
};

/** Gera token de renovação (longa duração: 7 dias) */
export const generateRefreshToken = (payload: AuthPayload): string => {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: "7d" });
};

export const verifyToken = (token: string): AuthPayload => {
  return jwt.verify(token, JWT_SECRET) as AuthPayload;
};

export const verifyRefreshToken = (token: string): AuthPayload => {
  return jwt.verify(token, REFRESH_SECRET) as AuthPayload;
};

/** Middleware: requer JWT válido */
export const requireAuth = (req: ExpressRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const queryToken = req.query.token as string;
  let token: string | undefined;

  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  } else if (queryToken) {
    token = queryToken;
  }

  if (!token) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  try {
    (req as AuthRequest).user = verifyToken(token);
    return next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expirado", code: "TOKEN_EXPIRED" });
    }
    return res.status(401).json({ error: "Token inválido" });
  }
};

/** Middleware: restringe acesso por role */
export const requireRole = (...roles: string[]) => {
  return (req: ExpressRequest, res: Response, next: NextFunction) => {
    const user = (req as AuthRequest).user;
    if (!roles.includes(user?.role || "")) {
      return res.status(403).json({ error: "Acesso negado" });
    }
    return next();
  };
};
