import { Response } from "express";
import { AuthRequest } from "../lib/auth";
import prisma from "../lib/prisma";

/**
 * GET /api/unidade-fixa/team
 * Retorna todos os profissionais disponíveis + status de vínculo com esta unidade.
 */
export async function getTeam(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ error: "Não autorizado" }); return; }

  try {
    let cartorio = await prisma.cartorio.findUnique({
      where: { userId },
      include: {
        profissionais: {
          include: {
            profissional: {
              include: { user: { select: { id: true, nome: true, email: true, whatsapp: true, profileImageUrl: true } } }
            }
          }
        }
      }
    });

    if (!cartorio) {
      if (req.user?.role === "PROFISSIONAL" || req.user?.role === "FRANCHISEE") {
        // Create stub cartorio for professional so they can manage a network
        cartorio = await prisma.cartorio.create({
          data: {
            userId,
            razaoSocial: `Rede de ${req.user.nome || "Profissional"}`
          },
          include: {
            profissionais: {
              include: {
                profissional: {
                  include: { user: { select: { id: true, nome: true, email: true, whatsapp: true, profileImageUrl: true } } }
                }
              }
            }
          }
        });
      } else {
        res.status(404).json({ error: "Perfil de unidade não encontrado.", code: "UNIDADE_NOT_FOUND" });
        return;
      }
    }

    // Todos profissionais cadastrados na plataforma (Filtrando por Role)
    const allProfissionais = await prisma.profissional.findMany({
      where: {
        user: {
          role: {
            in: ["PROFISSIONAL", "FRANCHISEE"]
          }
        }
      },
      include: {
        user: { select: { id: true, nome: true, email: true, whatsapp: true, profileImageUrl: true } }
      },
      orderBy: { user: { nome: "asc" } }
    });

    // Montar mapa de vínculos existentes
    const vinculoMap = new Map(
      cartorio.profissionais.map(v => [v.profissionalId, { tipo: v.tipo, status: v.status }])
    );

    const result = allProfissionais.map(p => ({
      id: p.id,
      userId: p.userId,
      nome: p.user.nome,
      email: p.user.email,
      whatsapp: p.user.whatsapp,
      profileImageUrl: p.user.profileImageUrl,
      services: p.services,
      cameras: p.cameras,
      // "FIXO" | "ROTATIVO" | null (sem vínculo = rotativo geral)
      vinculo: vinculoMap.get(p.id)?.tipo ?? null,
      status: vinculoMap.get(p.id)?.status ?? null,
    }));

    res.json({ cartorioId: cartorio.id, profissionais: result });
  } catch (err) {
    console.error("getTeam:", err);
    res.status(500).json({ error: "Erro ao buscar equipe." });
  }
}

/**
 * PUT /api/unidade-fixa/team
 * Salva a configuração de equipe (upsert).
 * Body: { assignments: [{ profissionalId: string, tipo: "FIXO" | "ROTATIVO" | null }] }
 * Se tipo === null, remove o vínculo.
 */
export async function saveTeam(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ error: "Não autorizado" }); return; }

  const { assignments } = req.body as {
    assignments: Array<{ profissionalId: string; tipo: "FIXO" | "ROTATIVO" | null }>
  };

  if (!Array.isArray(assignments)) {
    res.status(400).json({ error: "assignments deve ser um array." });
    return;
  }

  try {
    let cartorio = await prisma.cartorio.findUnique({ where: { userId } });
    if (!cartorio) {
      if (req.user?.role === "PROFISSIONAL" || req.user?.role === "FRANCHISEE") {
        cartorio = await prisma.cartorio.create({
          data: {
            userId,
            razaoSocial: `Rede de ${req.user.nome || "Profissional"}`
          }
        });
      } else {
        res.status(404).json({ error: "Perfil de unidade não encontrado.", code: "UNIDADE_NOT_FOUND" });
        return;
      }
    }

    // Processar cada assignment
    await Promise.all(assignments.map(async ({ profissionalId, tipo }) => {
      if (tipo === null) {
        // Remove vínculo
        await prisma.cartorioProfissional.deleteMany({
          where: { cartorioId: cartorio.id, profissionalId }
        });
      } else {
        // Upsert vínculo
        await prisma.cartorioProfissional.upsert({
          where: { cartorioId_profissionalId: { cartorioId: cartorio.id, profissionalId } },
          create: { 
            cartorioId: cartorio.id, 
            profissionalId, 
            tipo,
            status: "PENDING" // Sempre começa como pendente
          },
          update: { 
            tipo,
            // Se estava rejeitado, volta para pendente ao ser reatribuído
            status: {
              set: "PENDING"
            }
          }
        });
      }
    }));

    res.json({ ok: true });
  } catch (err) {
    console.error("saveTeam:", err);
    res.status(500).json({ error: "Erro ao salvar configuração de equipe." });
  }
}
