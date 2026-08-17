import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { uploadImage } from "../middleware/uploadMiddleware.js";
import {
  extractCoordinates,
  uploadReport,
  getMyReports,
  getReportById,
  deleteReport,
  updateReportStatus,
} from "../controllers/trashReportController.js";

const router = express.Router();

router.use(protect); // every route below requires a logged-in user (any role)

router.post("/extract-coordinates", uploadImage.single("image"), extractCoordinates);
router.post("/upload", uploadImage.single("image"), uploadReport);
router.get("/mine", getMyReports);
router.get("/:id", getReportById);
router.delete("/:id", deleteReport);
router.put("/:id/status", updateReportStatus);

export default router;
