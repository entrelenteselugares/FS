import { Router, Response, NextFunction } from "express";
import { requireAuth } from "../lib/auth";
import { prisma } from "../lib/prisma";
import {
  updateEventLinks,
  uploadEventCover,
  respondToEvent,
  getProfile,
  updateProfile,
  registerManualSale,
  getConvitesUnidade,
  respondConviteUnidade,
  getNetwork,
  searchProfessionals,
  toggleFavorite,
  getNetworkUserServices,
  listProServices,
  addProService,
  updateProService,
  deleteProService,
  addTeamMember,
  removeTeamMember
} from "../controllers/profissional.controller";
import * as ReportController from "../controllers/report.controller";
import { EventController } from "../controllers/event.controller";

const router = Router();

/**
 * Middleware especial que permite acesso se o usuário for ADMIN, PROFISSIONAL 
 * OU se possuir um FranchiseProfile ativo (mesmo sendo CLIENTE).
 */
const requireProOrFranchise = async (req: any, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: "Não autenticado." });
  if (
    user.role === "ADMIN" ||
    user.role === "PROFISSIONAL" ||
    user.role === "CARTORIO" ||
    user.role === "FRANCHISEE"
  ) return next();

  try {
    const profile = await prisma.franchiseProfile.findUnique({ 
      where: { userId: user.userId } 
    });
    if (profile && profile.active) return next();
  } catch (err) {
    console.error("[requireProOrFranchise] Erro ao verificar perfil de franquia:", err);
  }
  
  return res.status(403).json({ error: "Acesso negado. Requer perfil profissional ou franquia ativa." });
};

// ── PROFISSIONAIS (Rede Técnica)
router.patch("/events/:id/links", requireAuth, requireProOrFranchise, updateEventLinks);
router.patch("/events/:id/cover", requireAuth, requireProOrFranchise, uploadEventCover);
router.patch("/events/:id/respond", requireAuth, requireProOrFranchise, respondToEvent);
router.get("/me", requireAuth, requireProOrFranchise, getProfile);
router.patch("/me", requireAuth, requireProOrFranchise, updateProfile);
router.post("/events/:id/manual-sale", requireAuth, requireProOrFranchise, registerManualSale);
router.get("/unidades/convites", requireAuth, requireProOrFranchise, getConvitesUnidade);
router.patch("/unidades/convites/:id/respond", requireAuth, requireProOrFranchise, respondConviteUnidade);
router.get("/network", requireAuth, requireProOrFranchise, getNetwork);
router.get("/network/search", requireAuth, requireProOrFranchise, searchProfessionals);
router.get("/network/:id/services", requireAuth, requireProOrFranchise, getNetworkUserServices);
router.post("/network/favorite/:partnerId", requireAuth, requireProOrFranchise, toggleFavorite);

// ── Relatórios & Inteligência Financeira
router.get("/finance/tax-report", requireAuth, requireProOrFranchise, ReportController.getTaxReport);
router.get("/finance/receipt/:id", requireAuth, requireProOrFranchise, ReportController.getPayoutReceipt);
router.get("/finance/cashflow", requireAuth, requireProOrFranchise, ReportController.getCashflowProjection);

// ── Eventos do Profissional
router.get("/events", requireAuth, requireProOrFranchise, EventController.listByProfessional);
router.get("/events/:slug", requireAuth, requireProOrFranchise, EventController.getById);
router.post("/flash-event", requireAuth, requireProOrFranchise, EventController.createFlashEvent);
router.post("/foto-point", requireAuth, requireProOrFranchise, EventController.createFotoPoint);
router.patch("/events/:id/foto-point", requireAuth, requireProOrFranchise, EventController.updateFotoPoint);
router.post("/events/:id/team", requireAuth, requireProOrFranchise, addTeamMember);
router.delete("/events/:id/team/:memberId", requireAuth, requireProOrFranchise, removeTeamMember);

// ── Gestão de Serviços (Vitrine do Profissional)
router.get("/services", requireAuth, requireProOrFranchise, listProServices);
router.post("/services", requireAuth, requireProOrFranchise, addProService);
router.patch("/services/:id", requireAuth, requireProOrFranchise, updateProService);
router.delete("/services/:id", requireAuth, requireProOrFranchise, deleteProService);

export { router as professionalRoutes, requireProOrFranchise };
