import { z } from "zod";

export const loginSchema = z.object({
  whatsapp: z.string().min(10).transform((v) => v.replace(/\D/g, "")),
  senha: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
});

export const registroSchema = z.object({
  nome: z.string().min(2, "Nome muito curto"),
  whatsapp: z.string().min(10).transform((v) => v.replace(/\D/g, "")),
  senha: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
  cpf: z.string().optional(),
});
