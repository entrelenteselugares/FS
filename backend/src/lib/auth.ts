import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fotosegundo-dev-secret-2026";

export interface AuthPayload {
  userId: string;
  role: string;
  nome: string;
}

export const generateToken = (payload: AuthPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};

export const verifyToken = (token: string): AuthPayload => {
  return jwt.verify(token, JWT_SECRET) as AuthPayload;
};

/** Middleware: requer JWT válido */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
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
    (req as any).user = verifyToken(token);
    return next();
  } catch {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
};

/** Middleware: restringe acesso por role */
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as AuthPayload;
    if (!roles.includes(user?.role)) {
      return res.status(403).json({ error: "Acesso negado" });
    }
    return next();
  };
};
