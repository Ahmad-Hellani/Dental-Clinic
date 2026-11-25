import { http } from "./http";
import type { DayCode, Dentist, DentistUser, SlotsResponse } from "../lib/types";

export type DentistInput = {
  fullName?: string;
  specialty: string;
  bio: string;
  roomNumber: string;
  workingDays: DayCode[];
  startTime: string;
  endTime: string;
};

export async function listDentists(includeInactive = false): Promise<Dentist[]> {
  const res = await http.get<{ data: { items: Dentist[] } }>("/dentists", {
    params: includeInactive ? { includeInactive: true } : undefined,
  });
  return res.data.data.items;
}

export async function myDentistProfile(): Promise<Dentist> {
  const res = await http.get<{ data: { dentist: Dentist } }>("/dentists/me");
  return res.data.data.dentist;
}

export async function getSlots(dentistId: string, date: string, treatmentId: string): Promise<SlotsResponse> {
  const res = await http.get<{ data: SlotsResponse }>(`/dentists/${dentistId}/slots`, { params: { date, treatmentId } });
  return res.data.data;
}

export async function availableDentistUsers(): Promise<DentistUser[]> {
  const res = await http.get<{ data: { items: DentistUser[] } }>("/dentists/available-users");
  return res.data.data.items;
}

export async function createDentist(input: DentistInput & { userId: string }): Promise<Dentist> {
  const res = await http.post<{ data: { dentist: Dentist } }>("/dentists", input);
  return res.data.data.dentist;
}

export async function updateDentist(id: string, patch: Partial<DentistInput> & { isActive?: boolean }): Promise<Dentist> {
  const res = await http.patch<{ data: { dentist: Dentist } }>(`/dentists/${id}`, patch);
  return res.data.data.dentist;
}
