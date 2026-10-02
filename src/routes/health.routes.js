import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
    data: {
      status: "healthy",
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    }
  });
});

export default router;