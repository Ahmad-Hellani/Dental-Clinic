import { Router } from "express";
import { authenticate, optionalAuth, requireRole } from "../../shared/middleware/auth.middleware";
import { validate } from "../../shared/middleware/validate.middleware";
import { idParams } from "../../shared/validation";
import { createTreatmentBody, listTreatmentsQuery, updateTreatmentBody } from "./treatments.schema";
import {
  createTreatment,
  getTreatment,
  listCategories,
  listTreatments,
  updateTreatment,
} from "./treatments.controller";

const router = Router();

// public catalog
router.get("/", optionalAuth, validate({ query: listTreatmentsQuery }), listTreatments);
router.get("/categories", listCategories);
router.get("/:id", validate({ params: idParams }), getTreatment);

// admin management (deactivate = PATCH { isActive: false })
router.post("/", authenticate, requireRole("ADMIN"), validate({ body: createTreatmentBody }), createTreatment);
router.patch(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  validate({ params: idParams, body: updateTreatmentBody }),
  updateTreatment,
);

export default router;
