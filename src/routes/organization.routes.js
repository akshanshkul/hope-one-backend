import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { login, profile, register, updateProfile } from "../controllers/organization.controller.js";

const router = Router();
router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));
router.get("/profile", requireAuth, asyncHandler(profile));
router.patch("/profile", requireAuth, asyncHandler(updateProfile));
export default router;
