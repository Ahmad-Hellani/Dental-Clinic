import { Errors } from "../../shared/app-error";
import type { Role } from "../../shared/types/user";
import { treatmentsRepository, type TreatmentRow } from "./treatments.repository";
import type { CreateTreatmentBody, ListTreatmentsQuery, UpdateTreatmentBody } from "./treatments.schema";

export const toTreatmentDto = (t: TreatmentRow) => ({
  id: t.id,
  name: t.name,
  description: t.description,
  durationMinutes: t.duration_minutes,
  price: Number(t.price),
  category: t.category,
  isActive: t.is_active,
});

export const treatmentsService = {
  async list(q: ListTreatmentsQuery, role?: Role) {
    const rows = await treatmentsRepository.list({
      search: q.search,
      category: q.category,
      includeInactive: q.includeInactive && role === "ADMIN",
    });
    return rows.map(toTreatmentDto);
  },

  categories: () => treatmentsRepository.categories(),

  async getById(id: string) {
    const t = await treatmentsRepository.findById(id);
    if (!t) throw Errors.notFound("Treatment not found");
    return toTreatmentDto(t);
  },

  async create(body: CreateTreatmentBody) {
    return toTreatmentDto(await treatmentsRepository.create(body));
  },

  async update(id: string, body: UpdateTreatmentBody) {
    const t = await treatmentsRepository.update(id, body);
    if (!t) throw Errors.notFound("Treatment not found");
    return toTreatmentDto(t);
  },
};
