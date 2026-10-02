import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import TrashReport from "../models/TrashReport.js";
import Route from "../models/Route.js";
import { extractGpsCoordinates } from "../services/exifService.js";
import { getCityFromCoordinates } from "../services/geocodingService.js";
import { classifyWaste } from "../services/aiClassifierService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * POST /api/trashreport/extract-coordinates
 * Lightweight pre-check used by the frontend right after a photo is
 * selected, BEFORE the user hits submit — lets the map pin auto-place
 * from EXIF immediately, without saving anything yet.
 */
export async function extractCoordinates(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const gps = await extractGpsCoordinates(req.file.buffer);

    return res.status(200).json({
      hasCoordinates: !!gps,
      latitude: gps?.latitude ?? null,
      longitude: gps?.longitude ?? null,
    });
  } catch (err) {
    console.error("Extract coordinates error:", err);
    return res.status(500).json({ message: "Failed to extract coordinates" });
  }
}

/**
 * POST /api/trashreport/upload
 * The real submission endpoint — runs the full pipeline:
 * save file -> classify -> geocode -> persist.
 * Expects: multipart file field "image", plus body fields
 * description, latitude, longitude, hasGpsData (the frontend sends back
 * whatever position the pin ended up at, whether auto-detected or
 * manually placed by the user).
 */
export async function uploadReport(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const { description, latitude, longitude, hasGpsData } = req.body;
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ message: "A valid location is required" });
    }

    // Save the file to disk now that we know the upload is going through
    const ext = path.extname(req.file.originalname) || ".jpg";
    const filename = `${crypto.randomUUID()}${ext}`;
    fs.writeFileSync(path.join(UPLOADS_DIR, filename), req.file.buffer);
    const imageUrl = `/uploads/${filename}`;

    // Run AI classification and reverse geocoding in parallel — independent
    // of each other, no reason to wait for one before starting the other
    const [classification, city] = await Promise.all([
      classifyWaste(req.file.buffer),
      getCityFromCoordinates(lat, lng),
    ]);

    const report = await TrashReport.create({
      userId: req.user._id,
      imageUrl,
      description: description || "",
      wasteType: classification.wasteType,
      aiConfidence: classification.confidence,
      needsReview: classification.needsReview,
      latitude: lat,
      longitude: lng,
      city,
      hasGpsData: hasGpsData === "true" || hasGpsData === true,
      status: "Pending",
    });

    return res.status(201).json({
      report,
      classification: {
        wasteType: classification.wasteType,
        confidence: classification.confidence,
        needsReview: classification.needsReview,
        allPredictions: classification.allPredictions,
      },
    });
  } catch (err) {
    console.error("Upload report error:", err);
    return res.status(500).json({ message: "Failed to submit report", error: err.message });
  }
}

/**
 * GET /api/trashreport/mine
 * Current user's own reports, newest first. Optional ?status= filter.
 */
export async function getMyReports(req, res) {
  try {
    const filter = { userId: req.user._id };
    if (req.query.status) filter.status = req.query.status;

    const reports = await TrashReport.find(filter).sort({ reportedAt: -1 });
    return res.status(200).json({ reports });
  } catch (err) {
    console.error("Get my reports error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * GET /api/trashreport/:id
 * A single report — only its owner can view it (admins get their own
 * unrestricted view in Module 5).
 */
export async function getReportById(req, res) {
  try {
    const report = await TrashReport.findOne({ _id: req.params.id, userId: req.user._id });
    if (!report) return res.status(404).json({ message: "Report not found" });
    return res.status(200).json({ report });
  } catch (err) {
    console.error("Get report error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * DELETE /api/trashreport/:id
 * Only pending reports can be deleted — same rule as the original .NET
 * version: once a report is InProgress/Completed, it's part of the
 * historical record and shouldn't disappear.
 */
export async function deleteReport(req, res) {
  try {
    const report = await TrashReport.findOne({ _id: req.params.id, userId: req.user._id });
    if (!report) return res.status(404).json({ message: "Report not found" });

    if (report.status !== "Pending") {
      return res.status(400).json({ message: "Only pending reports can be deleted" });
    }

    // Best-effort image cleanup — don't fail the whole delete if this errors
    try {
      const filePath = path.join(UPLOADS_DIR, path.basename(report.imageUrl));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (fileErr) {
      console.warn("Could not delete image file:", fileErr.message);
    }

    await report.deleteOne();
    return res.status(204).send();
  } catch (err) {
    console.error("Delete report error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

const VALID_TRANSITIONS = {
  Pending: ["InProgress", "Completed"],
  InProgress: ["Completed", "Pending"],
  Completed: ["Pending", "InProgress"],
};

function determineRouteStatusFromReports(reportStatuses) {
  if (reportStatuses.every((s) => s === "Completed")) return "Completed";
  if (reportStatuses.some((s) => s === "InProgress")) return "InProgress";
  if (reportStatuses.every((s) => s === "Pending")) return "Pending";
  return "InProgress"; // mixed pending/completed -> treat as in progress
}

async function cascadeStatusToRoute(reportId, newReportStatus) {
  // Find a route that contains this report among its stops
  const route = await Route.findOne({ "stops.reportId": reportId }).populate("stops.reportId");
  if (!route) return; // this report isn't part of any route yet — nothing to cascade

  const statuses = route.stops.map((stop) =>
    String(stop.reportId._id) === String(reportId) ? newReportStatus : stop.reportId.status
  );

  const newRouteStatus = determineRouteStatusFromReports(statuses);

  if (route.status !== newRouteStatus) {
    route.status = newRouteStatus;
    await route.save();
  }
}

/**
 * PUT /api/trashreport/:id/status
 * NOTE: this does not yet cascade to a parent Route's status — that
 * cascade logic gets added once the Route model exists in Module 4.
 * For now this only updates the report itself.
 */
export async function updateReportStatus(req, res) {
  try {
    const { status } = req.body;
    const report = await TrashReport.findOne({ _id: req.params.id, userId: req.user._id });
    if (!report) return res.status(404).json({ message: "Report not found" });

    if (!VALID_TRANSITIONS[report.status]?.includes(status)) {
      return res.status(400).json({ message: `Invalid status transition from ${report.status} to ${status}` });
    }

    report.status = status;
    await report.save();

    // NEW: cascade this change to the parent route's status, if it belongs to one
    await cascadeStatusToRoute(report._id, status);

    return res.status(200).json({ report });
  } catch (err) {
    console.error("Update report status error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
export async function adminGetAllReports(req, res) {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.needsReview === "true") filter.needsReview = true;

    const reports = await TrashReport.find(filter)
      .sort({ reportedAt: -1 })
      .populate("userId", "fullName email"); // shows who reported it, not just an ID

    return res.status(200).json({ reports, total: reports.length });
  } catch (err) {
    console.error("Admin get all reports error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * PUT /api/admin/reports/:id/correct
 * The feedback-loop piece: lets an admin overwrite the AI's guess with the
 * real waste type. Marks wasLabelCorrected so these are easy to query later
 * as retraining candidates.
 */
export async function adminCorrectReportLabel(req, res) {
  try {
    const { wasteType } = req.body;
    const report = await TrashReport.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });

    report.wasteType = wasteType;
    report.needsReview = false; // an admin has now confirmed the correct label
    report.wasLabelCorrected = true;

    await report.save();
    return res.status(200).json({ report });
  } catch (err) {
    console.error("Admin correct report error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * DELETE /api/admin/reports/:id
 * Unlike the user-facing delete (Module 3), admins can delete a report
 * regardless of its status.
 */
export async function adminDeleteReport(req, res) {
  try {
    const report = await TrashReport.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });

    await report.deleteOne();
    return res.status(204).send();
  } catch (err) {
    console.error("Admin delete report error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

