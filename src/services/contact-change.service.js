import { createHash, randomInt, randomUUID } from "node:crypto";
import { query } from "../config/database.js";
import { getUserProfile } from "./profile.service.js";
import { sendContactChangeOtp } from "./mail.service.js";

const OTP_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;

const hashCode = (code) => createHash("sha256").update(code).digest("hex");
const makeCode = () => String(randomInt(100000, 1000000));

const invalid = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

export const requestContactChange = async (userId, changeType, newValue) => {
  const user = await getUserProfile(userId);
  const value = String(newValue || "").trim();
  if (!["mobile", "email"].includes(changeType)) throw invalid("Invalid contact change type");
  if (!value) throw invalid(`New ${changeType} is required`);
  if (changeType === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw invalid("Enter a valid email address");
  }
  if (changeType === "mobile" && !/^\+?[0-9]{7,15}$/.test(value)) {
    throw invalid("Enter a valid mobile number");
  }
  if (changeType === "email" && value.toLowerCase() === String(user.email).toLowerCase()) {
    throw invalid("New email must be different from your current email");
  }
  if (changeType === "mobile" && value === user.mobile) {
    throw invalid("New mobile must be different from your current mobile");
  }

  const duplicate = await query(
    changeType === "email"
      ? "SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id <> $2 LIMIT 1"
      : "SELECT id FROM users WHERE mobile = $1 AND id <> $2 LIMIT 1",
    [value, userId]
  );
  if (duplicate.rows[0]) throw invalid(`That ${changeType} is already registered`);
  if (!user.email) throw invalid("A current email is required for verification");

  const currentCode = makeCode();
  const newCode = changeType === "email" ? makeCode() : null;
  const id = randomUUID();
  await query(
    `INSERT INTO contact_change_verifications
      (id, user_id, change_type, new_value, current_code_hash, new_code_hash, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '${OTP_TTL_MINUTES} minutes')`,
    [id, userId, changeType, value, hashCode(currentCode), newCode && hashCode(newCode)]
  );

  await sendContactChangeOtp({
    email: user.email,
    newEmail: changeType === "email" ? value : undefined,
    fullName: user.full_name,
    currentCode,
    newCode,
    changeType
  });
  return { challengeId: id, expiresInSeconds: OTP_TTL_MINUTES * 60 };
};

export const verifyContactChange = async (userId, challengeId, currentCode, newCode) => {
  const result = await query(
    `SELECT * FROM contact_change_verifications
     WHERE id = $1 AND user_id = $2 AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [challengeId, userId]
  );
  const challenge = result.rows[0];
  if (!challenge) throw invalid("This verification code has expired or is invalid");
  if (challenge.attempts >= MAX_ATTEMPTS) throw invalid("Too many incorrect verification attempts");

  const matchesCurrent = hashCode(String(currentCode || "")) === challenge.current_code_hash;
  const matchesNew = !challenge.new_code_hash || hashCode(String(newCode || "")) === challenge.new_code_hash;
  if (!matchesCurrent || !matchesNew) {
    await query("UPDATE contact_change_verifications SET attempts = attempts + 1 WHERE id = $1", [challenge.id]);
    throw invalid("Incorrect verification code");
  }

  const column = challenge.change_type === "email" ? "email" : "mobile";
  const update = await query(
    `UPDATE users SET ${column} = $2, updated_at = NOW()
     WHERE id = $1 RETURNING id`,
    [userId, challenge.new_value]
  );
  if (!update.rows[0]) throw invalid("User not found");
  await query("DELETE FROM contact_change_verifications WHERE id = $1", [challenge.id]);
  return getUserProfile(userId);
};
