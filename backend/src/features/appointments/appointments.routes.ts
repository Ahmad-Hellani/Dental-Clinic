import { Router } from "express";
import { authenticate, requireRole } from "../../shared/middleware/auth.middleware";
import { validate } from "../../shared/middleware/validate.middleware";
import { idParams } from "../../shared/validation";
import {
  adminListQuery,
  createAppointmentBody,
  mineQuery,
  scheduleQuery,
  updateStatusBody,
} from "./appointments.schema";
import { cancelMine, createAppointment, listAll, listMine, schedule, updateStatus } from "./appointments.controller";

const router = Router();

router.use(authenticate);

// PATIENT
router.post("/", requireRole("PATIENT"), validate({ body: createAppointmentBody }), createAppointment);
router.get("/mine", requireRole("PATIENT"), validate({ query: mineQuery }), listMine);
router.patch("/:id/cancel", requireRole("PATIENT"), validate({ params: idParams }), cancelMine);

// DENTIST
router.get("/schedule", requireRole("DENTIST"), validate({ query: scheduleQuery }), schedule);

// ADMIN master table
router.get("/", requireRole("ADMIN"), validate({ query: adminListQuery }), listAll);

// DENTIST (own) + ADMIN (any)
router.patch(
  "/:id/status",
  requireRole("DENTIST", "ADMIN"),
  validate({ params: idParams, body: updateStatusBody }),
  updateStatus,
);

export default router;
