"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashSenha, verificarSenha, gerarToken, COOKIE_CONFIG } from "@/lib/auth";

const loginSchema = z.object({
  whatsapp: z.string().min(10).transform((v) => v.replace(/\D/g, "")),
  senha: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
});

const registroSchema = z.object({
  nome: z.string().min(2, "Nome muito curto"),
  whatsapp: z.string().min(10).transform((v) => v.replace(/\D/g, "")),
  senha: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
  cpf: z.string().optional(),
});

export type AuthState = { error?: string; success?: boolean };

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    whatsapp: formData.get("whatsapp"),
    senha: formData.get("senha"),
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { whatsapp, senha } = parsed.data;
  const usuario = await prisma.usuario.findUnique({ where: { whatsapp } });

  if (!usuario?.senhaHash) return { error: "WhatsApp ou senha incorretos." };
  if (!await verificarSenha(senha, usuario.senhaHash)) return { error: "WhatsApp ou senha incorretos." };
  if (!usuario.ativo) return { error: "Conta desativada. Entre em contato com o suporte." };

  const token = await gerarToken({ usuarioId: usuario.id, role: usuario.role, whatsapp: usuario.whatsapp });
  const cookieStore = await cookies();
  cookieStore.set({ ...COOKIE_CONFIG, value: token });

  const destinos: Record<string, string> = {
    ADMIN: "/admin",
    EDITOR: "/editor",
    OPERADOR: "/operador",
    TITULAR: "/titular",
    CLIENTE: "/minha-conta",
  };
  redirect(destinos[usuario.role] ?? "/minha-conta");
}

export async function registroAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registroSchema.safeParse({
    nome: formData.get("nome"),
    whatsapp: formData.get("whatsapp"),
    senha: formData.get("senha"),
    cpf: formData.get("cpf") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { nome, whatsapp, senha, cpf } = parsed.data;
  const existe = await prisma.usuario.findUnique({ where: { whatsapp } });
  if (existe) return { error: "Este WhatsApp já está cadastrado." };

  const senhaHash = await hashSenha(senha);
  const usuario = await prisma.usuario.create({
    data: { nome, whatsapp, senhaHash, cpf, role: "CLIENTE" },
  });

  const token = await gerarToken({ usuarioId: usuario.id, role: usuario.role, whatsapp: usuario.whatsapp });
  const cookieStore = await cookies();
  cookieStore.set({ ...COOKIE_CONFIG, value: token });

  redirect("/minha-conta");
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_CONFIG.name);
  redirect("/login");
}
