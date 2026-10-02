import { Router } from "express";
import { presignDownload, presignUpload } from "../controllers/storage.controller.js";
import asyncHandler from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();
router.post("/presign", requireAuth, asyncHandler(presignUpload));
router.get("/download", requireAuth, asyncHandler(presignDownload));

export default router;
