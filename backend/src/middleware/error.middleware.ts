import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error("🔥 ERRO NO SERVIDOR:", err);

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Conflito: Registro já existe." });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Registro não encontrado." });
    }
    return res.status(400).json({ error: "Erro de validação no banco de dados." });
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({ error: "Dados inválidos fornecidos." });
  }

  return res.status(500).json({
    error: "Erro interno no servidor",
    message: process.env.NODE_ENV !== "production" ? err.message : "Algo deu errado. Tente novamente.",
  });
};
