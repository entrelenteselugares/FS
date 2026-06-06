import { Router } from "express";
import { 
  getMatches, 
  getMatchFolha, 
  fillSlot, 
  getBadges, 
  getLiveScoreboard, 
  getTournamentBracket,
  getLeaderboard,
  toggleLikeSlot,
  addCommentToSlot
} from "../controllers/worldcup.controller";
import { requireAuth } from "../lib/auth";

const router = Router();

// Public routes — no auth needed (banner shows for everyone)
router.get("/live", getLiveScoreboard);
router.get("/bracket", getTournamentBracket);

// Protected routes
router.use(requireAuth);

router.get("/matches", getMatches);
router.get("/leaderboard", getLeaderboard);
router.get("/album/:matchId", getMatchFolha);
router.post("/album/:matchId/slot", fillSlot);
router.post("/album/:matchId/slot/:slotIndex/like", toggleLikeSlot);
router.post("/album/:matchId/slot/:slotIndex/comment", addCommentToSlot);
router.get("/badges", getBadges);

export default router;

