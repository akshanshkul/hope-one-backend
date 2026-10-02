import { query } from "../config/database.js";

export const createAssistanceProgramsTable = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS assistance_programs (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      kind TEXT NOT NULL,
      kind_label TEXT NOT NULL,
      summary TEXT,
      region TEXT,
      covers TEXT,
      amount_label TEXT,
      amount TEXT,
      about TEXT,
      coverage JSONB NOT NULL DEFAULT '[]',
      eligibility JSONB NOT NULL DEFAULT '[]',
      documents JSONB NOT NULL DEFAULT '[]',
      how_to_apply JSONB NOT NULL DEFAULT '[]',
      processing_time TEXT,
      phone TEXT,
      website TEXT,
      contact_email TEXT,
      banner_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await query("ALTER TABLE assistance_programs ADD COLUMN IF NOT EXISTS contact_email TEXT");
  await query("ALTER TABLE assistance_programs ADD COLUMN IF NOT EXISTS banner_url TEXT");
};

export const listAssistancePrograms = async () => {
  const result = await query("SELECT * FROM assistance_programs ORDER BY name");
  return result.rows.map((row) => ({
    ...row,
    kindLabel: row.kind_label,
    amountLabel: row.amount_label,
    processingTime: row.processing_time,
    howToApply: row.how_to_apply,
    contactEmail: row.contact_email,
    bannerUrl: row.banner_url,
  }));
};
