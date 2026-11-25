import { AppError, Errors } from "../../shared/app-error";
import { listDentistUsers } from "../../shared/auth-client";
import { clinicNow } from "../../shared/time";
import type { Role } from "../../shared/types/user";
import { appointmentsRepository } from "../appointments/appointments.repository";
import { treatmentsRepository } from "../treatments/treatments.repository";
import { dentistsRepository, type DentistRow } from "./dentists.repository";
import type { CreateDentistBody, ListDentistsQuery, SlotsQuery, UpdateDentistBody } from "./dentists.schema";
import { computeSlots } from "./slots";

export const toDentistDto = (d: DentistRow) => ({
  id: d.id,
  userId: d.user_id,
  fullName: d.full_name,
  specialty: d.specialty,
  bio: d.bio,
  roomNumber: d.room_number,
  workingDays: d.working_days,
  startTime: d.start_time,
  endTime: d.end_time,
  isActive: d.is_active,
});

export const dentistsService = {
  async list(q: ListDentistsQuery, role?: Role) {
    const rows = await dentistsRepository.list(q.includeInactive && role === "ADMIN");
    return rows.map(toDentistDto);
  },

  async getById(id: string) {
    const d = await dentistsRepository.findById(id);
    if (!d) throw Errors.notFound("Dentist not found");
    return toDentistDto(d);
  },

  async getByUserId(userId: string) {
    const d = await dentistsRepository.findByUserId(userId);
    if (!d) throw Errors.notFound("No dentist profile is linked to this account yet");
    return toDentistDto(d);
  },

  /** Available slots for a dentist/date/treatment (also used to validate a booking). */
  async getAvailableSlots(dentistId: string, q: SlotsQuery) {
    const dentist = await dentistsRepository.findById(dentistId);
    if (!dentist || !dentist.is_active) throw Errors.notFound("Dentist not found");
    const treatment = await treatmentsRepository.findById(q.treatmentId);
    if (!treatment || !treatment.is_active) throw Errors.notFound("Treatment not found");

    const booked = await appointmentsRepository.listBooked(dentistId, q.date);
    const slots = computeSlots({
      date: q.date,
      workingDays: dentist.working_days,
      startTime: dentist.start_time,
      endTime: dentist.end_time,
      durationMinutes: treatment.duration_minutes,
      booked,
      now: clinicNow(),
    });
    return {
      dentistId,
      treatmentId: q.treatmentId,
      date: q.date,
      durationMinutes: treatment.duration_minutes,
      slots,
    };
  },

  /** ADMIN: dentist accounts that exist in the auth service but have no clinic profile yet. */
  async availableUsers(adminToken: string) {
    const [users, taken] = await Promise.all([listDentistUsers(adminToken), dentistsRepository.allUserIds()]);
    return users.filter((u) => !taken.has(u.id));
  },

  async create(adminToken: string, body: CreateDentistBody) {
    // the user must really be an active DENTIST in the authentication service
    const users = await listDentistUsers(adminToken);
    const account = users.find((u) => u.id === body.userId);
    if (!account) {
      throw Errors.badRequest("userId is not an active DENTIST account in the authentication service");
    }
    const created = await dentistsRepository.create({
      ...body,
      fullName: body.fullName ?? account.fullName,
    });
    return toDentistDto(created);
  },

  async update(id: string, body: UpdateDentistBody) {
    const current = await dentistsRepository.findById(id);
    if (!current) throw Errors.notFound("Dentist not found");

    const start = body.startTime ?? current.start_time;
    const end = body.endTime ?? current.end_time;
    if (start >= end) throw new AppError(400, "VALIDATION_ERROR", "startTime must be before endTime");

    const updated = await dentistsRepository.update(id, body);
    return toDentistDto(updated!);
  },
};
