import { Router } from "express";
import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.routes.js";
import storageRoutes from "./storage.routes.js";
import pushTokenRoutes from "./push-token.routes.js";
import catalogRoutes from "./catalog.routes.js";
import organizationRoutes from "./organization.routes.js";
import partnerRoutes from "./partner.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/storage", storageRoutes);
router.use("/notifications", pushTokenRoutes);
router.use("/catalog", catalogRoutes);
router.use("/organizations", organizationRoutes);
router.use("/partner", partnerRoutes);

export default router;