import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { verificarToken, COOKIE_NAME, type JWTPayload } from "./jwt";

export * from "./jwt";

export async function hashSenha(senha: string) {
  return bcrypt.hash(senha, 12);
}

export async function verificarSenha(senha: string, hash: string) {
  return bcrypt.compare(senha, hash);
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = (await cookieStore).get(COOKIE_NAME)?.value;
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
