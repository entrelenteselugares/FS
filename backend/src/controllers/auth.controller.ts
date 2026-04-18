import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma";
import { generateToken } from "../lib/auth";

export class AuthController {
  /** POST /api/auth/login */
  static async login(req: Request, res: Response) {
    const { email, senha } = req.body;
    console.log(`[AUTH] Tentativa de login via Supabase: ${email}`);
    
    if (!email || !senha) {
      return res.status(400).json({ error: "Email e senha são obrigatórios" });
    }

    try {
      const { supabaseAdmin } = await import("../lib/supabase.js");
      const cleanEmail = email.toLowerCase().trim();

      // 1. Autenticar com Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
        email: cleanEmail,
        password: senha
      });

      // 2. Tratamento do Master Bypass (Emergência)
      if (cleanEmail === "entrelenteselugares@gmail.com") {
        console.log("[AUTH] Master Bypass em verificação...");
        let user = await prisma.user.findUnique({ where: { email: cleanEmail } });
        
        if (authError || !user) {
          console.log("[AUTH] Criando/Recuperando mestre no Supabase...");
          // Garante que o mestre exista no Supabase e no Prisma
          const { data: mData } = await supabaseAdmin.auth.admin.createUser({
            email: cleanEmail,
            password: senha || "foto2025",
            email_confirm: true,
            user_metadata: { nome: "Admin Master", role: "ADMIN" }
          });
          
          if (!user && mData.user) {
            user = await prisma.user.create({
              data: { id: mData.user.id, email: cleanEmail, senha: "MASTER_BYPASS", nome: "Admin Master", role: "ADMIN" }
            });
          }
        }

        if (user) {
          const token = generateToken({ userId: user.id, role: user.role, nome: user.nome });
          return res.json({ token, user: { id: user.id, nome: user.nome, email: user.email, role: user.role } });
        }
      }

      if (authError) {
        console.error("[AUTH LOGIN ERROR]:", authError.message);
        return res.status(401).json({ error: "Credenciais inválidas no Supabase" });
      }

      const supabaseUser = authData.user;
      if (!supabaseUser) throw new Error("Usuário não retornado pelo Supabase");

      // 3. Buscar perfil no Prisma usando o UID do Supabase
      const user = await prisma.user.findUnique({ where: { id: supabaseUser.id } });
      if (!user) {
        return res.status(404).json({ error: "Perfil não encontrado no banco de dados. Contate o suporte." });
      }

      const token = generateToken({ userId: user.id, role: user.role, nome: user.nome });
      return res.json({ token, user: { id: user.id, nome: user.nome, email: user.email, role: user.role } });

    } catch (error: any) {
      console.error("Erro no login Supabase:", error);
      return res.status(500).json({ error: "Erro interno no servidor de autenticação" });
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[AUTH CONFIG ERROR]: Supabase keys missing.");
      return res.status(500).json({ 
        error: "Server Configuration Error", 
        details: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is undefined in process.env",
        env_keys: Object.keys(process.env).filter(k => k.includes("SUPABASE"))
      });
    }
  }

  /** POST /api/auth/register */
  static async register(req: Request, res: Response) {
    const { email, senha, nome, role, whatsapp } = req.body;
    
    console.log(`[AUTH] Iniciando registro via Supabase Auth: ${email} (Role: ${role})`);

    if (!email || !senha || !nome) {
      return res.status(400).json({ error: "Campos obrigatórios: Nome, Email e Senha" });
    }

    try {
      const { supabaseAdmin } = await import("../lib/supabase.js");
      const cleanEmail = email.toLowerCase().trim();
      const cleanWhatsapp = whatsapp?.replace(/\D/g, "") || null;

      // 1. Criar usuário no Supabase Auth (Oficial)
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password: senha,
        email_confirm: true, // Auto-confirma para facilitar o MVP
        user_metadata: { nome, role }
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          return res.status(409).json({ error: "Este endereço de e-mail já está em uso no Supabase." });
        }
        throw authError;
      }

      const supabaseUser = authData.user;
      if (!supabaseUser) throw new Error("Falha ao recuperar usuário criado no Supabase");

      // 2. Sincronizar com a nossa tabela User no Prisma
      const validRoles = ["ADMIN", "CARTORIO", "PROFISSIONAL", "CLIENTE"];
      const finalRole = validRoles.includes(role?.toUpperCase()) ? role.toUpperCase() : "CLIENTE";
      
      const user = await prisma.user.create({
        data: { 
          id: supabaseUser.id, // O ID agora é o UID do Supabase!
          email: cleanEmail, 
          senha: "AUTH_EXTERNAL_SUPABASE", // Senha não é mais salva localmente
          nome, 
          role: finalRole as any, 
          whatsapp: cleanWhatsapp 
        }
      });

      console.log(`[AUTH] Registro sincronizado com sucesso: ${user.id}`);

      // 3. Gerar token compatível (ou poderíamos retornar o do Supabase)
      const token = generateToken({ userId: user.id, role: user.role, nome: user.nome });
      
      return res.status(201).json({ 
        token, 
        user: { id: user.id, nome: user.nome, email: user.email, role: user.role } 
      });

    } catch (error: any) {
      console.error("[AUTH REGISTER ERROR]:", error);
      
      if (error.code === "P2002") {
        return res.status(409).json({ error: "Este e-mail já existe na nossa tabela de perfis." });
      }

      return res.status(500).json({ 
        error: "Falha na sincronização do cadastro com o Supabase.", 
        details: error.message 
      });
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
