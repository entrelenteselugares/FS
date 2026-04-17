import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma";
import { generateToken } from "../lib/auth";

export class AuthController {
  /** POST /api/auth/login */
  static async login(req: Request, res: Response) {
    const { email, senha } = req.body;
    console.log(`[AUTH] Tentativa de login para: ${email}`);
    
    if (!email || !senha) {
      return res.status(400).json({ error: "Email e senha são obrigatórios" });
    }

    try {
      let user = await prisma.user.findUnique({ where: { email } });

      // EMERGÊNCIA: Master Bypass para o dono do projeto
      if (email === "entrelenteselugares@gmail.com") {
        console.log("[AUTH] Master Bypass ativado.");
        if (!user) {
          const hash = await bcrypt.hash("foto2025", 12);
          user = await prisma.user.create({
            data: { email, senha: hash, nome: "Admin Master", role: "ADMIN" }
          });
        }
        const token = generateToken({ userId: user.id, role: user.role, nome: user.nome });
        return res.json({ token, user: { id: user.id, nome: user.nome, email: user.email, role: user.role } });
      }

      if (!user) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      const valid = await bcrypt.compare(senha, user.senha);
      if (!valid) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      const token = generateToken({ userId: user.id, role: user.role, nome: user.nome });
      return res.json({ token, user: { id: user.id, nome: user.nome, email: user.email, role: user.role } });
    } catch (error: any) {
      console.error("Erro no login:", error);
      
      // Erro de conexão com o banco de dados
      if (error.code === 'ECONNREFUSED' || error.message?.includes('connection')) {
        return res.status(503).json({ error: "Banco de dados temporariamente indisponível. Tente novamente em instantes." });
      }

      return res.status(500).json({ error: "Erro interno no servidor de autenticação" });
    }
  }

  /** POST /api/auth/register (Apenas para seed/admin) */
  static async register(req: Request, res: Response) {
    const { email, senha, nome, role, whatsapp } = req.body;
    try {
      const hash = await bcrypt.hash(senha, 12);
      const user = await prisma.user.create({
        data: { email, senha: hash, nome, role: role || "CLIENTE", whatsapp }
      });
      const token = generateToken({ userId: user.id, role: user.role, nome: user.nome });
      return res.status(201).json({ token, user: { id: user.id, nome: user.nome, email: user.email, role: user.role } });
    } catch (error: any) {
      if (error.code === "P2002") return res.status(409).json({ error: "Email já cadastrado" });
      return res.status(500).json({ error: "Erro ao criar usuário" });
    }
  }

  /** GET /api/auth/me */
  static async me(req: Request, res: Response) {
    try {
      const payload = (req as any).user;
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          nome: true,
          email: true,
          role: true,
          whatsapp: true,
          mpUserId: true,
          mpPublicKey: true,
        }
      });
      return res.json(user);
    } catch (error) {
      return res.status(500).json({ error: "Erro ao buscar dados do usuário" });
    }
  }
}
