import { query } from "../config/database.js";

export const createHospitalsTable = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS hospitals (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      kind TEXT NOT NULL,
      city TEXT NOT NULL,
      pin TEXT,
      address TEXT,
      distance TEXT,
      drive_time TEXT,
      rating TEXT,
      reviews INTEGER NOT NULL DEFAULT 0,
      review_items JSONB NOT NULL DEFAULT '[]',
      specialty TEXT,
      cost TEXT,
      tagline TEXT,
      photo_count INTEGER NOT NULL DEFAULT 1,
      years TEXT,
      about TEXT,
      departments JSONB NOT NULL DEFAULT '[]',
      specialties JSONB NOT NULL DEFAULT '[]',
      costs JSONB NOT NULL DEFAULT '[]',
      doctors JSONB NOT NULL DEFAULT '[]',
      facilities JSONB NOT NULL DEFAULT '[]',
      schemes JSONB NOT NULL DEFAULT '[]',
      phone TEXT,
      website TEXT,
      contact_email TEXT,
      emergency_phone TEXT,
      hours TEXT,
      banner_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await query("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS review_items JSONB NOT NULL DEFAULT '[]'");
  await query("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS website TEXT");
  await query("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS contact_email TEXT");
  await query("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS emergency_phone TEXT");
  await query("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS hours TEXT");
  await query("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS banner_url TEXT");
};

export const listHospitals = async () => {
  const result = await query("SELECT * FROM hospitals ORDER BY name");
  return result.rows.map((row) => ({
    ...row,
    driveTime: row.drive_time,
    photoCount: row.photo_count,
    contactEmail: row.contact_email,
    emergencyPhone: row.emergency_phone,
    bannerUrl: row.banner_url,
  }));
};
