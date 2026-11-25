import { asyncHandler } from "../../shared/async-handler";
import { Errors } from "../../shared/app-error";
import { dentistsService } from "./dentists.service";
import type { ListDentistsQuery, SlotsQuery } from "./dentists.schema";

export const listDentists = asyncHandler(async (req, res) => {
  const items = await dentistsService.list(req.query as unknown as ListDentistsQuery, req.user?.role);
  res.json({ data: { items } });
});

export const getDentist = asyncHandler(async (req, res) => {
  res.json({ data: { dentist: await dentistsService.getById(req.params.id) } });
});

export const getMyProfile = asyncHandler(async (req, res) => {
  if (!req.user) throw Errors.unauthorized();
  res.json({ data: { dentist: await dentistsService.getByUserId(req.user.id) } });
});

export const getSlots = asyncHandler(async (req, res) => {
  res.json({ data: await dentistsService.getAvailableSlots(req.params.id, req.query as unknown as SlotsQuery) });
});

export const availableUsers = asyncHandler(async (req, res) => {
  res.json({ data: { items: await dentistsService.availableUsers(req.accessToken!) } });
});

export const createDentist = asyncHandler(async (req, res) => {
  res.status(201).json({ data: { dentist: await dentistsService.create(req.accessToken!, req.body) } });
});

export const updateDentist = asyncHandler(async (req, res) => {
  res.json({ data: { dentist: await dentistsService.update(req.params.id, req.body) } });
});
