import { Request, Response } from "express";
import { AuthRequest } from "../lib/auth";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { generateToken, generateRefreshToken, verifyRefreshToken } from "../lib/auth";
import { audit } from "../lib/audit";
import { supabaseAdmin } from "../lib/supabase";
import { NotificationService } from "../services/notification.service";
import { ReferralService } from "../services/referral.service";
import crypto from "crypto";
import { APP_URL } from "../lib/config";

export class AuthController {
  /** 
   * POST /api/auth/login
   * VERSÃO ULTRA-RESILIENTE (Bcrypt Local como Prioridade para Debug)
   */
  static async login(req: Request, res: Response) {
    const { email, senha } = req.body;
    
    if (!email || !senha) {
      return res.status(400).json({ error: "Email e senha são obrigatórios" });
    }

    try {
      const cleanEmail = email.toLowerCase().trim();
      let user: { id: string, nome: string, email: string, role: string, senha?: string | null } | null = null;
      let authMethod = "NONE";

      // 1. PRIORIDADE: BANCO LOCAL (BCRYPT)
      // Se o usuário existir localmente e a senha bater, ignoramos o Supabase por enquanto para garantir acesso.
      try {
        console.log(`[AUTH] Tentando busca local para: ${cleanEmail}`);
        const localUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
        if (localUser && localUser.senha && localUser.senha.length > 20) { // Verifica se tem um hash bcrypt válido
          const isMatch = await bcrypt.compare(senha, localUser.senha);
          if (isMatch) {
            console.log(`[AUTH] Sucesso via Local Bcrypt: ${cleanEmail}`);
            user = localUser;
            authMethod = "LOCAL_BCRYPT";
          }
        }
        } catch (localErr: unknown) {
          console.error(`[AUTH] Erro no fallback local:`, localErr instanceof Error ? localErr.message : String(localErr));
        }

      // 2. SEGUNDA OPÇÃO: SUPABASE CLOUD (Apenas se o local falhar)
      if (!user) {
        try {
          // Verifica se o Supabase está configurado antes de tentar usar
          if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
            const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
              email: cleanEmail,
              password: senha
            });

            if (!authError && authData.user) {
              user = await prisma.user.findUnique({ where: { email: cleanEmail } });
              authMethod = "SUPABASE";
              console.log(`[AUTH] Sucesso via Supabase Cloud: ${cleanEmail}`);
            }
          }
        } catch (sbErr: unknown) {
          console.error(`[AUTH] Supabase indisponível ou mal configurado:`, sbErr instanceof Error ? sbErr.message : String(sbErr));
        }
      }

      // 3. NENHUMA AUTENTICAÇÃO VÁLIDA — acesso negado
      if (!user) {
        return res.status(401).json({ error: "Credenciais inválidas ou usuário não encontrado." });
      }

      // 4. Busca dados extras (Franquia, etc) para o frontend
      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { franchiseProfile: true }
      });

      if (!fullUser) return res.status(404).json({ error: "Usuário não sincronizado no banco de dados." });

      const payload = { userId: fullUser.id, role: fullUser.role, nome: fullUser.nome, email: fullUser.email };
      
      // Validação extra de tokens
      if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET ausente no ambiente (Vercel).");
      if (!process.env.REFRESH_SECRET) throw new Error("REFRESH_SECRET ausente no ambiente (Vercel).");

      const token = generateToken(payload);
      const refreshToken = generateRefreshToken(payload);
      
      // Audit opcional (não bloqueia o login se falhar)
      try { await audit(req, "LOGIN", "User", fullUser.id, null, { method: authMethod }); } catch (e) {}

      return res.json({ 
        token, 
        refreshToken,
        user: fullUser
      });

    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : "No stack trace";
      console.error("[AUTH FATAL]:", msg, stack);
      return res.status(500).json({ 
        error: "Erro crítico no portal de login.",
        details: msg,
        diagnostic: {
          has_db: !!process.env.DATABASE_URL,
          has_sb: !!process.env.SUPABASE_URL,
          has_jwt: !!process.env.JWT_SECRET,
          has_refresh: !!process.env.REFRESH_SECRET,
          node_ver: process.version,
          time: new Date().toISOString(),
          stack_trace: stack.split("\n").slice(0, 3).join(" | ") // Pequeno snippet do stack para o frontend
        }
      });
    }
  }

  /** POST /api/auth/register */
  static async register(req: Request, res: Response) {
    const { nome, email, senha, role, whatsapp, habilidades, equipamento, outrasHabilidades, workflowType, razaoSocial, endereco, cidade, ref, claim } = req.body;

    try {
      const hash = await bcrypt.hash(senha, 12);
      const cleanRole = (role?.toUpperCase() || "CLIENTE") as "ADMIN" | "PROFISSIONAL" | "CARTORIO" | "CLIENTE";

      const cleanEmail = email.toLowerCase().trim();

      // 1. Criar no Supabase Auth (Fonte da Verdade para Autenticação)
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password: senha,
        email_confirm: true,
        user_metadata: { nome, role: cleanRole }
      });

      let sbUser = authData.user;
      
      if (authError) {
        if (authError.message.includes("already registered") || authError.status === 422) {
           console.log(`[REGISTER] Usuário ${cleanEmail} já existe no Supabase. Tentando sincronização Prisma.`);
           const { data: existingUserData } = await supabaseAdmin.auth.admin.listUsers();
           const found = existingUserData.users.find(u => u.email?.toLowerCase() === cleanEmail);
           if (!found) throw new Error("Usuário existe no Supabase mas não pôde ser localizado para sincronia.");
           sbUser = found;
        } else {
          console.error("[Supabase Auth Error]:", authError);
          throw new Error(`Erro na autenticação externa: ${authError.message}`);
        }
      }

      if (!sbUser) throw new Error("Supabase não retornou dados do usuário.");

      // 2. Criar no Prisma (Dados de Negócio) usando o mesmo ID do Supabase
      const result = await prisma.$transaction(async (tx) => {
        const existingPrismaUser = await tx.user.findUnique({ where: { email: cleanEmail } });
        
        let user;
        if (existingPrismaUser) {
          user = existingPrismaUser;
        } else {
          user = await tx.user.create({
            data: { 
              id: sbUser!.id,
              email: cleanEmail, 
              senha: hash, 
              nome: nome || "Usuário", 
              role: cleanRole, 
              whatsapp 
            }
          });
        }

        // 3. Criar Perfil Específico
        if (cleanRole === "PROFISSIONAL") {
          await tx.profissional.upsert({
            where: { userId: user.id },
            create: {
              userId: user.id,
              services: habilidades || [],
              equipment: equipamento || "",
              otherHabilities: outrasHabilidades || "",
              workflowType: workflowType || ["TRADICIONAL"],
              hourlyRate: 150.00
            },
            update: {}
          });
        } else if (cleanRole === "CARTORIO") {
          await tx.cartorio.upsert({
            where: { userId: user.id },
            create: {
              userId: user.id,
              razaoSocial: razaoSocial || nome,
              address: endereco || "",
              cidade: cidade || "",
              services: habilidades || []
            },
            update: {}
          });
        }

        // 4. Se houver um "claim" (Flash Card), vinculamos ao novo usuário
        if (claim) {
          console.log(`[FLASH CLAIM] Vinculando cartão ${claim} ao usuário ${user.id}`);
          await tx.flashCard.updateMany({
            where: { shortId: claim },
            data: { 
              userId: user.id,
              status: "CLAIMED"
            }
          });
        }

        return user;
      });

      // 4. Lógica de Referral (B2B Hub)
      if (result.role === "PROFISSIONAL" && ref) {
        ReferralService.linkByCode(result.id, ref).catch((e: unknown) => console.error("[Referral Error]:", e));
      }

      // 5. Gerar Tokens para Login Imediato
      const payload = { userId: result.id, role: result.role, nome: result.nome, email: result.email };
      const token = generateToken(payload);
      const refreshToken = generateRefreshToken(payload);

      const fullResult = await prisma.user.findUnique({
        where: { id: result.id },
        include: { franchiseProfile: true }
      });

      return res.status(201).json({ 
        token,
        refreshToken,
        user: fullResult || result
      });
    } catch (e: unknown) {
      console.error("[REGISTER ERROR]:", e);
      return res.status(500).json({ error: "Erro no registro", details: e instanceof Error ? e.message : String(e) });
    }
  }

  static async me(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ error: "Não logado" });
    const user = await prisma.user.findUnique({ 
      where: { id: req.user.userId },
      include: {
        franchiseProfile: {
          include: {
            transactions: {
              orderBy: { createdAt: 'desc' },
              take: 10
            }
          }
        },
        gamificationLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    });
    return res.json(user);
  }

  static async refresh(req: Request, res: Response) {
    const { refreshToken } = req.body;
    try {
      const payload = verifyRefreshToken(refreshToken);
      const user = await prisma.user.findUnique({ where: { id: payload.userId } });
      if (!user) throw new Error();
      const newPayload = { userId: user.id, role: user.role, nome: user.nome, email: user.email };
      return res.json({ token: generateToken(newPayload), refreshToken: generateRefreshToken(newPayload) });
    } catch (e) {
      return res.status(401).json({ error: "Token inválido" });
    }
  }

  static async checkEmail(req: Request, res: Response) {
    const { email } = req.query;
    const user = await prisma.user.findUnique({ 
      where: { email: String(email).toLowerCase().trim() },
      select: { nome: true, role: true, whatsapp: true }
    });
    return res.json({ exists: !!user, name: user?.nome, role: user?.role, whatsapp: user?.whatsapp });
  }

  static async updateMe(req: AuthRequest, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Não autorizado" });
    const updated = await prisma.user.update({ where: { id: userId }, data: req.body });
    return res.json(updated);
  }

  static async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email é obrigatório" });

    try {
      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
      if (!user) {
        // Por segurança, não informamos que o e-mail não existe
        return res.json({ message: "Se o e-mail estiver cadastrado, você receberá instruções em breve." });
      }

      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 3600000); // 1 hora

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken: token,
          resetTokenExpires: expires
        }
      });

      const recoveryLink = `${APP_URL}/reset-password?token=${token}`;
      const sent = await NotificationService.sendPasswordRecoveryEmail({
        to: user.email,
        name: user.nome,
        recoveryLink
      });

      if (!sent) {
        return res.status(500).json({ error: "Falha ao disparar e-mail de recuperação. Verifique as configurações de SMTP." });
      }

      return res.json({ message: "Instruções de recuperação enviadas com sucesso." });
    } catch (error) {
      console.error("[FORGOT PASSWORD ERROR]:", error);
      return res.status(500).json({ error: "Erro ao processar solicitação" });
    }
  }

  static async updatePassword(req: Request, res: Response) {
    const { token, novaSenha } = req.body;
    if (!token || !novaSenha) return res.status(400).json({ error: "Token e nova senha são obrigatórios" });

    try {
      const user = await prisma.user.findFirst({
        where: {
          resetToken: token,
          resetTokenExpires: { gt: new Date() }
        }
      });

      if (!user) {
        return res.status(400).json({ error: "Token inválido ou expirado" });
      }

      const hash = await bcrypt.hash(novaSenha, 12);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          senha: hash,
          resetToken: null,
          resetTokenExpires: null
        }
      });

      return res.json({ message: "Senha atualizada com sucesso!" });
    } catch (error) {
      console.error("[RESET PASSWORD ERROR]:", error);
      return res.status(500).json({ error: "Erro ao atualizar senha" });
    }
  }
}
