import { http } from "./http";
import type { Appointment, AppointmentStatus, Paginated } from "../lib/types";

export type BookingInput = {
  treatmentId: string;
  dentistId: string;
  date: string;
  startTime: string;
  patientNotes?: string;
};

export type AdminFilters = {
  status?: AppointmentStatus | "";
  date?: string;
  dentistId?: string;
  search?: string;
  page?: number;
  limit?: number;
};

const clean = <T extends object>(obj: T) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== "" && v !== undefined));

export async function bookAppointment(input: BookingInput): Promise<Appointment> {
  const res = await http.post<{ data: { appointment: Appointment } }>("/appointments", input);
  return res.data.data.appointment;
}

export async function myAppointments(scope: "upcoming" | "past" | "all" = "all"): Promise<Appointment[]> {
  const res = await http.get<{ data: { items: Appointment[] } }>("/appointments/mine", { params: { scope } });
  return res.data.data.items;
}

export async function cancelAppointment(id: string): Promise<Appointment> {
  const res = await http.patch<{ data: { appointment: Appointment } }>(`/appointments/${id}/cancel`);
  return res.data.data.appointment;
}

export async function dentistSchedule(): Promise<Appointment[]> {
  const res = await http.get<{ data: { items: Appointment[] } }>("/appointments/schedule");
  return res.data.data.items;
}

export async function adminAppointments(filters: AdminFilters): Promise<Paginated<Appointment>> {
  const res = await http.get<{ data: Paginated<Appointment> }>("/appointments", { params: clean(filters) });
  return res.data.data;
}

export async function setAppointmentStatus(
  id: string,
  body: { status?: AppointmentStatus; dentistNotes?: string },
): Promise<Appointment> {
  const res = await http.patch<{ data: { appointment: Appointment } }>(`/appointments/${id}/status`, body);
  return res.data.data.appointment;
}
