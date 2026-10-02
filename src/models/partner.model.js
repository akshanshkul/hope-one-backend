import { query } from "../config/database.js";

export const createPartnerTables = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS partner_patients (
      id UUID PRIMARY KEY, organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL, name TEXT NOT NULL, phone TEXT, diagnosis TEXT,
      cancer_stage TEXT, status TEXT NOT NULL DEFAULT 'active', notes TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS partner_appointments (
      id UUID PRIMARY KEY, organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      patient_id UUID REFERENCES partner_patients(id) ON DELETE SET NULL, doctor_name TEXT, appointment_at TIMESTAMPTZ NOT NULL,
      type TEXT, status TEXT NOT NULL DEFAULT 'scheduled', notes TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS partner_events (
      id UUID PRIMARY KEY, organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      title TEXT NOT NULL, description TEXT, starts_at TIMESTAMPTZ, location TEXT, banner_url TEXT,
      status TEXT NOT NULL DEFAULT 'draft', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS partner_documents (
      id UUID PRIMARY KEY, organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name TEXT NOT NULL, storage_key TEXT, category TEXT, expires_at DATE, status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS partner_announcements (
      id UUID PRIMARY KEY, organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      title TEXT NOT NULL, message TEXT NOT NULL, published_at TIMESTAMPTZ, status TEXT NOT NULL DEFAULT 'draft',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS partner_staff (
      id UUID PRIMARY KEY, organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name TEXT NOT NULL, email TEXT, role TEXT NOT NULL DEFAULT 'staff', phone TEXT, status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS partner_audit_logs (
      id UUID PRIMARY KEY, organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL, action TEXT NOT NULL, resource TEXT NOT NULL,
      resource_id UUID, metadata JSONB NOT NULL DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
};
