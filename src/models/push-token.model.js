import { randomUUID } from "node:crypto";
import { query } from "../config/database.js";

export const upsertPushToken = async ({ userId, token, platform, deviceId }) => {
  const result = await query(
    `INSERT INTO push_notification_tokens (id, user_id, token, platform, device_id)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (token) DO UPDATE SET user_id = EXCLUDED.user_id,
       platform = EXCLUDED.platform, device_id = EXCLUDED.device_id, updated_at = NOW()
     RETURNING id, user_id, token, platform, device_id, created_at, updated_at`,
    [randomUUID(), userId, token, platform || null, deviceId || null]
  );
  return result.rows[0];
};

export const removePushToken = async (userId, token) => {
  const result = await query(
    "DELETE FROM push_notification_tokens WHERE user_id = $1 AND token = $2 RETURNING id",
    [userId, token]
  );
  return Boolean(result.rowCount);
};
