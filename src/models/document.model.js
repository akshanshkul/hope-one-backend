import { randomUUID } from "node:crypto";
import { query } from "../config/database.js";

export const createDocumentsTable = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS documents (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      storage_key TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      mime_type TEXT,
      size_bytes BIGINT,
      category TEXT NOT NULL DEFAULT 'Other',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await query("CREATE INDEX IF NOT EXISTS documents_user_id_idx ON documents(user_id)");
};

export const createDocumentRecord = async ({
  userId,
  storageKey,
  name,
  mimeType,
  category,
}) => {
  const result = await query(
    `INSERT INTO documents (id, user_id, storage_key, name, mime_type, category)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (storage_key) DO UPDATE SET
       name = EXCLUDED.name,
       mime_type = EXCLUDED.mime_type,
       category = EXCLUDED.category
     RETURNING *`,
    [randomUUID(), userId, storageKey, name, mimeType || null, category]
  );
  return result.rows[0];
};
