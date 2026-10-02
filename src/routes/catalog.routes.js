import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { hospitals, assistance, catalogOptions } from "../controllers/catalog.controller.js";

const router = Router();
router.get("/hospitals", asyncHandler(hospitals));
router.get("/assistance", asyncHandler(assistance));
router.get("/options", asyncHandler(catalogOptions));
export default router;
