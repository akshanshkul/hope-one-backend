import { query } from "../config/database.js";
import { updateUserProfile } from "../models/user.model.js";
import { updateUserProfileImage } from "../models/user.model.js";
import { createDownloadUrl } from "./storage.service.js";

const publicFields = `id, full_name, mobile, email, date_of_birth, gender, blood_group, medical_stage, address, state,
  district, pin_code, emergency_contact, income, ration_card, insurance, dependents, occupation,
  auth_provider, firebase_uid, profile_complete, document_metadata, profile_image_key, created_at, updated_at`;

export const getUserProfile = async (id) => {
  const result = await query(`SELECT ${publicFields} FROM users WHERE id = $1`, [id]);
  if (!result.rows[0]) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  const user = result.rows[0];
  if (user.profile_image_key) {
    user.profile_image_url = await createDownloadUrl(user.profile_image_key);
  }
  return user;
};

export const updateProfileImage = async (id, key) => {
  if (!key || !String(key).startsWith(`users/${id}/profile/`)) {
    const error = new Error("Invalid profile image");
    error.statusCode = 400;
    throw error;
  }
  const user = await updateUserProfileImage(id, key);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  return getUserProfile(id);
};

export const updateProfile = async (id, input) => {
  const current = await getUserProfile(id);
  const value = (name, fallback) => input[name] === undefined ? fallback : input[name];
  const user = await updateUserProfile(id, {
    full_name: value("fullName", current.full_name), mobile: value("mobile", current.mobile),
    date_of_birth: value("dateOfBirth", current.date_of_birth), gender: value("gender", current.gender),
    blood_group: input.bloodGroup === undefined
      ? (input.blood_group === undefined ? current.blood_group : input.blood_group)
      : input.bloodGroup,
    medical_stage: input.medicalStage === undefined
      ? (input.medical_stage === undefined ? current.medical_stage : input.medical_stage)
      : input.medicalStage,
    address: value("address", current.address), state: value("state", current.state),
    district: value("district", current.district), pin_code: value("pinCode", current.pin_code),
    emergency_contact: value("emergencyContact", current.emergency_contact),
    income: value("income", current.income), ration_card: value("rationCard", current.ration_card),
    insurance: value("insurance", current.insurance), dependents: value("dependents", current.dependents),
    occupation: value("occupation", current.occupation),
    document_metadata: value("documentMetadata", current.document_metadata || [])
  });
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  return user;
};
