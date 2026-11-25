import { pool } from "./db";
import { addDays, clinicNow, dayCodeOf, type DayCode } from "../shared/time";

/**
 * Must match the fixed UUIDs seeded by the authentication service
 * (authentication/src/config/seed.ts). They are plain scalar references, no cross-DB foreign keys.
 */
const AUTH_USER = {
  DR_SARA: "00000000-0000-4000-8000-000000000002",
  DR_KARIM: "00000000-0000-4000-8000-000000000003",
  PATIENT: "00000000-0000-4000-8000-000000000004",
} as const;

const DENTIST_ID = {
  SARA: "00000000-0000-4000-8000-000000000101",
  KARIM: "00000000-0000-4000-8000-000000000102",
} as const;

const T = {
  CHECKUP: "00000000-0000-4000-8000-000000000201",
  FILLING: "00000000-0000-4000-8000-000000000202",
  ROOT_CANAL: "00000000-0000-4000-8000-000000000203",
  WHITENING: "00000000-0000-4000-8000-000000000204",
  BRACES: "00000000-0000-4000-8000-000000000205",
  EXTRACTION: "00000000-0000-4000-8000-000000000206",
  CROWN: "00000000-0000-4000-8000-000000000207",
  EMERGENCY: "00000000-0000-4000-8000-000000000208",
} as const;

const SARA_DAYS: DayCode[] = ["MON", "TUE", "WED", "THU", "FRI"];
const KARIM_DAYS: DayCode[] = ["TUE", "WED", "THU", "FRI", "SAT"];

const DENTISTS = [
  {
    id: DENTIST_ID.SARA, userId: AUTH_USER.DR_SARA, fullName: "Dr. Sara Haddad", specialty: "Orthodontics",
    bio: "Orthodontist with 10+ years of experience in braces, clear aligners and smile design for children and adults.",
    room: "Room 101", days: SARA_DAYS, start: "09:00", end: "17:00",
  },
  {
    id: DENTIST_ID.KARIM, userId: AUTH_USER.DR_KARIM, fullName: "Dr. Karim Nasser", specialty: "General & Cosmetic Dentistry",
    bio: "General dentist focused on preventive care, restorations and cosmetic treatments such as whitening and veneers.",
    room: "Room 102", days: KARIM_DAYS, start: "10:00", end: "18:00",
  },
];

const TREATMENTS = [
  { id: T.CHECKUP, name: "Routine Checkup & Cleaning", description: "Full oral exam, professional scaling and polishing, and personalised hygiene advice.", minutes: 30, price: 60, category: "Preventive" },
  { id: T.FILLING, name: "Dental Filling", description: "Tooth-coloured composite filling to repair cavities and restore the tooth's shape.", minutes: 45, price: 120, category: "Restorative" },
  { id: T.ROOT_CANAL, name: "Root Canal Treatment", description: "Removal of infected pulp, canal cleaning and sealing to save a damaged tooth.", minutes: 60, price: 450, category: "Endodontics" },
  { id: T.WHITENING, name: "Teeth Whitening", description: "In-clinic professional whitening for a brighter smile in a single session.", minutes: 60, price: 250, category: "Cosmetic" },
  { id: T.BRACES, name: "Braces Consultation", description: "Orthodontic assessment, X-ray review and a personalised treatment plan.", minutes: 30, price: 40, category: "Orthodontics" },
  { id: T.EXTRACTION, name: "Tooth Extraction", description: "Safe removal of a damaged or impacted tooth under local anaesthesia.", minutes: 45, price: 150, category: "Oral Surgery" },
  { id: T.CROWN, name: "Dental Crown", description: "Custom-made crown to protect and restore a weakened tooth.", minutes: 60, price: 600, category: "Restorative" },
  { id: T.EMERGENCY, name: "Emergency Dental Visit", description: "Urgent assessment and pain relief for toothache, swelling or trauma.", minutes: 30, price: 90, category: "Emergency" },
];

/** closest working day to `from`, searching in direction `step` */
function workingDay(days: DayCode[], from: string, step: 1 | -1): string {
  let d = from;
  for (let i = 0; i < 14; i++) {
    if (days.includes(dayCodeOf(d))) return d;
    d = addDays(d, step);
  }
  return from;
}

/** Idempotent: safe to run on every startup. */
export async function seedDemoData(): Promise<void> {
  for (const d of DENTISTS) {
    await pool.query(
      `INSERT INTO dentist_profiles (id, user_id, full_name, specialty, bio, room_number, working_days, start_time, end_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)
       ON CONFLICT DO NOTHING`,
      [d.id, d.userId, d.fullName, d.specialty, d.bio, d.room, JSON.stringify(d.days), d.start, d.end],
    );
  }

  for (const t of TREATMENTS) {
    await pool.query(
      `INSERT INTO treatments (id, name, description, duration_minutes, price, category)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT DO NOTHING`,
      [t.id, t.name, t.description, t.minutes, t.price, t.category],
    );
  }

  // demo appointments for the demo patient, only on a brand-new database
  const { rows } = await pool.query<{ count: string }>("SELECT COUNT(*) FROM appointments");
  if (Number(rows[0].count) === 0) {
    const today = clinicNow().date;
    const patient = { id: AUTH_USER.PATIENT, name: "Demo Patient", email: "patient@dentalclinic.com" };
    const demo = [
      { dentist: DENTIST_ID.SARA, treatment: T.CHECKUP, date: workingDay(SARA_DAYS, addDays(today, -7), -1), start: "10:00", end: "10:30", status: "COMPLETED",
        patientNotes: "Routine six-month visit.", dentistNotes: "Cleaning completed, no cavities found. Recommend daily flossing and a recheck in six months." },
      { dentist: DENTIST_ID.KARIM, treatment: T.FILLING, date: workingDay(KARIM_DAYS, addDays(today, -3), -1), start: "11:00", end: "11:45", status: "CANCELLED",
        patientNotes: "Sensitivity on a lower molar.", dentistNotes: null },
      { dentist: DENTIST_ID.SARA, treatment: T.BRACES, date: workingDay(SARA_DAYS, addDays(today, 2), 1), start: "11:00", end: "11:30", status: "CONFIRMED",
        patientNotes: "Interested in clear aligners.", dentistNotes: null },
      { dentist: DENTIST_ID.KARIM, treatment: T.WHITENING, date: workingDay(KARIM_DAYS, addDays(today, 4), 1), start: "14:00", end: "15:00", status: "PENDING",
        patientNotes: "Would like whitening before an event.", dentistNotes: null },
    ];
    for (const a of demo) {
      await pool.query(
        `INSERT INTO appointments
           (patient_user_id, patient_name, patient_email, dentist_id, treatment_id,
            appointment_date, start_time, end_time, status, patient_notes, dentist_notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::appointment_status, $10, $11)`,
        [patient.id, patient.name, patient.email, a.dentist, a.treatment, a.date, a.start, a.end, a.status, a.patientNotes, a.dentistNotes],
      );
    }
    console.log(`[seed] ${demo.length} demo appointments created`);
  }
  console.log("[seed] demo dentists and treatments ready");
}
