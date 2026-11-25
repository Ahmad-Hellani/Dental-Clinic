import { Router } from "express";
import { authenticate, requireRole } from "../../shared/middleware/auth.middleware";
import { overview } from "./stats.controller";

const router = Router();

router.get("/", authenticate, requireRole("ADMIN"), overview);

export default router;
