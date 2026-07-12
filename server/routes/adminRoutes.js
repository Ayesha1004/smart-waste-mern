import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  adminGetAllUsers,
  adminGetUserById,
  adminUpdateUser,
  adminDeleteUser,
} from "../controllers/userController.js";

const router = express.Router();

// Every route below requires a valid token AND the "admin" role
router.use(protect, authorize("admin"));

router.get("/users", adminGetAllUsers);
router.get("/users/:id", adminGetUserById);
router.put("/users/:id", adminUpdateUser);
router.delete("/users/:id", adminDeleteUser);

// Module 3 will add: GET/PUT/DELETE /api/admin/reports
// Module 5 will add: GET /api/admin/dashboard-stats

export default router;
