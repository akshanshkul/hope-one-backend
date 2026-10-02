import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { create, list, remove, update } from "../controllers/partner.controller.js";

const router = Router();
router.use(requireAuth);
router.get("/:resource", asyncHandler(list));
router.post("/:resource", asyncHandler(create));
router.patch("/:resource/:id", asyncHandler(update));
router.delete("/:resource/:id", asyncHandler(remove));
export default router;
