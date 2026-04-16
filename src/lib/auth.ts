import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET!;
export const COOKIE_NAME = "fs_token";

export interface JWTPayload {
  usuarioId: string;
  role: string;
  whatsapp: string;
}

export async function hashSenha(senha: string) {
  return bcrypt.hash(senha, 12);
}

export async function verificarSenha(senha: string, hash: string) {
  return bcrypt.compare(senha, hash);
}

export function gerarToken(payload: JWTPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verificarToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verificarToken(token);
}

export async function getUsuarioLogado() {
  const session = await getSession();
  if (!session) return null;
  return prisma.usuario.findUnique({
    where: { id: session.usuarioId },
    select: {
      id: true,
      nome: true,
      email: true,
      whatsapp: true,
      role: true,
      saldoComissao: true,
      avatarUrl: true,
    },
  });
}

export const COOKIE_CONFIG = {
  name: COOKIE_NAME,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7,
  path: "/",
};
