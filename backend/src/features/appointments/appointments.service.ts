import { withTransaction } from "../../config/db";
import { Errors } from "../../shared/app-error";
import { clinicNow, isPast } from "../../shared/time";
import type { AuthUser } from "../../shared/types/user";
import { dentistsService } from "../dentists/dentists.service";
import { appointmentsRepository, type AppointmentRow } from "./appointments.repository";
import type {
  AdminListQuery,
  AppointmentStatus,
  CreateAppointmentBody,
  MineQuery,
  ScheduleQuery,
  UpdateStatusBody,
} from "./appointments.schema";

// what a DENTIST may do; ADMIN may set any status
const DENTIST_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

function toDto(a: AppointmentRow, opts: { hideOpenNotes?: boolean } = {}) {
  return {
    id: a.id,
    status: a.status,
    date: a.appointment_date,
    startTime: a.start_time,
    endTime: a.end_time,
    patient: { userId: a.patient_user_id, name: a.patient_name, email: a.patient_email },
    dentist: {
      id: a.dentist_id,
      userId: a.dentist_user_id,
      name: a.dentist_name,
      specialty: a.dentist_specialty,
      room: a.dentist_room,
    },
    treatment: {
      id: a.treatment_id,
      name: a.treatment_name,
      price: Number(a.treatment_price),
      durationMinutes: a.treatment_duration,
    },
    patientNotes: a.patient_notes,
    // patients only see the clinical summary once the visit is completed
    dentistNotes: opts.hideOpenNotes && a.status !== "COMPLETED" ? null : a.dentist_notes,
    createdAt: a.created_at,
    updatedAt: a.updated_at,
  };
}

async function getOrThrow(id: string) {
  const a = await appointmentsRepository.findById(id);
  if (!a) throw Errors.notFound("Appointment not found");
  return a;
}

export const appointmentsService = {
  async create(user: AuthUser, body: CreateAppointmentBody) {
    // 1. the requested start time must be one of the currently available slots
    const available = await dentistsService.getAvailableSlots(body.dentistId, {
      date: body.date,
      treatmentId: body.treatmentId,
    });
    const slot = available.slots.find((s) => s.startTime === body.startTime);
    if (!slot) throw Errors.badRequest("The selected time is not available");

    // 2. re-check under a row lock so two simultaneous bookings cannot both win
    const id = await withTransaction(async (client) => {
      await client.query("SELECT id FROM dentist_profiles WHERE id = $1 FOR UPDATE", [body.dentistId]);

      if (await appointmentsRepository.hasOverlap(client, "dentist_id", body.dentistId, body.date, slot.startTime, slot.endTime)) {
        throw Errors.conflict("This time slot was just taken, please choose another");
      }
      if (await appointmentsRepository.hasOverlap(client, "patient_user_id", user.id, body.date, slot.startTime, slot.endTime)) {
        throw Errors.conflict("You already have an appointment at this time");
      }
      return appointmentsRepository.insert(client, {
        patientUserId: user.id,
        patientName: user.fullName,
        patientEmail: user.email,
        dentistId: body.dentistId,
        treatmentId: body.treatmentId,
        date: body.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        patientNotes: body.patientNotes,
      });
    });

    return toDto(await getOrThrow(id), { hideOpenNotes: true });
  },

  async listMine(user: AuthUser, q: MineQuery) {
    const rows = await appointmentsRepository.listForPatient(user.id, {
      scope: q.scope,
      status: q.status,
      today: clinicNow().date,
    });
    return rows.map((a) => toDto(a, { hideOpenNotes: true }));
  },

  async cancelMine(user: AuthUser, id: string) {
    const a = await getOrThrow(id);
    if (a.patient_user_id !== user.id) throw Errors.forbidden("This is not your appointment");
    if (a.status !== "PENDING" && a.status !== "CONFIRMED") {
      throw Errors.badRequest(`A ${a.status.toLowerCase()} appointment cannot be cancelled`);
    }
    if (isPast(a.appointment_date, a.start_time)) {
      throw Errors.badRequest("Past appointments cannot be cancelled");
    }
    await appointmentsRepository.updateStatusAndNotes(id, "CANCELLED");
    return toDto(await getOrThrow(id), { hideOpenNotes: true });
  },

  async schedule(user: AuthUser, q: ScheduleQuery) {
    const rows = await appointmentsRepository.listForDentistUser(user.id, {
      from: q.from ?? clinicNow().date,
      to: q.to,
      status: q.status,
    });
    return rows.map((a) => toDto(a));
  },

  async listAll(q: AdminListQuery) {
    const { rows, total } = await appointmentsRepository.listAdmin(q);
    return {
      items: rows.map((a) => toDto(a)),
      page: q.page,
      limit: q.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / q.limit)),
    };
  },

  /** DENTIST (own appointments only, restricted transitions) or ADMIN (any appointment, any status). */
  async updateStatus(user: AuthUser, id: string, body: UpdateStatusBody) {
    const a = await getOrThrow(id);

    if (user.role === "DENTIST") {
      if (a.dentist_user_id !== user.id) throw Errors.forbidden("This appointment is not assigned to you");
      if (body.status && body.status !== a.status && !DENTIST_TRANSITIONS[a.status].includes(body.status)) {
        throw Errors.badRequest(`Cannot change an appointment from ${a.status} to ${body.status}`);
      }
      if (body.dentistNotes !== undefined && (body.status ?? a.status) === "CANCELLED") {
        throw Errors.badRequest("Clinical notes cannot be added to a cancelled appointment");
      }
    }

    await appointmentsRepository.updateStatusAndNotes(id, body.status, body.dentistNotes);
    return toDto(await getOrThrow(id));
  },
};
