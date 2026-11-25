-- clinic (backend) service schema (clinic_db)
-- NOTE: user ids are plain UUIDs that logically reference auth_db.users.id (NO cross-database FKs)

CREATE TYPE appointment_status AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE dentist_profiles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL UNIQUE,
  full_name    VARCHAR(120) NOT NULL,
  specialty    VARCHAR(120) NOT NULL,
  bio          TEXT NOT NULL DEFAULT '',
  room_number  VARCHAR(30) NOT NULL,
  working_days JSONB NOT NULL DEFAULT '["MON","TUE","WED","THU","FRI"]',
  start_time   VARCHAR(5) NOT NULL DEFAULT '09:00',
  end_time     VARCHAR(5) NOT NULL DEFAULT '17:00',
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT dentist_hours_valid CHECK (start_time < end_time)
);

CREATE TABLE treatments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             VARCHAR(120) NOT NULL,
  description      TEXT NOT NULL DEFAULT '',
  duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
  price            DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  category         VARCHAR(60) NOT NULL,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE appointments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_user_id  UUID NOT NULL,
  patient_name     VARCHAR(120) NOT NULL,
  patient_email    VARCHAR(254) NOT NULL,
  dentist_id       UUID NOT NULL REFERENCES dentist_profiles (id),
  treatment_id     UUID NOT NULL REFERENCES treatments (id),
  appointment_date DATE NOT NULL,
  start_time       VARCHAR(5) NOT NULL,
  end_time         VARCHAR(5) NOT NULL,
  status           appointment_status NOT NULL DEFAULT 'PENDING',
  patient_notes    TEXT,
  dentist_notes    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT appointment_times_valid CHECK (start_time < end_time)
);

CREATE INDEX idx_appt_patient ON appointments (patient_user_id, appointment_date);
CREATE INDEX idx_appt_dentist_date ON appointments (dentist_id, appointment_date);
CREATE INDEX idx_appt_status ON appointments (status);

-- safety net against double booking the exact same start time (overlaps are checked in the service under a row lock)
CREATE UNIQUE INDEX uq_appt_dentist_slot
  ON appointments (dentist_id, appointment_date, start_time)
  WHERE status IN ('PENDING', 'CONFIRMED');

CREATE TRIGGER trg_dentists_updated_at BEFORE UPDATE ON dentist_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_treatments_updated_at BEFORE UPDATE ON treatments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
