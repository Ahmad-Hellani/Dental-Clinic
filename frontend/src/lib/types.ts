export type Role = "PATIENT" | "DENTIST" | "ADMIN";
export type AppointmentStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
export type DayCode = "SUN" | "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT";

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface AuthSession {
  accessToken: string;
  user: User;
}

export interface Treatment {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  category: string;
  isActive: boolean;
}

export interface Dentist {
  id: string;
  userId: string;
  fullName: string;
  specialty: string;
  bio: string;
  roomNumber: string;
  workingDays: DayCode[];
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface Slot {
  startTime: string;
  endTime: string;
}

export interface SlotsResponse {
  dentistId: string;
  treatmentId: string;
  date: string;
  durationMinutes: number;
  slots: Slot[];
}

export interface Appointment {
  id: string;
  status: AppointmentStatus;
  date: string;
  startTime: string;
  endTime: string;
  patient: { userId: string; name: string; email: string };
  dentist: { id: string; userId: string; name: string; specialty: string; room: string };
  treatment: { id: string; name: string; price: number; durationMinutes: number };
  patientNotes: string | null;
  dentistNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Stats {
  totalAppointments: number;
  pendingApprovals: number;
  confirmed: number;
  completedVisits: number;
  cancelled: number;
  todaysAppointments: number;
  revenueCompleted: number;
  estimatedRevenue: number;
  activeDentists: number;
  activeTreatments: number;
}

export interface DentistUser {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
}
