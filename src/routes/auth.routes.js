import { Router } from "express";
import { finishRegistration, login, profile, register, updateProfileDetails, updateProfileImageDetails, requestContactChangeOtp, verifyContactChangeOtp, requestPasswordResetOtp, verifyPasswordReset, changeForgottenPassword } from "../controllers/auth.controller.js";
import asyncHandler from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));
router.post("/password-reset/request", asyncHandler(requestPasswordResetOtp));
router.post("/password-reset/verify", asyncHandler(verifyPasswordReset));
router.post("/password-reset/change", asyncHandler(changeForgottenPassword));
router.get("/profile", requireAuth, asyncHandler(profile));
router.get("/me", requireAuth, asyncHandler(profile));
router.patch("/profile", requireAuth, asyncHandler(updateProfileDetails));
router.patch("/me", requireAuth, asyncHandler(updateProfileDetails));
router.patch("/profile/image", requireAuth, asyncHandler(updateProfileImageDetails));
router.post("/complete-registration", requireAuth, asyncHandler(finishRegistration));
router.post("/contact-change/request", requireAuth, asyncHandler(requestContactChangeOtp));
router.post("/contact-change/verify", requireAuth, asyncHandler(verifyContactChangeOtp));

export default router;
