import { completeRegistration, loginUser, registerUser } from "../services/auth.service.js";
import { getUserProfile, updateProfile, updateProfileImage } from "../services/profile.service.js";
import { requireProfileFields } from "../utils/profile.js";
import { requestContactChange, verifyContactChange } from "../services/contact-change.service.js";
import {
  requestPasswordReset,
  resetPassword,
  verifyPasswordResetOtp
} from "../services/password-reset.service.js";

const required = [
  "fullName", "mobile", "email", "dateOfBirth", "gender", "address", "state",
  "district", "pinCode", "emergencyContact", "password"
];

const validateRegistration = (body) => {
  const missing = required.filter((field) => !String(body[field] || "").trim());
  if (missing.length) {
    const error = new Error(`Missing required fields: ${missing.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }
  if (body.password !== body.confirmPassword) {
    const error = new Error("Password and confirm password must match");
    error.statusCode = 400;
    throw error;
  }
  if (body.password.length < 8) {
    const error = new Error("Password must be at least 8 characters");
    error.statusCode = 400;
    throw error;
  }
};

export const register = async (req, res) => {
  validateRegistration(req.body);
  const result = await registerUser(req.body);
  res.status(201).json({ success: true, message: "Registration successful", data: result });
};

export const login = async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    const error = new Error("Email/mobile and password are required");
    error.statusCode = 400;
    throw error;
  }
  const result = await loginUser({ identifier: identifier.trim(), password });
  res.json({ success: true, message: "Login successful", data: result });
};

export const requestPasswordResetOtp = async (req, res) => {
  const data = await requestPasswordReset(req.body.identifier);
  res.json({ success: true, message: "Verification code sent to your email", data });
};

export const verifyPasswordReset = async (req, res) => {
  const data = await verifyPasswordResetOtp(req.body.challengeId, req.body.code);
  res.json({ success: true, message: "Verification code accepted", data });
};

export const changeForgottenPassword = async (req, res) => {
  const data = await resetPassword(req.body.challengeId, req.body.code, req.body.password);
  res.json({ success: true, message: "Password changed successfully", data });
};

export const profile = async (req, res) => {
  res.json({ success: true, data: { user: await getUserProfile(req.user.id) } });
};

export const updateProfileDetails = async (req, res) => {
  const result = await updateProfile(req.user.id, req.body);
  res.json({ success: true, data: { user: result } });
};

export const updateProfileImageDetails = async (req, res) => {
  const user = await updateProfileImage(req.user.id, req.body.key);
  res.json({ success: true, message: "Profile photo updated", data: { user } });
};

export const finishRegistration = async (req, res) => {
  requireProfileFields(req.body);
  const user = await completeRegistration(req.user.id, req.body);
  res.json({ success: true, message: "Registration completed", data: { user } });
};

export const requestContactChangeOtp = async (req, res) => {
  const { changeType, newValue } = req.body;
  const data = await requestContactChange(req.user.id, changeType, newValue);
  res.json({ success: true, message: "Verification code sent", data });
};

export const verifyContactChangeOtp = async (req, res) => {
  const { challengeId, currentCode, newCode } = req.body;
  const user = await verifyContactChange(req.user.id, challengeId, currentCode, newCode);
  res.json({ success: true, message: "Contact updated successfully", data: { user } });
};
