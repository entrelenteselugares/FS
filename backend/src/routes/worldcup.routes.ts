import { Router } from "express";
import { getMatches, getMatchFolha, fillSlot, getBadges, getLiveScoreboard, getTournamentBracket } from "../controllers/worldcup.controller";
import { requireAuth } from "../lib/auth";

const router = Router();

// Public routes — no auth needed (banner shows for everyone)
router.get("/live", getLiveScoreboard);
router.get("/bracket", getTournamentBracket);

// Protected routes
router.use(requireAuth);

router.get("/matches", getMatches);
router.get("/album/:matchId", getMatchFolha);
router.post("/album/:matchId/slot", fillSlot);
router.get("/badges", getBadges);

export default router;
