import { http } from "./http";
import type { Treatment } from "../lib/types";

export type TreatmentInput = {
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  category: string;
};

export async function listTreatments(includeInactive = false): Promise<Treatment[]> {
  const res = await http.get<{ data: { items: Treatment[] } }>("/treatments", {
    params: includeInactive ? { includeInactive: true } : undefined,
  });
  return res.data.data.items;
}

export async function createTreatment(input: TreatmentInput): Promise<Treatment> {
  const res = await http.post<{ data: { treatment: Treatment } }>("/treatments", input);
  return res.data.data.treatment;
}

export async function updateTreatment(id: string, patch: Partial<TreatmentInput> & { isActive?: boolean }): Promise<Treatment> {
  const res = await http.patch<{ data: { treatment: Treatment } }>(`/treatments/${id}`, patch);
  return res.data.data.treatment;
}
