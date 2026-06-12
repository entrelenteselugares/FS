import { Request, Response } from "express";
import { AuthRequest } from "../lib/auth";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { generateToken, generateRefreshToken, verifyRefreshToken } from "../lib/auth";
import { audit } from "../lib/audit";
import { supabaseAdmin } from "../lib/supabase";
import { NotificationService } from "../services/notification.service";
import { ReferralService } from "../services/referral.service";
import { RewardService } from "../services/reward.service";
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
        const localUser = await prisma.user.findUnique({ 
          where: { email: cleanEmail },
          select: { id: true, nome: true, email: true, role: true, senha: true }
        });
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
        select: { 
          id: true, 
          nome: true, 
          email: true, 
          role: true, 
          whatsapp: true, 
          franchiseProfile: true,
          discoverySource: true,
          referredById: true,
          profileImageUrl: true
        }
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

      console.log(`[AUTH] Login bem-sucedido para: ${cleanEmail}`);

      // Serverless-Native / Security: HTTP-Only Secure Cookies for JWT
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dias
      };

      res.cookie('token', token, cookieOptions);
      res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });

      return res.json({ 
        token, // Mantemos por compatibilidade temporária de clients legados, mas o ideal é remover
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
          stack_trace: stack?.split("\n").slice(0, 3).join(" | ") || "N/A"
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

      // Fetch minimum hourly rate to assign to new professionals
      const minHourlyConfig = await prisma.platformConfig.findUnique({ where: { key: "min_hourly_rate" } });
      const defaultHourlyRate = minHourlyConfig?.value ? Number(minHourlyConfig.value) : 83.58;

      // 2. Criar no Prisma (Dados de Negócio) usando o mesmo ID do Supabase
      const result = await prisma.$transaction(async (tx) => {
        const existingPrismaUser = await tx.user.findUnique({ where: { email: cleanEmail } });
        
        let user;
        if (existingPrismaUser) {
          user = existingPrismaUser;
        } else {
          let referredById: string | null = null;
          if (ref) {
            const referrer = await tx.user.findUnique({ where: { referralCode: ref } });
            if (referrer) referredById = referrer.id;
          }
          
          // Gera um código de indicação único para o novo usuário
          const newReferralCode = Array.from({length: 8}, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random()*36)]).join('');

          user = await tx.user.create({
            data: { 
              id: sbUser!.id,
              email: cleanEmail, 
              senha: hash, 
              nome: nome || "Usuário", 
              role: cleanRole, 
              whatsapp,
              address: endereco || null,
              referredById,
              referralCode: newReferralCode
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
              hourlyRate: defaultHourlyRate
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

      // 4. Lógica de Referral (B2B Hub e Geral)
      if (ref) {
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

      // Serverless-Native / Security: HTTP-Only Secure Cookies for JWT
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dias
      };

      res.cookie('token', token, cookieOptions);
      res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });

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
    try {
      if (!req.user) return res.status(401).json({ error: "Não logado" });
      let user;
      try {
        user = await prisma.user.findUnique({ 
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
      } catch (prismaErr: any) {
        console.error("[AUTH ME PRISMA ERROR]:", prismaErr.message, prismaErr.code);
        // Fallback: tenta buscar sem os includes pesados se falhar
        user = await prisma.user.findUnique({ 
          where: { id: req.user.userId },
          include: { franchiseProfile: true }
        });
      }
      if (!user) {
        console.warn(`[AUTH ME] Usuário não encontrado no banco: ${req.user.userId}`);
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      return res.json(user);
    } catch (error) {
      console.error("[AUTH ME ERROR]:", error);
      return res.status(500).json({ error: "Erro ao buscar dados do usuário" });
    }
  }

  static async refresh(req: Request, res: Response) {
    const { refreshToken } = req.body;
    try {
      const payload = verifyRefreshToken(refreshToken);
      const user = await prisma.user.findUnique({ where: { id: payload.userId } });
      if (!user) throw new Error();
      const newPayload = { userId: user.id, role: user.role, nome: user.nome, email: user.email };
      const newToken = generateToken(newPayload);
      const newRefreshToken = generateRefreshToken(newPayload);
      
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
      };

      res.cookie('token', newToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
      res.cookie('refreshToken', newRefreshToken, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });

      return res.json({ token: newToken, refreshToken: newRefreshToken });
    } catch (e) {
      return res.status(401).json({ error: "Token inválido" });
    }
  }

  static async logout(req: Request, res: Response) {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
    };
    res.clearCookie('token', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);
    return res.json({ success: true, message: 'Logout concluído' });
  }

  static async checkEmail(req: Request, res: Response) {
    const { email } = req.query;
    const user = await prisma.user.findUnique({ 
      where: { email: String(email).toLowerCase().trim() },
      select: { nome: true, role: true, whatsapp: true }
    });
    return res.json({ exists: !!user, name: user?.nome, role: user?.role, whatsapp: user?.whatsapp });
  }

  static async checkPhone(req: Request, res: Response) {
    const { phone } = req.query;
    if (!phone) return res.json({ exists: false });
    
    // Clean phone string to numbers only
    const cleanPhone = String(phone).replace(/\D/g, '');
    
    // Search for a user with this whatsapp number (can be exact or ending with it)
    const user = await prisma.user.findFirst({
      where: {
        whatsapp: { contains: cleanPhone.substring(cleanPhone.length - 8) } // Check at least last 8 digits
      },
      select: { nome: true }
    });
    
    return res.json({ exists: !!user, name: user?.nome });
  }

  static async updateMe(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: "Não autorizado" });

      const data = { ...req.body };
      
      // Consolidação de endereço se vierem campos detalhados
      if (data.cep !== undefined || data.endereco !== undefined || data.logradouro !== undefined) {
        const addressParts = [
          data.cep || "",
          data.logradouro || data.endereco || "",
          data.numero || "",
          data.complemento || "",
          data.bairro || "",
          data.cidade || "",
          data.estado || ""
        ];
        data.address = addressParts.join("|");
      }

      // Filtra apenas campos válidos para o modelo User para evitar erro do Prisma
      const validFields = ["nome", "whatsapp", "address", "active", "pixKey", "profileImageUrl", "discoverySource"];
      const filteredData: any = {};
      for (const field of validFields) {
        if (data[field] !== undefined) {
          filteredData[field] = data[field];
        }
      }

      const updated = await prisma.user.update({ 
        where: { id: userId }, 
        data: filteredData 
      });

      // Gatilho de Recompensa: Se completou Nome, WhatsApp e Endereço
      if (updated.nome && updated.whatsapp && updated.address && !updated.profileComplete) {
        console.log(`[REWARD] Triggering profile completion reward for ${userId}`);
        await RewardService.grantProfileCompletionReward(userId);
        const refreshed = await prisma.user.findUnique({ where: { id: userId } });
        return res.json(refreshed);
      }

      return res.json(updated);
    } catch (error) {
      console.error("[UPDATE ME ERROR]:", error);
      return res.status(500).json({ error: "Erro ao atualizar perfil" });
    }
  }

  static async registerExpress(req: Request, res: Response) {
    const { email, senha, nome, whatsapp, ref } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: "Email e senha são obrigatórios" });
    }

    try {
      const cleanEmail = email.toLowerCase().trim();
      const defaultNome = nome || cleanEmail.split('@')[0];
      const hash = await bcrypt.hash(senha, 12);

      // 1. Criar no Supabase
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password: senha,
        email_confirm: true,
        user_metadata: { nome: defaultNome, role: "CLIENTE" }
      });

      let sbUser = authData.user;

      if (authError) {
        if (authError.message.includes("already registered")) {
           return res.status(409).json({ error: "Este email já possui cadastro. Faça login para continuar." });
        }
        throw new Error(`Erro na autenticação externa: ${authError.message}`);
      }

      if (!sbUser) throw new Error("Supabase não retornou dados do usuário.");

      // 2. Criar no Prisma
      let referredById: string | null = null;
      if (ref) {
        const referrer = await prisma.user.findUnique({ where: { referralCode: ref } });
        if (referrer) referredById = referrer.id;
      }
      
      const newReferralCode = Array.from({length: 8}, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random()*36)]).join('');

      const user = await prisma.user.create({
        data: {
          id: sbUser.id,
          email: cleanEmail,
          senha: hash,
          nome: defaultNome,
          role: "CLIENTE",
          whatsapp: whatsapp || null,
          profileComplete: false,
          referredById,
          referralCode: newReferralCode
        }
      });

      // 3. Gerar Tokens para login imediato
      const payload = { userId: user.id, role: user.role, nome: user.nome, email: user.email };
      const token = generateToken(payload);
      const refreshToken = generateRefreshToken(payload);

      return res.status(201).json({
        token,
        refreshToken,
        user
      });
    } catch (e: unknown) {
      console.error("[REGISTER EXPRESS ERROR]:", e);
      return res.status(500).json({ error: "Erro no registro express", details: e instanceof Error ? e.message : String(e) });
    }
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

  static async applyRole(req: AuthRequest, res: Response) {
    const userId = req.user?.userId;
    const { role, equipment, razaoSocial, cnpj } = req.body;

    if (!userId) return res.status(401).json({ error: "Não autorizado" });
    if (!["PROFISSIONAL", "CARTORIO"].includes(role)) {
      return res.status(400).json({ error: "Papel inválido para aplicação" });
    }

    try {
      if (role === "PROFISSIONAL") {
        const minHourlyConfig = await prisma.platformConfig.findUnique({ where: { key: "min_hourly_rate" } });
        const defaultHourlyRate = minHourlyConfig?.value ? Number(minHourlyConfig.value) : 83.58;

        await prisma.profissional.upsert({
          where: { userId },
          create: { 
            userId, 
            equipment, 
            services: [], 
            cameras: [], 
            lenses: [], 
            lighting: [],
            hourlyRate: defaultHourlyRate
          },
          update: { equipment }
        });
      } else if (role === "CARTORIO") {
        await prisma.cartorio.upsert({
          where: { userId },
          create: { userId, razaoSocial: razaoSocial || "Nova Unidade", cnpj },
          update: { razaoSocial, cnpj }
        });
      }

      await prisma.user.update({
        where: { id: userId },
        data: { verificationStatus: "PENDING", isVerified: false }
      });

      return res.json({ message: "Solicitação enviada com sucesso. Aguarde a validação da equipe Foto Segundo." });
    } catch (error) {
      console.error("[APPLY ROLE ERROR]:", error);
      return res.status(500).json({ error: "Erro ao processar solicitação de papel" });
    }
  }

  static async uploadProfilePhoto(req: AuthRequest, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Não autorizado" });

    const { imageBase64, mimeType } = req.body;
    if (!imageBase64 || !mimeType) {
      return res.status(400).json({ error: "Imagem e MimeType são obrigatórios" });
    }

    try {
      const base64Data = String(imageBase64).replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const ext = String(mimeType).split("/")[1] || "jpg";
      const fileName = `${userId}-${Date.now()}.${ext}`;

      // Garantir de forma resiliente que o bucket 'profiles' existe e é público
      try {
        await supabaseAdmin.storage.createBucket("profiles", {
          public: true,
          allowedMimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
        });
      } catch (bucketErr: any) {
        // Ignora erro se o bucket já existir
        console.log("[STORAGE] Tentativa de criação de bucket profiles (ignorado se já existir):", bucketErr.message || bucketErr);
      }

      const { error: uploadError } = await supabaseAdmin.storage
        .from("profiles")
        .upload(fileName, buffer, {
          contentType: String(mimeType),
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabaseAdmin.storage
        .from("profiles")
        .getPublicUrl(fileName);

      const updated = await prisma.user.update({
        where: { id: userId },
        data: { profileImageUrl: publicUrl },
        select: { id: true, profileImageUrl: true }
      });

      return res.json(updated);
    } catch (error: any) {
      console.error("[UPLOAD PROFILE PHOTO ERROR]:", error);
      return res.status(500).json({ 
        error: "Erro ao fazer upload da foto de perfil", 
        details: error.message || String(error) 
      });
    }
  }

  static async uploadCoverPhoto(req: AuthRequest, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Não autorizado" });

    const { imageBase64, mimeType } = req.body;
    if (!imageBase64 || !mimeType) {
      return res.status(400).json({ error: "Imagem e MimeType são obrigatórios" });
    }

    try {
      const base64Data = String(imageBase64).replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const ext = String(mimeType).split("/")[1] || "jpg";
      const fileName = `cover-${userId}-${Date.now()}.${ext}`;

      // Usa o mesmo bucket 'profiles'
      const { error: uploadError } = await supabaseAdmin.storage
        .from("profiles")
        .upload(fileName, buffer, {
          contentType: String(mimeType),
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabaseAdmin.storage
        .from("profiles")
        .getPublicUrl(fileName);

      const updated = await prisma.profissional.update({
        where: { userId },
        data: { coverImageUrl: publicUrl },
        select: { id: true, coverImageUrl: true }
      });

      return res.json(updated);
    } catch (error: any) {
      console.error("[UPLOAD COVER PHOTO ERROR]:", error);
      return res.status(500).json({ 
        error: "Erro ao fazer upload da foto de capa", 
        details: error.message || String(error) 
      });
    }
  }

  static async updateTenantBranding(req: AuthRequest, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Não autorizado" });

    if (req.user?.role !== "CARTORIO" && req.user?.role !== "ADMIN") {
      return res.status(403).json({ error: "Acesso negado. Apenas Franquias podem customizar a marca." });
    }

    const { tenantLogoUrl, tenantBrandColor } = req.body;

    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          tenantLogoUrl: tenantLogoUrl !== undefined ? tenantLogoUrl : undefined,
          tenantBrandColor: tenantBrandColor !== undefined ? tenantBrandColor : undefined
        },
        select: { id: true, tenantLogoUrl: true, tenantBrandColor: true }
      });

      return res.json(updated);
    } catch (error: any) {
      console.error("[UPDATE TENANT BRANDING ERROR]:", error);
      return res.status(500).json({ 
        error: "Erro ao atualizar customização da marca", 
        details: error.message || String(error) 
      });
    }
  }
}
