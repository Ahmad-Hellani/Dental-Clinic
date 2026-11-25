import { Router } from "express";
import { authenticate, optionalAuth, requireRole } from "../../shared/middleware/auth.middleware";
import { validate } from "../../shared/middleware/validate.middleware";
import { idParams } from "../../shared/validation";
import { createDentistBody, listDentistsQuery, slotsQuery, updateDentistBody } from "./dentists.schema";
import {
  availableUsers,
  createDentist,
  getDentist,
  getMyProfile,
  getSlots,
  listDentists,
  updateDentist,
} from "./dentists.controller";

const router = Router();

// fixed paths first, so they are not captured by /:id
router.get("/available-users", authenticate, requireRole("ADMIN"), availableUsers);
router.get("/me", authenticate, requireRole("DENTIST"), getMyProfile);

// public catalog
router.get("/", optionalAuth, validate({ query: listDentistsQuery }), listDentists);
router.get("/:id", validate({ params: idParams }), getDentist);
router.get("/:id/slots", validate({ params: idParams, query: slotsQuery }), getSlots);

// admin management
router.post("/", authenticate, requireRole("ADMIN"), validate({ body: createDentistBody }), createDentist);
router.patch(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  validate({ params: idParams, body: updateDentistBody }),
  updateDentist,
);

export default router;
