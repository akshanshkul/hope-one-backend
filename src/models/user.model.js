import { query } from "../config/database.js";

export const createUsersTable = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      full_name TEXT NOT NULL,
      mobile TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      date_of_birth DATE,
      gender TEXT,
      blood_group TEXT,
      medical_stage TEXT,
      address TEXT,
      state TEXT,
      district TEXT,
      pin_code TEXT,
      emergency_contact TEXT,
      income TEXT,
      ration_card TEXT,
      insurance TEXT,
      dependents TEXT,
      occupation TEXT,
      password_hash TEXT,
      auth_provider TEXT NOT NULL DEFAULT 'password',
      firebase_uid TEXT UNIQUE,
      profile_complete BOOLEAN NOT NULL DEFAULT TRUE,
      profile_image_key TEXT,
      document_metadata JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await query(`
    ALTER TABLE users
      ALTER COLUMN mobile DROP NOT NULL,
      ALTER COLUMN date_of_birth DROP NOT NULL,
      ALTER COLUMN gender DROP NOT NULL,
      ALTER COLUMN address DROP NOT NULL,
      ALTER COLUMN state DROP NOT NULL,
      ALTER COLUMN district DROP NOT NULL,
      ALTER COLUMN pin_code DROP NOT NULL,
      ALTER COLUMN emergency_contact DROP NOT NULL,
      ALTER COLUMN password_hash DROP NOT NULL
  `);
  await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider TEXT NOT NULL DEFAULT 'password'");
  await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS firebase_uid TEXT UNIQUE");
  await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN NOT NULL DEFAULT TRUE");
  await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS document_metadata JSONB NOT NULL DEFAULT '[]'::jsonb");
  await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_key TEXT");
  await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS blood_group TEXT");
  await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS medical_stage TEXT");
  await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()");
  await query(`
    CREATE TABLE IF NOT EXISTS push_notification_tokens (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      platform TEXT,
      device_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, device_id)
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS contact_change_verifications (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      change_type TEXT NOT NULL CHECK (change_type IN ('mobile', 'email')),
      new_value TEXT NOT NULL,
      current_code_hash TEXT NOT NULL,
      new_code_hash TEXT,
      expires_at TIMESTAMPTZ NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS password_reset_verifications (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      code_hash TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      verified_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await query(
    "ALTER TABLE password_reset_verifications ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ"
  );
};

export const findUserByEmailOrMobile = async (identifier) => {
  const result = await query(
    "SELECT * FROM users WHERE LOWER(email) = LOWER($1) OR mobile = $1 LIMIT 1",
    [identifier]
  );
  return result.rows[0] || null;
};

export const findUserByFirebaseUid = async (firebaseUid) => {
  const result = await query("SELECT * FROM users WHERE firebase_uid = $1 LIMIT 1", [firebaseUid]);
  return result.rows[0] || null;
};

export const findUserByEmail = async (email) => {
  const result = await query("SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1", [email]);
  return result.rows[0] || null;
};

export const insertUser = async (user) => {
  const result = await query(
    `INSERT INTO users (
      id, full_name, mobile, email, date_of_birth, gender, address, state,
      district, pin_code, emergency_contact, income, ration_card, insurance,
      dependents, occupation, password_hash, auth_provider, firebase_uid, profile_complete,
      document_metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
    RETURNING id, full_name, mobile, email, date_of_birth, gender, address, state,
      district, pin_code, emergency_contact, income, ration_card, insurance,
      dependents, occupation, auth_provider, firebase_uid, profile_complete, document_metadata, created_at, updated_at`,
    [
      user.id, user.fullName, user.mobile, user.email, user.dateOfBirth, user.gender,
      user.address, user.state, user.district, user.pinCode, user.emergencyContact,
      user.income || null, user.rationCard || null, user.insurance || null,
      user.dependents || null, user.occupation || null, user.passwordHash || null,
      user.authProvider || "password", user.firebaseUid || null,
      user.profileComplete ?? true, JSON.stringify(user.documentMetadata || [])
    ]
  );
  return result.rows[0];
};

export const updateUserProfile = async (id, profile) => {
  const fields = ["full_name", "mobile", "date_of_birth", "gender", "blood_group", "medical_stage", "address", "state",
    "district", "pin_code", "emergency_contact", "income", "ration_card", "insurance",
    "dependents", "occupation", "document_metadata"];
  const values = fields.map((field) => profile[field] ?? null);
  const result = await query(
    `UPDATE users SET (${fields.join(", ")}) = (${fields.map((_, index) => `$${index + 2}`).join(", ")}),
      profile_complete = TRUE, updated_at = NOW()
      WHERE id = $1
      RETURNING id, full_name, mobile, email, date_of_birth, gender, blood_group, medical_stage, address, state, district,
        pin_code, emergency_contact, income, ration_card, insurance, dependents, occupation,
        auth_provider, firebase_uid, profile_complete, document_metadata, created_at, updated_at`,
    [id, ...values.slice(0, -1), JSON.stringify(values[values.length - 1] || [])]
  );
  return result.rows[0] || null;
};

export const updateFirebaseUser = async (id, profile) => {
  const result = await query(
    `UPDATE users SET full_name = COALESCE($2, full_name), email = COALESCE($3, email),
      updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id, profile.fullName || null, profile.email || null]
  );
  return result.rows[0] || null;
};

export const updateUserProfileImage = async (id, key) => {
  const result = await query(
    `UPDATE users SET profile_image_key = $2, updated_at = NOW()
     WHERE id = $1 RETURNING id, profile_image_key`,
    [id, key]
  );
  return result.rows[0] || null;
};
