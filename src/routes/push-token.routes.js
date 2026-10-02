import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";
import { register, unregister } from "../controllers/push-token.controller.js";

const router = Router();

router.post("/tokens", requireAuth, asyncHandler(register));
router.delete("/tokens", requireAuth, asyncHandler(unregister));

export default router;
