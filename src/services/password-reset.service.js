import { createHash, randomInt, randomUUID } from "node:crypto";
import { query } from "../config/database.js";
import { hashPassword } from "../utils/auth.js";
import { findUserByEmailOrMobile } from "../models/user.model.js";
import { sendPasswordResetOtp } from "./mail.service.js";

const OTP_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;

const hashCode = (code) => createHash("sha256").update(code).digest("hex");
const invalid = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

export const requestPasswordReset = async (identifier) => {
  const value = String(identifier || "").trim();
  if (!value) throw invalid("Email or mobile number is required");
  const user = await findUserByEmailOrMobile(value);
  if (!user || !user.email) throw invalid("No account with that email or mobile number was found");

  const code = String(randomInt(100000, 1000000));
  const challengeId = randomUUID();
  await query("DELETE FROM password_reset_verifications WHERE user_id = $1", [user.id]);
  await query(
    `INSERT INTO password_reset_verifications
      (id, user_id, code_hash, expires_at)
     VALUES ($1, $2, $3, NOW() + INTERVAL '${OTP_TTL_MINUTES} minutes')`,
    [challengeId, user.id, hashCode(code)]
  );
  await sendPasswordResetOtp({ email: user.email, fullName: user.full_name, code });
  return { challengeId, expiresInSeconds: OTP_TTL_MINUTES * 60 };
};

export const verifyPasswordResetOtp = async (challengeId, code) => {
  const result = await query(
    `SELECT * FROM password_reset_verifications
     WHERE id = $1 AND expires_at > NOW() LIMIT 1`,
    [challengeId]
  );
  const challenge = result.rows[0];
  if (!challenge) throw invalid("This verification code has expired or is invalid");
  if (challenge.attempts >= MAX_ATTEMPTS) throw invalid("Too many incorrect verification attempts");
  if (hashCode(String(code || "")) !== challenge.code_hash) {
    await query("UPDATE password_reset_verifications SET attempts = attempts + 1 WHERE id = $1", [challenge.id]);
    throw invalid("Incorrect verification code");
  }
  await query(
    "UPDATE password_reset_verifications SET verified_at = NOW() WHERE id = $1",
    [challenge.id]
  );
  return { challengeId: challenge.id };
};

export const resetPassword = async (challengeId, code, password) => {
  if (typeof password !== "string" || password.length < 8) {
    throw invalid("Password must be at least 8 characters");
  }
  const result = await query(
    `SELECT * FROM password_reset_verifications
     WHERE id = $1 AND expires_at > NOW() AND verified_at IS NOT NULL LIMIT 1`,
    [challengeId]
  );
  const challenge = result.rows[0];
  if (!challenge || hashCode(String(code || "")) !== challenge.code_hash) {
    throw invalid("Verify the OTP before changing your password");
  }
  const updated = await query(
    "UPDATE users SET password_hash = $2, auth_provider = 'password', updated_at = NOW() WHERE id = $1 RETURNING id",
    [challenge.user_id, await hashPassword(password)]
  );
  if (!updated.rows[0]) throw invalid("User not found");
  await query("DELETE FROM password_reset_verifications WHERE id = $1", [challenge.id]);
  return { success: true };
};
