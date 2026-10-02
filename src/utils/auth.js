import { createHmac, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import env from "../config/env.js";

const scrypt = promisify(scryptCallback);

export const hashPassword = async (password) => {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
};

export const verifyPassword = async (password, storedHash) => {
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;

  const derivedKey = await scrypt(password, salt, 64);
  const expected = Buffer.from(key, "hex");
  return expected.length === derivedKey.length && timingSafeEqual(expected, derivedKey);
};

export const createAccessToken = (userId) => {
  const payload = Buffer.from(
    JSON.stringify({ sub: userId, iat: Math.floor(Date.now() / 1000), jti: randomUUID() })
  ).toString("base64url");
  const signature = createHmac("sha256", env.auth.tokenSecret)
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
};
