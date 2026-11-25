import { asyncHandler } from "../../shared/async-handler";
import { treatmentsService } from "./treatments.service";
import type { ListTreatmentsQuery } from "./treatments.schema";

export const listTreatments = asyncHandler(async (req, res) => {
  const items = await treatmentsService.list(req.query as unknown as ListTreatmentsQuery, req.user?.role);
  res.json({ data: { items } });
});

export const listCategories = asyncHandler(async (_req, res) => {
  res.json({ data: { items: await treatmentsService.categories() } });
});

export const getTreatment = asyncHandler(async (req, res) => {
  res.json({ data: { treatment: await treatmentsService.getById(req.params.id) } });
});

export const createTreatment = asyncHandler(async (req, res) => {
  res.status(201).json({ data: { treatment: await treatmentsService.create(req.body) } });
});

export const updateTreatment = asyncHandler(async (req, res) => {
  res.json({ data: { treatment: await treatmentsService.update(req.params.id, req.body) } });
});
