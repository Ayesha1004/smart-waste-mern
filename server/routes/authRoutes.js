import express from "express";
import { register, login } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

// GET /api/auth/me - lets the frontend rehydrate the session on page refresh
router.get("/me", protect, (req, res) => {
  res.json({ user: req.user });
});

export default router;
