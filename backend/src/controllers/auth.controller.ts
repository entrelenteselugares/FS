import { Request, Response } from "express";
import { AuthRequest } from "../lib/auth";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma";
import { generateToken, generateRefreshToken, verifyRefreshToken } from "../lib/auth";
import { audit } from "../lib/audit";
import { supabaseAdmin } from "../lib/supabase";
import { NotificationService } from "../services/notification.service";

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
      const cleanEmail = email.toLowerCase().trim();

      // 1. Autenticar com Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
        email: cleanEmail,
        password: senha
      });

      // 2. Tratamento do Master Bypass (Emergência)
      const MASTER_EMAIL = process.env.MASTER_EMAIL || "entrelenteselugares@gmail.com";
      if (cleanEmail === MASTER_EMAIL) {
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
            if (mError) {
              console.error("[AUTH] Erro ao criar mestre:", mError.message);
            } else if (mData?.user && !user) {
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
          const payload = { userId: user.id, role: user.role, nome: user.nome };
          const token = generateToken(payload);
          const refreshToken = generateRefreshToken(payload);
          
          // Log de Auditoria
          await audit(req, "LOGIN_MASTER_BYPASS", "User", user.id, null, { email: user.email });
          
          return res.json({ 
            token, 
            refreshToken,
            user: { id: user.id, nome: user.nome, email: user.email, role: user.role } 
          });
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

      const payload = { userId: user.id, role: user.role, nome: user.nome };
      const token = generateToken(payload);
      const refreshToken = generateRefreshToken(payload);
      
      // Log de Auditoria
      await audit(req, "LOGIN", "User", user.id, null, { email: user.email, role: user.role });

      return res.json({ 
        token, 
        refreshToken,
        user: { id: user.id, nome: user.nome, email: user.email, role: user.role } 
      });

    } catch (error: any) {
      console.error("[AUTH FATAL ERROR]:", error);
      return res.status(500).json({ 
        error: "Erro interno no servidor de autenticação",
        details: process.env.NODE_ENV !== "production" ? error.message : undefined
      });
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
      const cleanEmail = email.toLowerCase().trim();
      const cleanWhatsapp = whatsapp?.replace(/\D/g, "") || null;

      // 1. Verificar se o usuário já existe no Prisma (pode ser um convidado)
      const existingPrismaUser = await prisma.user.findUnique({ where: { email: cleanEmail } });

      // 2. Criar usuário no Supabase Auth (Oficial)
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password: senha,
        email_confirm: true,
        user_metadata: { nome, role }
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          return res.status(409).json({ error: "Este endereço de e-mail já está em uso." });
        }
        throw authError;
      }

      const supabaseUser = authData.user;
      if (!supabaseUser) throw new Error("Falha ao recuperar usuário criado no Supabase");

      // 3. Sincronizar com a nossa tabela User no Prisma
      const roleUpper = role?.toUpperCase();
      const finalRole = roleUpper === "UNIDADE" ? "CARTORIO"
        : ["ADMIN", "CARTORIO", "PROFISSIONAL", "CLIENTE"].includes(roleUpper) ? roleUpper
        : "CLIENTE";
      
      const user = await prisma.$transaction(async (tx) => {
        let newUser;
        
        if (existingPrismaUser) {
          console.log(`[AUTH] Convertendo convidado ${cleanEmail} para usuário real...`);
          
          // Se o ID for diferente, precisamos sincronizar (mesma lógica do self-healing no login)
          if (existingPrismaUser.id !== supabaseUser.id) {
            await tx.$executeRawUnsafe(
              `UPDATE users SET id = $1, nome = $2, role = $3, whatsapp = $4 WHERE email = $5`,
              supabaseUser.id, nome, finalRole, cleanWhatsapp, cleanEmail
            );
          } else {
            await tx.user.update({
              where: { email: cleanEmail },
              data: { nome, role: finalRole as any, whatsapp: cleanWhatsapp }
            });
          }
          newUser = await tx.user.findUnique({ where: { id: supabaseUser.id } });
        } else {
          newUser = await tx.user.create({
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
        }

        if (!newUser) throw new Error("Erro ao persistir/atualizar usuário no banco local.");

        // 4. Criar perfis específicos (se ainda não existirem)
        if (finalRole === "PROFISSIONAL") {
          const prof = await tx.profissional.findUnique({ where: { userId: newUser.id } });
          if (!prof) {
            await tx.profissional.create({
              data: {
                userId: newUser.id,
                services: req.body.habilidades || [],
                otherHabilities: req.body.outrasHabilidades || null,
                equipment: req.body.equipamento || null,
              }
            });
          }
        } else if (finalRole === "UNIDADE" || finalRole === "CARTORIO") {
          const cart = await tx.cartorio.findUnique({ where: { userId: newUser.id } });
          if (!cart) {
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
        }

        return newUser;
      });

      console.log(`[AUTH] Registro e perfil sincronizados: ${user.id}`);

      // Log de Auditoria
      await audit(req, "REGISTER", "User", user.id, null, { email: user.email, role: user.role });

      // 3. Gerar tokens compatíveis
      const payload = { userId: user.id, role: user.role, nome: user.nome };
      const token = generateToken(payload);
      const refreshToken = generateRefreshToken(payload);
      
      return res.status(201).json({ 
        token, 
        refreshToken,
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

  /** POST /api/auth/forgot-password */
  static async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "E-mail é obrigatório." });

    // ✅ Guard: Verificar configuração básica
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[AUTH FORGOT] Erro de configuração: SUPABASE_URL ou SERVICE_ROLE_KEY ausentes.");
      return res.status(503).json({ error: "Serviço de autenticação temporariamente indisponível." });
    }

    try {
      const cleanEmail = email.toLowerCase().trim();
      console.log(`[AUTH FORGOT] >>> Iniciando processo para: ${cleanEmail}`);
      
      // 1. Verificar se o usuário existe no Prisma
      const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
      if (!user) {
        console.log(`[AUTH FORGOT] Usuário não encontrado no banco local: ${cleanEmail}`);
        return res.json({ ok: true, message: "Se este e-mail estiver cadastrado, você receberá instruções." });
      }

      // 2. Tentar disparar recuperação via Supabase
      const redirectUrl = `${process.env.FRONTEND_URL || "https://foto-segundo.vercel.app"}/reset-password`;
      console.log(`[AUTH FORGOT] Solicitando reset de senha Supabase... (Redirect: ${redirectUrl})`);
      
      // NOTA: Usamos a API pública do cliente Supabase para que o e-mail seja disparado automaticamente pelo Supabase
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectUrl
      });

      // ── CASO ESPECIAL: Usuário existe no Prisma mas não no Supabase Auth ──
      if (error) {
        console.warn(`[AUTH FORGOT] Supabase reportou erro (${error.status}): ${error.message}`);
        
        if (error.message?.includes("User not found") || error.status === 422 || error.status === 404) {
          console.log(`[AUTH FORGOT] Criando registro Auth retroativo para convidado...`);
          
          try {
            const tempPassword = Math.random().toString(36).slice(-12) + "!";
            const { error: createError } = await supabaseAdmin.auth.admin.createUser({
              email: cleanEmail,
              password: tempPassword,
              email_confirm: true,
              user_metadata: { nome: user.nome, role: user.role }
            });

            if (createError) {
              console.error(`[AUTH FORGOT] Erro ao criar usuário no Supabase:`, createError.message);
              throw createError;
            }

            console.log(`[AUTH FORGOT] Registro Auth criado. Solicitando reset novamente...`);
            const retry = await supabase.auth.resetPasswordForEmail(cleanEmail, {
              redirectTo: redirectUrl
            });
            
            if (retry.error) throw retry.error;
          } catch (syncErr: any) {
            console.error(`[AUTH FORGOT] Falha crítica no fluxo de criação/sync:`, syncErr.message);
            throw syncErr;
          }
        } else {
          throw error;
        }
      }

      // Log de Auditoria
      await audit(req, "PASSWORD_FORGOT_REQUEST", "User", user.id, undefined, { email: cleanEmail });

      console.log(`[AUTH FORGOT] <<< Processo concluído com sucesso via Supabase Email para ${cleanEmail}`);
      return res.json({ ok: true, message: "E-mail de recuperação enviado pelo sistema de autenticação." });

    } catch (error: any) {
      console.error("[AUTH FORGOT FATAL ERROR]:", error);
      return res.status(500).json({ 
        error: "Erro interno ao processar recuperação de senha.",
        details: process.env.NODE_ENV !== "production" ? error.message : undefined
      });
    }
  }

  /** POST /api/auth/update-password */
  static async updatePassword(req: Request, res: Response) {
    const { password, token } = req.body; // token opcional, vindo do hash do supabase

    if (!password || password.length < 6) {
      return res.status(400).json({ error: "A senha deve ter pelo menos 6 caracteres." });
    }

    try {
      // 1. Verificar se o usuário está autenticado pelo Supabase via token de recuperação
      // O Supabase coloca o token no hash, o frontend envia aqui
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

      if (authError || !user) {
        console.error("[AUTH] Erro ao recuperar usuário pelo token:", authError?.message);
        return res.status(401).json({ error: "Link de redefinição inválido ou expirado." });
      }

      // 2. Atualizar a senha no Supabase
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password: password
      });

      if (updateError) throw updateError;

      // 3. Log de Auditoria
      await audit(req, "PASSWORD_RESET", "User", user.id, null, { email: user.email });

      return res.json({ ok: true, message: "Senha atualizada com sucesso." });
    } catch (error: any) {
      console.error("[AUTH UPDATE PWD ERROR]:", error);
      return res.status(500).json({ error: "Falha ao atualizar senha." });
    }
  }

  /** POST /api/auth/refresh */
  static async refresh(req: Request, res: Response) {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: "Refresh token é obrigatório" });

    try {
      const payload = verifyRefreshToken(refreshToken);
      
      // Opcional: Verificar se o usuário ainda existe/está ativo
      const user = await prisma.user.findUnique({ where: { id: payload.userId } });
      if (!user) return res.status(401).json({ error: "Usuário não encontrado" });

      const newPayload = { userId: user.id, role: user.role, nome: user.nome };
      const token = generateToken(newPayload);
      const newRefreshToken = generateRefreshToken(newPayload);

      return res.json({ token, refreshToken: newRefreshToken });
    } catch (err) {
      return res.status(401).json({ error: "Refresh token inválido ou expirado" });
    }
  }

  /** GET /api/public/auth/check?email=... */
  static async checkEmail(req: Request, res: Response) {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: "E-mail é obrigatório" });

    try {
      const cleanEmail = String(email).toLowerCase().trim();
      const user = await prisma.user.findUnique({
        where: { email: cleanEmail },
        select: { id: true, nome: true, role: true }
      });

      // Se o usuário existe no Prisma, verificamos se ele também está no Supabase Auth
      let hasAuth = false;
      if (user) {
        const { data: listUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingSupabaseUser = listUsers.users.find(u => u.email === cleanEmail);
        hasAuth = !!existingSupabaseUser;
      }

      return res.json({
        exists: !!user,
        hasAuth,
        name: user?.nome || null,
        role: user?.role || null
      });
    } catch (error) {
      console.error("[AUTH CHECK ERROR]:", error);
      return res.status(500).json({ error: "Erro ao verificar e-mail" });
    }
  }

  /** PATCH /api/auth/me */
  static async updateMe(req: AuthRequest, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Não autenticado." });
    }

    const { nome, whatsapp } = req.body;

    try {
      const before = await prisma.user.findUnique({
        where: { id: userId },
        select: { nome: true, whatsapp: true }
      });

      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(nome !== undefined && { nome }),
          ...(whatsapp !== undefined && { whatsapp })
        },
        select: { id: true, nome: true, email: true, whatsapp: true, role: true }
      });

      // Log de Auditoria — Captura antes e depois
      await audit(req, "PROFILE_UPDATED", "User", userId, 
        { nome: before?.nome, whatsapp: before?.whatsapp },
        { nome: updated.nome, whatsapp: updated.whatsapp }
      );

      res.json(updated);
    } catch (err) {
      console.error("[AUTH] Erro ao atualizar perfil:", err);
      res.status(500).json({ error: "Erro interno ao atualizar perfil." });
    }
  }
}
