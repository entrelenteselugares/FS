import { Request, Response } from "express";
import { AuthRequest } from "../lib/auth";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma";
import { generateToken } from "../lib/auth";
import { logger } from "../lib/logger";

export class AuthController {
  /** POST /api/auth/login */
  static async login(req: Request, res: Response) {
    // ✅ Guard: variáveis críticas verificadas ANTES de qualquer lógica
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[AUTH CONFIG ERROR] SUPABASE_URL ou SERVICE_ROLE_KEY ausentes no ambiente.");
      return res.status(503).json({ 
        error: "Configuração incompleta no servidor. Contate o administrador.",
        code: "SUPABASE_NOT_CONFIGURED"
      });
    }

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
        console.log("[AUTH] Master Bypass em verificação para: ", cleanEmail);
        let user = await prisma.user.findUnique({ where: { email: cleanEmail } });
        
        if (authError) {
          console.log("[AUTH] Falha no login Supabase para Mestre. Verificando existência...");
          // Tenta buscar o usuário no Supabase para ver se ele já existe
          const { data: listUsers } = await supabaseAdmin.auth.admin.listUsers();
          const existingSupabaseUser = listUsers.users.find(u => u.email === cleanEmail);

          if (existingSupabaseUser) {
            console.log("[AUTH] Mestre existe no Supabase. Sincronizando senha...");
            await supabaseAdmin.auth.admin.updateUserById(existingSupabaseUser.id, { password: senha });
          } else {
            console.log("[AUTH] Mestre NÃO existe no Supabase. Criando...");
            const { data: mData, error: mError } = await supabaseAdmin.auth.admin.createUser({
              email: cleanEmail,
              password: senha,
              email_confirm: true,
              user_metadata: { nome: "Admin Master", role: "ADMIN" }
            });
            if (mError) console.error("[AUTH] Erro ao criar mestre:", mError.message);
            if (mData.user && !user) {
              user = await prisma.user.create({
                data: { id: mData.user.id, email: cleanEmail, senha: "MASTER_BYPASS", nome: "Admin Master", role: "ADMIN" }
              });
            }
          }
        }

        // Se ainda não temos o perfil no Prisma mas temos no Supabase (após o passo acima)
        if (!user) {
          const { data: listUsers } = await supabaseAdmin.auth.admin.listUsers();
          const sUser = listUsers.users.find(u => u.email === cleanEmail);
          if (sUser) {
             user = await prisma.user.upsert({
               where: { id: sUser.id },
               update: { email: cleanEmail, role: "ADMIN", nome: "Admin Master" },
               create: { id: sUser.id, email: cleanEmail, senha: "MASTER_BYPASS", nome: "Admin Master", role: "ADMIN" }
             });
          }
        }

        if (user) {
          console.log("[AUTH] Master Bypass Concedido.");
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
      let user = await prisma.user.findUnique({ where: { id: supabaseUser.id } });
      
      if (!user) {
        console.log(`[AUTH] UID mismatch detected for ${supabaseUser.email}. Attempting self-healing...`);
        // Fallback: Buscar por e-mail e corrigir o ID caso coincida
        const userByEmail = await prisma.user.findUnique({ where: { email: supabaseUser.email } });
        
        if (userByEmail) {
          console.log(`[AUTH] Fixing UID for ${supabaseUser.email}: ${userByEmail.id} -> ${supabaseUser.id}`);
          // Usamos raw query para trocar a PK (id) de forma segura
          await prisma.$executeRawUnsafe(
            `UPDATE users SET id = $1 WHERE email = $2`,
            supabaseUser.id,
            supabaseUser.email
          );
          // Recarrega o usuário com o novo ID
          user = await prisma.user.findUnique({ where: { id: supabaseUser.id } });
        }
      }

      if (!user) {
        return res.status(404).json({ error: "Perfil não encontrado no banco de dados. Contate o suporte." });
      }

      const token = generateToken({ userId: user.id, role: user.role, nome: user.nome });
      
      // Log de Auditoria
      await logger.info(user.id, "LOGIN", { email: user.email, role: user.role });

      return res.json({ token, user: { id: user.id, nome: user.nome, email: user.email, role: user.role } });

    } catch (error: any) {
      console.error("[AUTH LOGIN ERROR]:", error?.message || error);
      return res.status(500).json({ error: "Erro interno no servidor de autenticação" });
    }
  }

  /** POST /api/auth/register */
  static async register(req: Request, res: Response) {
    const { email, senha, nome, role, whatsapp, acceptedTerms, acceptedPrivacy } = req.body;
    
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
      // "UNIDADE" é o label do frontend para pontos fixos — mapeamos para "CARTORIO" (enum do banco)
      const roleUpper = role?.toUpperCase();
      const finalRole = roleUpper === "UNIDADE" ? "CARTORIO"
        : ["ADMIN", "CARTORIO", "PROFISSIONAL", "CLIENTE"].includes(roleUpper) ? roleUpper
        : "CLIENTE";
      
      const user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: { 
            id: supabaseUser.id,
            email: cleanEmail, 
            senha: "AUTH_EXTERNAL_SUPABASE",
            nome, 
            role: finalRole as any, 
            whatsapp: cleanWhatsapp,
            acceptedTermsAt: acceptedTerms ? new Date() : null,
            acceptedPrivacyAt: acceptedPrivacy ? new Date() : null
          }
        });

        // 3. Criar perfis específicos
        if (finalRole === "PROFISSIONAL") {
          await tx.profissional.create({
            data: {
              userId: newUser.id,
              services: req.body.habilidades || [], // Foto, Vídeo, Edição
              otherHabilities: req.body.outrasHabilidades || null,
              equipment: req.body.equipamento || null,
            }
          });
        } else if (finalRole === "UNIDADE" || finalRole === "CARTORIO") {
          await tx.cartorio.create({
            data: {
              userId: newUser.id,
              razaoSocial: req.body.razaoSocial || nome,
              address: req.body.endereco || null,
              cidade: req.body.cidade || null,
              cnpj: req.body.cnpj || null,
            }
          });
        }

        return newUser;
      });

      console.log(`[AUTH] Registro e perfil sincronizados: ${user.id}`);

      // Log de Auditoria
      await logger.info(user.id, "REGISTER", { email: user.email, role: user.role });

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
  static async me(req: AuthRequest, res: Response) {
    try {
      const payload = req.user;
      if (!payload) return res.status(401).json({ error: "Não autorizado" });
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
