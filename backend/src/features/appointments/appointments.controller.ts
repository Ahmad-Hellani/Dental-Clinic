import { asyncHandler } from "../../shared/async-handler";
import { Errors } from "../../shared/app-error";
import { appointmentsService } from "./appointments.service";
import type { AdminListQuery, MineQuery, ScheduleQuery } from "./appointments.schema";

export const createAppointment = asyncHandler(async (req, res) => {
  if (!req.user) throw Errors.unauthorized();
  res.status(201).json({ data: { appointment: await appointmentsService.create(req.user, req.body) } });
});

export const listMine = asyncHandler(async (req, res) => {
  if (!req.user) throw Errors.unauthorized();
  const items = await appointmentsService.listMine(req.user, req.query as unknown as MineQuery);
  res.json({ data: { items } });
});

export const cancelMine = asyncHandler(async (req, res) => {
  if (!req.user) throw Errors.unauthorized();
  res.json({ data: { appointment: await appointmentsService.cancelMine(req.user, req.params.id) } });
});

export const schedule = asyncHandler(async (req, res) => {
  if (!req.user) throw Errors.unauthorized();
  const items = await appointmentsService.schedule(req.user, req.query as unknown as ScheduleQuery);
  res.json({ data: { items } });
});

export const listAll = asyncHandler(async (req, res) => {
  res.json({ data: await appointmentsService.listAll(req.query as unknown as AdminListQuery) });
});

export const updateStatus = asyncHandler(async (req, res) => {
  if (!req.user) throw Errors.unauthorized();
  res.json({ data: { appointment: await appointmentsService.updateStatus(req.user, req.params.id, req.body) } });
});
