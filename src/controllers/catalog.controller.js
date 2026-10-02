import {
  listAssistancePrograms,
  listCatalogOptions,
  listHospitals,
} from "../services/catalog.service.js";

export const hospitals = async (_req, res) => {
  res.json({ success: true, data: { hospitals: await listHospitals() } });
};

export const assistance = async (_req, res) => {
  res.json({ success: true, data: { assistance: await listAssistancePrograms() } });
};

export const catalogOptions = async (_req, res) => {
  res.json({ success: true, data: { options: await listCatalogOptions() } });
};
