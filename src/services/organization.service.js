import { createAccessToken, hashPassword, verifyPassword } from "../utils/auth.js";
import { randomUUID } from "node:crypto";
import { query } from "../config/database.js";
import {
  createOrganization,
  findOrganizationByEmail,
  findOrganizationLogin,
  getOrganization,
  updateOrganization,
} from "../models/organization.model.js";

const clean = (row) => {
  if (!row) return row;
  const { password_hash: _password, ...safe } = row;
  return safe;
};

const nonEmptyArray = (value) => Array.isArray(value) && value.length ? value : null;

const syncCatalog = async (organization) => {
  const details = organization.details || {};
  if (organization.type === "hospital") {
    const values = [
      organization.display_name, [organization.district, organization.state].filter(Boolean).join(", "),
      organization.address || "", organization.pin_code || "", details.specialty || "Cancer Care", organization.description || "",
      organization.phone || "", JSON.stringify(details.schemes || []),
      JSON.stringify(details.departments || []), JSON.stringify(details.facilities || []),
      organization.website || "", details.contactEmail || organization.email || "", details.emergencyPhone || "",
      details.hours || "", details.bannerUrl || "", JSON.stringify(details.doctors || []),
      JSON.stringify(details.costs || []), details.tagline || "", details.years || "",
    ];
    const existing = await query(
      organization.catalog_id
        ? "SELECT id FROM hospitals WHERE id = $1 LIMIT 1"
        : "SELECT id FROM hospitals WHERE name = $1 LIMIT 1",
      [organization.catalog_id || organization.display_name]
    );
    if (existing.rowCount) {
      await query(
        `UPDATE hospitals SET name=$2, city=$3, address=$4, pin=$5, specialty=$6, about=$7, phone=$8,
         schemes=$9, departments=$10, facilities=$11, website=$12, contact_email=$13,
         emergency_phone=$14, hours=$15, banner_url=$16, doctors=$17, costs=$18,
         tagline=$19, years=$20 WHERE id=$1`,
        [existing.rows[0].id, ...values]
      );
      if (organization.catalog_id !== existing.rows[0].id) {
        await query("UPDATE organizations SET catalog_id=$2 WHERE id=$1", [organization.id, existing.rows[0].id]);
      }
    } else {
      await query(
        `INSERT INTO hospitals
          (id, name, kind, city, address, pin, specialty, about, phone, schemes, departments, facilities,
           website, contact_email, emergency_phone, hours, banner_url, doctors, costs, tagline, years)
         VALUES ($1, $2, 'Private', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
        [randomUUID(), ...values]
      );
      const created = await query("SELECT id FROM hospitals WHERE name = $1 LIMIT 1", [organization.display_name]);
      if (created.rowCount) {
        await query("UPDATE organizations SET catalog_id=$2 WHERE id=$1", [organization.id, created.rows[0].id]);
      }
    }
  } else {
    const values = [
      organization.display_name, organization.description || "",
      [organization.district, organization.state].filter(Boolean).join(", "), details.covers || "",
      organization.description || "", JSON.stringify(details.coverage || []),
      JSON.stringify(details.eligibility || []), JSON.stringify(details.documents || []),
      JSON.stringify(details.howToApply || []), organization.phone || "", organization.website || "",
      details.contactEmail || organization.email || "", details.bannerUrl || "",
    ];
    const existing = await query(
      organization.catalog_id
        ? "SELECT id FROM assistance_programs WHERE id = $1 LIMIT 1"
        : "SELECT id FROM assistance_programs WHERE name = $1 LIMIT 1",
      [organization.catalog_id || organization.display_name]
    );
    if (existing.rowCount) {
      await query(
        `UPDATE assistance_programs SET name=$2, summary=$3, region=$4, covers=$5, about=$6, coverage=$7,
         eligibility=$8, documents=$9, how_to_apply=$10, phone=$11, website=$12,
         contact_email=$13, banner_url=$14 WHERE id=$1`,
        [existing.rows[0].id, ...values]
      );
      if (organization.catalog_id !== existing.rows[0].id) {
        await query("UPDATE organizations SET catalog_id=$2 WHERE id=$1", [organization.id, existing.rows[0].id]);
      }
    } else {
      await query(
        `INSERT INTO assistance_programs
          (id, name, kind, kind_label, summary, region, covers, about, coverage, eligibility, documents, how_to_apply,
           phone, website, contact_email, banner_url)
         VALUES ($1, $2, 'NGO', 'NGO', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [randomUUID(), ...values]
      );
      const created = await query("SELECT id FROM assistance_programs WHERE name = $1 LIMIT 1", [organization.display_name]);
      if (created.rowCount) {
        await query("UPDATE organizations SET catalog_id=$2 WHERE id=$1", [organization.id, created.rows[0].id]);
      }
    }
  }
};

export const registerOrganization = async (input) => {
  if (!["hospital", "ngo"].includes(input.type)) throw Object.assign(new Error("Type must be hospital or ngo"), { statusCode: 400 });
  for (const field of ["legalName", "displayName", "contactName", "email", "password"]) {
    if (!String(input[field] || "").trim()) throw Object.assign(new Error(`${field} is required`), { statusCode: 400 });
  }
  if (input.password.length < 8) throw Object.assign(new Error("Password must be at least 8 characters"), { statusCode: 400 });
  if (await findOrganizationByEmail(input.email)) throw Object.assign(new Error("An organization with this email already exists"), { statusCode: 409 });
  const result = await createOrganization(input, await hashPassword(input.password));
  await syncCatalog(result.organization);
  return { ...result, token: createAccessToken(result.user.id) };
};

export const loginOrganization = async ({ email, password }) => {
  const account = await findOrganizationLogin(email);
  if (!account || !(await verifyPassword(password, account.password_hash))) {
    throw Object.assign(new Error("Invalid organization email or password"), { statusCode: 401 });
  }
  return { token: createAccessToken(account.id), user: clean(account), organization: clean(account) };
};

export const organizationProfile = async (userId) => {
  const organization = await getOrganization(userId);
  if (!organization) return organization;
  if (organization.type === "hospital") {
    const catalog = await query(
      organization.catalog_id
        ? "SELECT * FROM hospitals WHERE id = $1 LIMIT 1"
        : "SELECT * FROM hospitals WHERE name = $1 LIMIT 1",
      [organization.catalog_id || organization.display_name]
    );
    if (catalog.rowCount) {
      const row = catalog.rows[0];
      organization.details = {
        ...(organization.details || {}),
        doctors: nonEmptyArray(organization.details?.doctors) || row.doctors || [],
        departments: nonEmptyArray(organization.details?.departments) || row.departments || [],
        facilities: nonEmptyArray(organization.details?.facilities) || row.facilities || [],
        schemes: nonEmptyArray(organization.details?.schemes) || row.schemes || [],
        costs: nonEmptyArray(organization.details?.costs) || row.costs || [],
        bannerUrl: organization.details?.bannerUrl || row.banner_url || "",
        contactEmail: organization.details?.contactEmail || row.contact_email || "",
        emergencyPhone: organization.details?.emergencyPhone || row.emergency_phone || "",
        hours: organization.details?.hours || row.hours || "",
      };
    }
  } else {
    const catalog = await query(
      organization.catalog_id
        ? "SELECT * FROM assistance_programs WHERE id = $1 LIMIT 1"
        : "SELECT * FROM assistance_programs WHERE name = $1 LIMIT 1",
      [organization.catalog_id || organization.display_name]
    );
    if (catalog.rowCount) {
      const row = catalog.rows[0];
      organization.details = {
        ...(organization.details || {}),
        coverage: nonEmptyArray(organization.details?.coverage) || row.coverage || [],
        eligibility: nonEmptyArray(organization.details?.eligibility) || row.eligibility || [],
        documents: nonEmptyArray(organization.details?.documents) || row.documents || [],
        howToApply: nonEmptyArray(organization.details?.howToApply) || row.how_to_apply || [],
        contactEmail: organization.details?.contactEmail || row.contact_email || "",
        bannerUrl: organization.details?.bannerUrl || row.banner_url || "",
      };
    }
  }
  return organization;
};
export const updateOrganizationProfile = async (userId, input) => {
  const organization = await updateOrganization(userId, input);
  if (organization) await syncCatalog(organization);
  return organization;
};
