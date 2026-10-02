import { randomUUID } from "node:crypto";
import { query } from "../config/database.js";
import { hashPassword } from "../utils/auth.js";

export const createOrganizationTables = async () => {
  await query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'patient';
    CREATE TABLE IF NOT EXISTS organizations (
      id UUID PRIMARY KEY,
      type TEXT NOT NULL CHECK (type IN ('hospital', 'ngo')),
      legal_name TEXT NOT NULL,
      display_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      website TEXT,
      address TEXT,
      state TEXT,
      district TEXT,
      pin_code TEXT,
      description TEXT,
      details JSONB NOT NULL DEFAULT '{}'::jsonb,
      catalog_id UUID,
      verification_status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS organization_members (
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'owner',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (organization_id, user_id)
    )
  `);
  await query("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS catalog_id UUID");
  await query("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS pin_code TEXT");
};

export const findOrganizationByEmail = async (email) => {
  const result = await query("SELECT * FROM organizations WHERE LOWER(email) = LOWER($1)", [email]);
  return result.rows[0] || null;
};

export const createOrganization = async (input, passwordHash) => {
  const userId = randomUUID();
  const organizationId = randomUUID();
  const user = await query(
    `INSERT INTO users (id, full_name, email, mobile, password_hash, account_type, profile_complete)
     VALUES ($1, $2, $3, $4, $5, $6, TRUE)
     RETURNING id, full_name, email, mobile, account_type`,
    [userId, input.contactName, input.email, input.phone || null, passwordHash, input.type]
  );
  const organization = await query(
    `INSERT INTO organizations
      (id, type, legal_name, display_name, email, phone, website, address, state, district, pin_code, description, details)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
    [
      organizationId, input.type, input.legalName, input.displayName, input.email, input.phone || null,
      input.website || null, input.address || null, input.state || null, input.district || null,
      input.pinCode || null, input.description || null, JSON.stringify(input.details || {}),
    ]
  );
  await query(
    "INSERT INTO organization_members (organization_id, user_id, role) VALUES ($1, $2, 'owner')",
    [organizationId, userId]
  );
  return { user: { ...user.rows[0], organization_id: organizationId }, organization: organization.rows[0] };
};

export const findOrganizationLogin = async (email) => {
  const result = await query(
    `SELECT u.*, o.id AS organization_id, o.type, o.legal_name, o.display_name, o.email AS organization_email,
            o.phone, o.website, o.address, o.state, o.district, o.pin_code, o.description, o.details,
            o.verification_status, om.role
     FROM users u
     JOIN organization_members om ON om.user_id = u.id
     JOIN organizations o ON o.id = om.organization_id
     WHERE LOWER(u.email) = LOWER($1) AND u.account_type IN ('hospital', 'ngo')
     LIMIT 1`,
    [email]
  );
  return result.rows[0] || null;
};

export const getOrganization = async (userId) => {
  const result = await query(
    `SELECT o.*, om.role FROM organizations o
     JOIN organization_members om ON om.organization_id = o.id
     WHERE om.user_id = $1 LIMIT 1`,
    [userId]
  );
  return result.rows[0] || null;
};

export const updateOrganization = async (userId, input) => {
  const fields = ["display_name", "legal_name", "phone", "website", "address", "state", "district", "pin_code", "description", "details"];
  const values = fields.map((field) => input[field] ?? null);
  const result = await query(
    `UPDATE organizations o SET
      display_name=$2, legal_name=$3, phone=$4, website=$5, address=$6, state=$7, district=$8,
      pin_code=$9, description=$10, details=$11, updated_at=NOW()
     FROM organization_members om
     WHERE om.organization_id=o.id AND om.user_id=$1
     RETURNING o.*`,
    [userId, ...values.slice(0, -1), JSON.stringify(values[values.length - 1] || {})]
  );
  return result.rows[0] || null;
};

export const seedDemoOrganizations = async () => {
  const demoAccounts = [
    {
      type: "hospital",
      legalName: "Demo Cancer Hospital Private Limited",
      displayName: "Demo Cancer Hospital",
      contactName: "Demo Hospital Admin",
      email: "hospital.demo1@oncosahayak.test",
      password: "Hospital@123",
      phone: "+91 90000 10001",
      website: "https://example.com/demo-cancer-hospital",
      address: "Medical Road, New Delhi",
      state: "Delhi",
      district: "New Delhi",
      description: "Demo hospital partner profile for testing the hospital admin panel.",
      details: {
        specialty: "Medical Oncology",
        departments: ["Medical Oncology", "Surgical Oncology", "Radiation Oncology"],
        facilities: ["24x7 Emergency", "Pharmacy", "Diagnostic Centre"],
        schemes: ["PM-JAY", "Central Government Schemes"],
      },
    },
    {
      type: "hospital",
      legalName: "Acharya Harihar Regional Cancer Centre",
      displayName: "Acharya Harihar Regional Cancer Centre",
      contactName: "Acharya Harihar Hospital Admin",
      email: "acharya.harihar.admin@oncosahayak.test",
      password: "Acharya@123",
      phone: "",
      website: "",
      address: "Cuttack, Odisha",
      state: "Odisha",
      district: "Cuttack",
      description: "Hospital partner account for Acharya Harihar Regional Cancer Centre.",
      details: {
        specialty: "Cancer Care",
        departments: ["Medical Oncology", "Surgical Oncology", "Radiation Oncology"],
        facilities: [],
        schemes: [],
      },
    },
    {
      type: "hospital",
      legalName: "Demo Care Hospital and Research Centre",
      displayName: "Demo Care Hospital",
      contactName: "Demo Care Admin",
      email: "hospital.demo2@oncosahayak.test",
      password: "Hospital@456",
      phone: "+91 90000 10002",
      website: "https://example.com/demo-care-hospital",
      address: "Cancer Care Avenue, Bengaluru",
      state: "Karnataka",
      district: "Bengaluru Urban",
      description: "Demo hospital account with cancer treatment and patient support services.",
      details: {
        specialty: "Cancer Care",
        departments: ["Medical Oncology", "Haematology", "Palliative Care"],
        facilities: ["Day-care Chemotherapy", "Blood Bank", "Counselling"],
        schemes: ["PM-JAY"],
      },
    },
    {
      type: "ngo",
      legalName: "Demo Cancer Support Foundation",
      displayName: "Demo Cancer Support Foundation",
      contactName: "Demo NGO Admin",
      email: "ngo.demo1@oncosahayak.test",
      password: "Ngo@123456",
      phone: "+91 90000 20001",
      website: "https://example.com/demo-cancer-foundation",
      address: "Community Centre, Mumbai",
      state: "Maharashtra",
      district: "Mumbai",
      description: "Demo NGO providing cancer treatment navigation and financial support referrals.",
      details: {
        covers: "Treatment navigation, medicines and financial support referrals",
        coverage: ["Treatment navigation", "Medicine support", "Counselling"],
        eligibility: ["Cancer diagnosis", "Financial assessment"],
        documents: ["Diagnosis report", "Income proof", "Identity proof"],
        howToApply: ["Contact the NGO", "Submit medical records", "Complete assessment"],
      },
    },
    {
      type: "ngo",
      legalName: "Demo Patient Care Trust",
      displayName: "Demo Patient Care Trust",
      contactName: "Demo Trust Admin",
      email: "ngo.demo2@oncosahayak.test",
      password: "Ngo@654321",
      phone: "+91 90000 20002",
      website: "https://example.com/demo-patient-care",
      address: "Patient Support Road, Hyderabad",
      state: "Telangana",
      district: "Hyderabad",
      description: "Demo NGO account supporting families with cancer care coordination and counselling.",
      details: {
        covers: "Counselling, accommodation guidance and hospital coordination",
        coverage: ["Counselling", "Hospital coordination", "Family support"],
        eligibility: ["Cancer patient or caregiver", "Case assessment"],
        documents: ["Medical records", "Identity proof"],
        howToApply: ["Register with the trust", "Share treatment details", "Meet the case worker"],
      },
    },
  ];

  for (const account of demoAccounts) {
    const existing = await query(
      "SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1",
      [account.email]
    );
    if (existing.rowCount > 0) continue;

    const userId = randomUUID();
    const organizationId = randomUUID();
    const passwordHash = await hashPassword(account.password);
    await query(
      `INSERT INTO users (id, full_name, email, mobile, password_hash, account_type, profile_complete)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE)`,
      [userId, account.contactName, account.email, account.phone, passwordHash, account.type]
    );
    await query(
      `INSERT INTO organizations
       (id, type, legal_name, display_name, email, phone, website, address, state, district, description, details, verification_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'verified')`,
      [
        organizationId, account.type, account.legalName, account.displayName, account.email,
        account.phone, account.website, account.address, account.state, account.district,
        account.description, JSON.stringify(account.details),
      ]
    );
    await query(
      "INSERT INTO organization_members (organization_id, user_id, role) VALUES ($1, $2, 'owner')",
      [organizationId, userId]
    );
  }
};
