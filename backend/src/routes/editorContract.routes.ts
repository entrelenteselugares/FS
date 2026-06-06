import { Router } from "express";
import { EditorContractController } from "../controllers/editorContract.controller";
import { requireAuth } from "../lib/auth";

const router = Router();

// Todas as rotas requerem autenticação
router.use(requireAuth);

// Contratação (Owner)
router.post("/", requireAuth, EditorContractController.create);
router.patch("/:id/revision", requireAuth, EditorContractController.requestRevision);

// Gerenciamento (Editor)
router.get("/editor", requireAuth, EditorContractController.getMyContractsAsEditor);
router.patch("/:id/accept", requireAuth, EditorContractController.acceptContract);
router.patch("/:id/reject", requireAuth, EditorContractController.rejectContract);
router.patch("/:id/deliver", requireAuth, EditorContractController.deliverContract);

export default router;
