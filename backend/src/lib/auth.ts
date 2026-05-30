import { Request as ExpressRequest, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

if (!JWT_SECRET || !REFRESH_SECRET) {
  console.error("❌ ERRO CRÍTICO: Variáveis de ambiente JWT_SECRET e REFRESH_SECRET não configuradas!");
  console.error("Acesse o painel da Vercel e adicione essas chaves para habilitar a autenticação.");
}

export interface AuthPayload {
  userId: string;
  role: string;
  nome: string;
  email: string;
}

export interface AuthRequest extends ExpressRequest {
  user?: AuthPayload;
}

/** Gera token de acesso (curta duração: 1 hora) */
export const generateToken = (payload: AuthPayload): string => {
  if (!JWT_SECRET) throw new Error("JWT_SECRET ausente.");
  return jwt.sign(payload, JWT_SECRET as string, { expiresIn: "1h" });
};

/** Gera token de renovação (longa duração: 7 dias) */
export const generateRefreshToken = (payload: AuthPayload): string => {
  if (!REFRESH_SECRET) throw new Error("REFRESH_SECRET ausente.");
  return jwt.sign(payload, REFRESH_SECRET as string, { expiresIn: "7d" });
};

export const verifyToken = (token: string): AuthPayload => {
  if (!JWT_SECRET) throw new Error("JWT_SECRET ausente.");
  return jwt.verify(token, JWT_SECRET as string) as unknown as AuthPayload;
};

export const verifyRefreshToken = (token: string): AuthPayload => {
  if (!REFRESH_SECRET) throw new Error("REFRESH_SECRET ausente.");
  return jwt.verify(token, REFRESH_SECRET as string) as unknown as AuthPayload;
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
  } catch (err: unknown) {
    const error = err as Error;
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expirado", code: "TOKEN_EXPIRED" });
    }
    return res.status(401).json({ 
      error: "Token inválido", 
      details: error.message,
      debug: {
        hasSecret: !!process.env.JWT_SECRET,
        tokenPrefix: token.substring(0, 10) + "..."
      }
    });
  }
};

/** Middleware: tenta autenticar mas não bloqueia se falhar */
export const optionalAuth = (req: ExpressRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const queryToken = req.query.token as string;
  let token: string | undefined;

  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  } else if (queryToken) {
    token = queryToken;
  }

  if (!token) return next();

  try {
    (req as AuthRequest).user = verifyToken(token);
  } catch {
    // Ignora erro de token em rotas opcionais
  }
  return next();
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

export const requireAdmin = [requireAuth, requireRole("ADMIN")];
export const requireFranchisee = [requireAuth, requireRole("FRANCHISEE", "ADMIN")];
