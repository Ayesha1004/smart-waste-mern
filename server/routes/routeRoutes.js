import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  getRoutes,
  getRouteById,
  createOptimizedRoute,
  updateRouteStatus,
  getRouteStats,
} from "../controllers/routeController.js";

const router = express.Router();

// Route management is an admin-only capability — same pattern as adminRoutes.js
router.use(protect, authorize("admin"));

router.get("/", getRoutes);
router.get("/stats", getRouteStats);
router.get("/:id", getRouteById);
router.post("/optimize", createOptimizedRoute);
router.put("/:id/status", updateRouteStatus);

export default router;
