import { Router } from "express";
import { 
  getMatches, 
  getMatchFolha, 
  fillSlot, 
  getBadges, 
  getLiveScoreboard, 
  getTournamentBracket,
  getScores,
  getLeaderboard,
  toggleLikeSlot,
  addCommentToSlot,
  getMissionsData,
  submitQuizAnswer,
  uploadMissionPhoto,
  getPendingCommunityValidations,
  validateMissionPhoto,
  getBets,
  placeBet,
  settleBets,
  getUserBetSummary,
  getNostalgia,
  setLiveScore
} from "../controllers/worldcup.controller";
import { requireAuth } from "../lib/auth";
import { requireRole } from "../lib/auth";

const router = Router();

// Public routes — no auth needed (banner shows for everyone)
router.get("/live", getLiveScoreboard);
router.get("/bracket", getTournamentBracket);
router.get("/scores", getScores);

// Protected routes
router.use(requireAuth);

router.get("/matches", getMatches);
router.get("/leaderboard", getLeaderboard);
router.get("/album/:matchId", getMatchFolha);
router.post("/album/:matchId/slot", fillSlot);
router.post("/album/:matchId/slot/:slotIndex/like", toggleLikeSlot);
router.post("/album/:matchId/slot/:slotIndex/comment", addCommentToSlot);
router.get("/badges", getBadges);

// Gamification: Missions and Quizzes
router.get("/missions", getMissionsData);
router.post("/missions/quiz", submitQuizAnswer);
router.post("/missions/upload", uploadMissionPhoto);
router.get("/community/pending", getPendingCommunityValidations);
router.post("/community/validate/:slotId", validateMissionPhoto);

// Gamification: Betting
router.get("/bets/summary", getUserBetSummary);
router.get("/bets", getBets);
router.post("/bets", placeBet);
router.post("/bets/settle", requireRole("ADMIN"), settleBets);

// Nostalgia Mock
router.get("/nostalgia", getNostalgia);

// Admin: manual score override (for when SPORTS_API_KEY is not configured)
router.post("/admin/score", requireRole("ADMIN"), setLiveScore);


export default router;
