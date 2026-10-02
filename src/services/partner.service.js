import { randomUUID } from "node:crypto";
import { query } from "../config/database.js";
import { getOrganization } from "../models/organization.model.js";

const resources = {
  patients: { table: "partner_patients", columns: ["name", "phone", "diagnosis", "cancer_stage", "status", "notes"] },
  appointments: { table: "partner_appointments", columns: ["patient_id", "doctor_name", "appointment_at", "type", "status", "notes"] },
  events: { table: "partner_events", columns: ["title", "description", "starts_at", "location", "banner_url", "status"] },
  documents: { table: "partner_documents", columns: ["name", "storage_key", "category", "expires_at", "status"] },
  announcements: { table: "partner_announcements", columns: ["title", "message", "published_at", "status"] },
  staff: { table: "partner_staff", columns: ["name", "email", "role", "phone", "status"] },
};

const resource = (name) => resources[name] || Object.assign(new Error("Unsupported partner resource"), { statusCode: 400 });
const orgId = async (userId) => {
  const organization = await getOrganization(userId);
  if (!organization) throw Object.assign(new Error("Organization not found"), { statusCode: 404 });
  return organization.id;
};

export const listPartnerRecords = async (userId, name) => {
  if (name === "audit") {
    const organizationId = await orgId(userId);
    const result = await query("SELECT * FROM partner_audit_logs WHERE organization_id = $1 ORDER BY created_at DESC", [organizationId]);
    return result.rows;
  }
  const item = resource(name);
  if (item instanceof Error) throw item;
  const organizationId = await orgId(userId);
  const result = await query(`SELECT * FROM ${item.table} WHERE organization_id = $1 ORDER BY created_at DESC`, [organizationId]);
  return result.rows;
};

export const createPartnerRecord = async (userId, name, input) => {
  const item = resource(name);
  if (item instanceof Error) throw item;
  const organizationId = await orgId(userId);
  const id = randomUUID();
  const columns = item.columns.filter((column) => input[column] !== undefined);
  if (name === "patients" && !String(input.name || "").trim()) throw Object.assign(new Error("Patient name is required"), { statusCode: 400 });
  if (name === "events" && !String(input.title || "").trim()) throw Object.assign(new Error("Event title is required"), { statusCode: 400 });
  if (name === "appointments" && !input.appointment_at) throw Object.assign(new Error("Appointment date and time is required"), { statusCode: 400 });
  if (name === "documents" && !String(input.name || "").trim()) throw Object.assign(new Error("Document name is required"), { statusCode: 400 });
  if (name === "announcements" && (!String(input.title || "").trim() || !String(input.message || "").trim())) throw Object.assign(new Error("Announcement title and message are required"), { statusCode: 400 });
  if (name === "staff" && !String(input.name || "").trim()) throw Object.assign(new Error("Staff name is required"), { statusCode: 400 });
  const values = [id, organizationId, ...columns.map((column) => input[column] ?? null)];
  const result = await query(
    `INSERT INTO ${item.table} (id, organization_id, ${columns.join(", ")}) VALUES ($1, $2, ${columns.map((_, index) => `$${index + 3}`).join(", ")}) RETURNING *`,
    values
  );
  await query("INSERT INTO partner_audit_logs (id, organization_id, user_id, action, resource, resource_id) VALUES ($1, $2, $3, 'create', $4, $5)", [randomUUID(), organizationId, userId, name, id]);
  return result.rows[0];
};

export const updatePartnerRecord = async (userId, name, id, input) => {
  const item = resource(name);
  if (item instanceof Error) throw item;
  const organizationId = await orgId(userId);
  const columns = item.columns.filter((column) => input[column] !== undefined);
  if (!columns.length) throw Object.assign(new Error("No editable fields supplied"), { statusCode: 400 });
  const values = columns.map((column) => input[column]);
  const result = await query(`UPDATE ${item.table} SET ${columns.map((column, index) => `${column}=$${index + 3}`).join(", ")} WHERE id=$1 AND organization_id=$2 RETURNING *`, [id, organizationId, ...values]);
  if (!result.rowCount) throw Object.assign(new Error("Record not found"), { statusCode: 404 });
  await query("INSERT INTO partner_audit_logs (id, organization_id, user_id, action, resource, resource_id) VALUES ($1, $2, $3, 'update', $4, $5)", [randomUUID(), organizationId, userId, name, id]);
  return result.rows[0];
};

export const deletePartnerRecord = async (userId, name, id) => {
  const item = resource(name);
  if (item instanceof Error) throw item;
  const organizationId = await orgId(userId);
  const result = await query(`DELETE FROM ${item.table} WHERE id=$1 AND organization_id=$2 RETURNING id`, [id, organizationId]);
  if (!result.rowCount) throw Object.assign(new Error("Record not found"), { statusCode: 404 });
  return result.rows[0];
};
