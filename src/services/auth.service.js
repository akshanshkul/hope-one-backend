import { randomUUID } from "node:crypto";
import { createAccessToken, hashPassword, verifyPassword } from "../utils/auth.js";
import { findUserByEmailOrMobile, insertUser, updateUserProfile } from "../models/user.model.js";
import { sendRegistrationThankYou } from "./mail.service.js";

const publicUser = (user) => {
  const { password_hash: _passwordHash, ...safeUser } = user;
  return safeUser;
};

export const registerUser = async (input) => {
  const existing = await findUserByEmailOrMobile(input.email);
  if (existing || await findUserByEmailOrMobile(input.mobile)) {
    const error = new Error("An account with this email or mobile already exists");
    error.statusCode = 409;
    throw error;
  }

  const user = await insertUser({
    ...input,
    id: randomUUID(),
    passwordHash: await hashPassword(input.password)
  });

  try {
    await sendRegistrationThankYou({ email: user.email, fullName: user.full_name });
  } catch (error) {
    console.error("Registration email failed:", error.message);
  }

  return { user: publicUser(user), token: createAccessToken(user.id) };
};

export const loginUser = async ({ identifier, password }) => {
  const user = await findUserByEmailOrMobile(identifier);
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    const error = new Error("Invalid email/mobile or password");
    error.statusCode = 401;
    throw error;
  }
  return { user: publicUser(user), token: createAccessToken(user.id) };
};

export const completeRegistration = async (id, input) => {
  const profile = {
    full_name: input.fullName, mobile: input.mobile, date_of_birth: input.dateOfBirth,
    gender: input.gender, address: input.address, state: input.state, district: input.district,
    pin_code: input.pinCode, emergency_contact: input.emergencyContact, income: input.income,
    ration_card: input.rationCard, insurance: input.insurance, dependents: input.dependents,
    occupation: input.occupation, document_metadata: input.documentMetadata || []
  };
  const user = await updateUserProfile(id, profile);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  return publicUser(user);
};
