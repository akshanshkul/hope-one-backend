export const requireProfileFields = (body) => {
  const required = ["fullName", "mobile", "dateOfBirth", "gender", "address", "state",
    "district", "pinCode", "emergencyContact"];
  const missing = required.filter((field) => !String(body[field] || "").trim());
  if (missing.length) {
    const error = new Error(`Missing required fields: ${missing.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }
  if (body.documentMetadata !== undefined && !Array.isArray(body.documentMetadata)) {
    const error = new Error("documentMetadata must be an array");
    error.statusCode = 400;
    throw error;
  }
};
