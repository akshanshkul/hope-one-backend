import { randomUUID } from "node:crypto";
import { query } from "../config/database.js";
import { listAssistancePrograms } from "../models/assistance.model.js";
import { listHospitals } from "../models/hospital.model.js";
import { listCatalogOptions } from "../models/catalog-option.model.js";
import { spreadsheetHospitals } from "../data/hospital-seed.js";

const hospitals = [
  {
    name: "KCGMC Hospital", kind: "Government", city: "Kaithal, Haryana", pin: "136027",
    address: "Maharaja Agrasen Road, Kaithal, Haryana - 136027", distance: "2.4 km away",
    driveTime: "12 mins", rating: "4.5", reviews: 120, specialty: "Medical Oncology",
    reviewItems: [
      { name: "Meena R.", rating: 5, date: "2 weeks ago", text: "The oncology team explained every step clearly and treated our family with compassion." },
      { name: "Rahul S.", rating: 4, date: "1 month ago", text: "Affordable treatment and helpful staff. The waiting time can be long on busy days." },
    ],
    cost: "₹35,000+", tagline: "Advanced Care. A Brighter Tomorrow.", photoCount: 5, years: "20+",
    about: "Government medical institute providing affordable cancer care.",
    departments: ["Medical Oncology", "Surgical Oncology", "Radiation Therapy", "Pathology"],
    specialties: [], costs: [
      { label: "Consultation", value: "₹500 – 1,000" },
      { label: "Chemotherapy", note: "per cycle", value: "₹10,000 – 25,000" },
      { label: "Surgery", note: "major", value: "₹1,50,000 – 3,00,000" }
    ], doctors: [
      { name: "Dr. A. Verma", role: "Medical Oncologist", exp: "14 yrs experience" },
      { name: "Dr. S. Kaushik", role: "Surgical Oncologist", exp: "11 yrs experience" },
      { name: "Dr. P. Rana", role: "Radiation Oncologist", exp: "9 yrs experience" },
    ], facilities: ["24x7 Emergency", "In-house Pharmacy", "Ambulance Service"],
    schemes: ["PM-JAY (Ayushman Bharat)", "State Government Schemes"], phone: "+91 1746 000000"
  },
  {
    name: "Civil Hospital, Kaithal", kind: "Government", city: "Kaithal, Haryana", pin: "136027",
    address: "Civil Lines, Kaithal, Haryana - 136027", distance: "12 km away", driveTime: "24 mins",
    rating: "4.5", reviews: 120, specialty: "Cancer Care", cost: "₹28,000+",
    tagline: "Care Within Reach.", photoCount: 4, years: "35+",
    about: "Affordable cancer treatment with modern facilities and experienced doctors.",
    departments: ["Medical Oncology", "General Surgery", "Radiology", "Palliative Care"],
    specialties: [], costs: [{ label: "Chemotherapy", value: "₹8,000 – 20,000" }],
    doctors: [
      { name: "Dr. Neha Kapoor", role: "Medical Oncologist", exp: "16 yrs experience" },
      { name: "Dr. Arjun Malik", role: "Surgical Oncologist", exp: "12 yrs experience" },
    ], reviewItems: [
      { name: "Suresh K.", rating: 5, date: "3 weeks ago", text: "The doctors are patient, practical and very supportive during treatment." },
      { name: "Pooja D.", rating: 4, date: "2 months ago", text: "Good cancer care facilities and reasonable consultation charges." },
    ], facilities: ["24x7 Emergency", "Blood Bank"], schemes: ["PM-JAY (Ayushman Bharat)"],
    phone: "+91 1746 111111"
  }
];

const assistance = [
  {
    name: "Tata Trusts Cancer Care", kind: "Trust", kindLabel: "NGO",
    summary: "Financial assistance for cancer treatment, medicines and supportive care.",
    region: "Pan India (Supports Haryana)", covers: "Treatment cost, Medicines, Surgery",
    amountLabel: "Financial Support", amount: "Up to ₹5,00,000",
    about: "Cancer treatment support assessed case by case through partner hospitals.",
    coverage: ["Chemotherapy and radiation", "Surgery and hospitalisation", "Medicines"],
    eligibility: ["Confirmed cancer diagnosis", "Low household income", "Recognised hospital"],
    documents: ["Diagnosis report", "Hospital estimate", "Income proof", "Identity proof"],
    howToApply: ["Collect medical records", "Apply through the hospital social worker", "Await verification"],
    processingTime: "3-6 weeks", phone: "+91 22 6665 8282", website: "tatatrusts.org"
  },
  {
    name: "Ayushman Bharat (PM-JAY)", kind: "Government", kindLabel: "Government",
    summary: "Government health assurance covering eligible cancer treatment.",
    region: "Applicable across India", covers: "Cashless treatment in empanelled hospitals",
    amountLabel: "Coverage", amount: "Up to ₹5,00,000",
    about: "Cashless treatment at empanelled public and private hospitals.",
    coverage: ["Hospitalisation", "Chemotherapy", "Radiation and surgery"],
    eligibility: ["Eligible family list", "Verified Ayushman card"],
    documents: ["Ayushman card", "Aadhaar card", "Ration card"],
    howToApply: ["Check eligibility", "Visit an Ayushman Mitra desk", "Complete verification"],
    processingTime: "Same day", phone: "14555", website: "pmjay.gov.in"
  },
  {
    name: "Health Minister's Cancer Patient Fund",
    kind: "Government",
    kindLabel: "Central Government",
    summary: "Financial assistance for eligible low-income cancer patients receiving treatment at recognised hospitals.",
    region: "Applicable across India",
    covers: "Cancer treatment, surgery, chemotherapy and radiotherapy",
    amountLabel: "Financial Support",
    amount: "Up to ₹5,00,000",
    about: "Support is provided through the Rashtriya Arogya Nidhi framework for eligible patients who meet the income and treatment conditions.",
    coverage: ["Cancer surgery", "Chemotherapy", "Radiotherapy", "Hospitalisation"],
    eligibility: ["Indian citizen", "Low-income family", "Treatment at an eligible government or recognised hospital"],
    documents: ["Aadhaar or government ID", "Income certificate", "Cancer diagnosis report", "Hospital estimate", "Bank details"],
    howToApply: ["Ask the hospital social worker for the RAN application", "Attach medical and income documents", "Submit the application through the recognised hospital", "Wait for government verification"],
    processingTime: "Subject to government verification",
    phone: "1800 180 1203",
    website: "mohfw.gov.in"
  },
  {
    name: "Rashtriya Arogya Nidhi",
    kind: "Government",
    kindLabel: "Central Government",
    summary: "Support for major and life-threatening illnesses for patients who cannot afford treatment.",
    region: "Applicable across India",
    covers: "Eligible treatment expenses at government hospitals",
    amountLabel: "Medical Assistance",
    amount: "Case-based support",
    about: "Rashtriya Arogya Nidhi provides assistance through eligible government hospitals after review of the patient's medical and financial circumstances.",
    coverage: ["Cancer treatment", "Major surgery", "Specialist treatment", "Medicines linked to approved treatment"],
    eligibility: ["Financially disadvantaged patient", "Treatment in an eligible government hospital", "Medical recommendation and income proof"],
    documents: ["Medical certificate", "Income certificate", "Identity proof", "Hospital estimate", "Treatment plan"],
    howToApply: ["Contact the hospital welfare office", "Complete the prescribed application", "Submit medical and financial proof", "Follow the application status through the hospital"],
    processingTime: "Subject to case review",
    phone: "011 2306 1296",
    website: "mohfw.gov.in"
  },
  {
    name: "Central Government Health Scheme",
    kind: "Government",
    kindLabel: "Central Government",
    summary: "Healthcare and referral support for eligible central government employees, pensioners and dependants.",
    region: "CGHS-covered cities across India",
    covers: "Consultation, medicines, investigations and empanelled treatment",
    amountLabel: "Healthcare Coverage",
    amount: "As per CGHS rules",
    about: "CGHS beneficiaries can access covered services through wellness centres and empanelled hospitals according to applicable scheme rules.",
    coverage: ["Specialist consultation", "Diagnostic investigations", "Medicines", "Empanelled hospital treatment"],
    eligibility: ["Valid CGHS beneficiary card", "Central government employee, pensioner or eligible dependant"],
    documents: ["CGHS card", "Government ID", "Referral or medical records", "Hospital documents"],
    howToApply: ["Visit the assigned CGHS wellness centre", "Obtain a referral where required", "Use a CGHS empanelled hospital", "Submit claims according to CGHS rules"],
    processingTime: "Depends on referral and claim type",
    phone: "1800 208 8900",
    website: "cghs.mohfw.gov.in"
  },
  {
    name: "CanKids KidsCan",
    kind: "NGO",
    kindLabel: "NGO",
    summary: "Support for children with cancer and their families, including treatment navigation and financial assistance referrals.",
    region: "Pan India through hospital partnerships",
    covers: "Treatment support, accommodation, counselling and family assistance",
    amountLabel: "Patient Support",
    amount: "Case-based support",
    about: "CanKids works with families and treatment centres to help children access cancer care and practical support during treatment.",
    coverage: ["Treatment navigation", "Family counselling", "Accommodation support", "Financial assistance referrals"],
    eligibility: ["Child diagnosed with cancer", "Treatment at a partner or recognised centre", "Family assessment by the support team"],
    documents: ["Diagnosis report", "Child identity proof", "Parent or guardian ID", "Hospital estimate", "Income documents"],
    howToApply: ["Ask the hospital social worker for a CanKids referral", "Share the child's medical records", "Complete the family assessment", "Follow the support plan with the case worker"],
    processingTime: "Case dependent",
    phone: "+91 11 4104 7744",
    website: "cankidsindia.org"
  },
  {
    name: "Cuddles Foundation",
    kind: "NGO",
    kindLabel: "NGO",
    summary: "Nutrition support and counselling for children receiving cancer treatment.",
    region: "Partner hospitals across India",
    covers: "Nutrition assessment, food support and counselling",
    amountLabel: "Nutrition Support",
    amount: "Based on patient assessment",
    about: "Cuddles Foundation supports children with cancer through hospital-based nutrition programmes and family counselling.",
    coverage: ["Nutrition assessment", "Food support", "Diet counselling", "Family education"],
    eligibility: ["Child receiving cancer treatment", "Available through a participating hospital", "Assessment by the hospital nutrition team"],
    documents: ["Diagnosis report", "Hospital registration", "Child identity proof", "Parent or guardian ID"],
    howToApply: ["Ask the treating hospital about the Cuddles programme", "Meet the hospital nutritionist", "Complete the nutrition assessment", "Follow the recommended support plan"],
    processingTime: "During hospital assessment",
    phone: "+91 22 4897 7777",
    website: "cuddlesfoundation.org"
  }
];

const options = {
  income: [
    "Below ₹1,00,000", "₹1,00,000 – ₹3,00,000", "₹3,00,000 – ₹5,00,000",
    "₹5,00,000 – ₹8,00,000", "Above ₹8,00,000", "Prefer not to say"
  ],
  rationCard: ["BPL (Below Poverty Line)", "AAY (Antyodaya)", "APL (Above Poverty Line)", "No ration card"],
  insurance: ["Yes — PM-JAY / Ayushman Bharat", "Yes — private insurance", "No", "Not sure"],
  gender: ["Male", "Female", "Other", "Prefer not to say"],
  cancerStage: ["Stage 0", "Stage I", "Stage II", "Stage III", "Stage IV", "Not staged / Unknown"]
};

export const seedCatalog = async () => {
  for (const item of [...hospitals, ...spreadsheetHospitals]) {
    const existing = await query("SELECT 1 FROM hospitals WHERE name = $1 LIMIT 1", [item.name]);
    if (existing.rowCount === 0) {
      await query(
        `INSERT INTO hospitals
         (id,name,kind,city,pin,address,distance,drive_time,rating,reviews,review_items,specialty,cost,tagline,photo_count,years,about,departments,specialties,costs,doctors,facilities,schemes,phone)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)`,
        [randomUUID(), item.name, item.kind, item.city, item.pin, item.address, item.distance, item.driveTime,
          item.rating, item.reviews, JSON.stringify(item.reviewItems || []), item.specialty, item.cost, item.tagline, item.photoCount, item.years,
          item.about, JSON.stringify(item.departments), JSON.stringify(item.specialties), JSON.stringify(item.costs),
          JSON.stringify(item.doctors), JSON.stringify(item.facilities), JSON.stringify(item.schemes), item.phone]
      );
    }
  }
  for (const item of hospitals) {
    await query(
      "UPDATE hospitals SET doctors = $2, review_items = $3, reviews = $4 WHERE name = $1",
      [item.name, JSON.stringify(item.doctors), JSON.stringify(item.reviewItems || []), item.reviews]
    );
  }
  for (const item of spreadsheetHospitals) {
    if (Array.isArray(item.doctors) && item.doctors.length > 0) {
      await query(
        "UPDATE hospitals SET doctors = $2 WHERE name = $1",
        [item.name, JSON.stringify(item.doctors)]
      );
    }
  }
  for (const item of assistance) {
    const existing = await query("SELECT 1 FROM assistance_programs WHERE name = $1 LIMIT 1", [item.name]);
    if (existing.rowCount === 0) {
      await query(
        `INSERT INTO assistance_programs
         (id,name,kind,kind_label,summary,region,covers,amount_label,amount,about,coverage,eligibility,documents,how_to_apply,processing_time,phone,website)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        [randomUUID(), item.name, item.kind, item.kindLabel, item.summary, item.region, item.covers,
          item.amountLabel, item.amount, item.about, JSON.stringify(item.coverage), JSON.stringify(item.eligibility),
          JSON.stringify(item.documents), JSON.stringify(item.howToApply), item.processingTime, item.phone, item.website]
      );
    }
  }
  for (const [category, values] of Object.entries(options)) {
    for (const [sortOrder, value] of values.entries()) {
      await query(
        `INSERT INTO catalog_options (id, category, value, sort_order)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (category, value) DO NOTHING`,
        [randomUUID(), category, value, sortOrder]
      );
    }
  }
};

export { listHospitals, listAssistancePrograms, listCatalogOptions };
