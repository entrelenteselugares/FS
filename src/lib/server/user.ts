"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

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
