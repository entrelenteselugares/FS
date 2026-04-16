import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
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
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verificarToken(token);
}

export const COOKIE_CONFIG = {
  name: COOKIE_NAME,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7,
  path: "/",
};
