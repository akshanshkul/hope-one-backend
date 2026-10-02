import {
  loginOrganization,
  organizationProfile,
  registerOrganization,
  updateOrganizationProfile,
} from "../services/organization.service.js";

export const register = async (req, res) => {
  const data = await registerOrganization(req.body);
  res.status(201).json({ success: true, message: "Organization registration successful", data });
};

export const login = async (req, res) => {
  const data = await loginOrganization(req.body);
  res.json({ success: true, message: "Organization login successful", data });
};

export const profile = async (req, res) => {
  res.json({ success: true, data: { organization: await organizationProfile(req.user.id) } });
};

export const updateProfile = async (req, res) => {
  res.json({ success: true, data: { organization: await updateOrganizationProfile(req.user.id, req.body) } });
};
