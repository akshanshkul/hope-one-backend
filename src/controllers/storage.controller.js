import { createDownloadUrl, createUploadUrl } from "../services/storage.service.js";
import { createDocumentRecord } from "../models/document.model.js";

export const presignUpload = async (req, res) => {
  const { fileName, contentType, category } = req.body;
  if (!fileName || !contentType || !["document", "profile"].includes(category)) {
    const error = new Error("fileName, contentType, and a valid category are required");
    error.statusCode = 400;
    throw error;
  }
  const data = await createUploadUrl({
    userId: req.user.id,
    fileName,
    contentType,
    category
  });
  if (category === "document") {
    await createDocumentRecord({
      userId: req.user.id,
      storageKey: data.key,
      name: fileName,
      mimeType: contentType,
      category: "Other",
    });
  }
  res.json({ success: true, data });
};

export const presignDownload = async (req, res) => {
  const key = String(req.query.key || "");
  if (!key.startsWith(`users/${req.user.id}/document/`)) {
    const error = new Error("Invalid document");
    error.statusCode = 400;
    throw error;
  }
  res.json({ success: true, data: { downloadUrl: await createDownloadUrl(key) } });
};
