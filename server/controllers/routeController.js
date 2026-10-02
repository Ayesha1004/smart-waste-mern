import Route from "../models/Route.js";
import TrashReport from "../models/TrashReport.js";
import { optimizeRoute } from "../services/routeOptimizer.js";

const DEPOT = { latitude: 24.8607, longitude: 67.0011 }; // Rawalpindi, adjust to your actual depot
const DEPOT_CITY = "Karachi";


/**
 * GET /api/route?city=&status=&wasteType=&page=&pageSize=
 */
export async function getRoutes(req, res) {
  try {
    const { city, status, wasteType, page = 1, pageSize = 20 } = req.query;

    const filter = {};
    if (city) filter.city = city;
    if (status) filter.status = status;
    if (wasteType) filter.wasteType = wasteType;

    const skip = (Number(page) - 1) * Number(pageSize);

    const [routes, total] = await Promise.all([
      Route.find(filter).sort({ creationDate: -1 }).skip(skip).limit(Number(pageSize)),
      Route.countDocuments(filter),
    ]);

    return res.status(200).json({
      routes,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPages: Math.ceil(total / Number(pageSize)),
    });
  } catch (err) {
    console.error("Get routes error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * GET /api/route/:id
 */
export async function getRouteById(req, res) {
  try {
    const route = await Route.findById(req.params.id).populate("stops.reportId");
    if (!route) return res.status(404).json({ message: "Route not found" });
    return res.status(200).json({ route });
  } catch (err) {
    console.error("Get route error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * POST /api/route/optimize
 * Body: { city, wasteType, vehicleCapacity }
 * Fetches all Pending reports matching the filters, runs the optimizer,
 * and saves the result as a new Route.
 */
export async function createOptimizedRoute(req, res) {
  try {
    const { city, wasteType, vehicleCapacity = 0 } = req.body;

    const reportFilter = { status: "Pending" };
    if (city) reportFilter.city = city;
    if (wasteType) reportFilter.wasteType = wasteType;

    const pendingReports = await TrashReport.find(reportFilter);

    if (pendingReports.length === 0) {
      return res.status(400).json({ message: "No pending reports match these filters" });
    }

    const points = pendingReports.map((r) => ({
      latitude: r.latitude,
      longitude: r.longitude,
      city: r.city,
      reportId: r._id,
    }));

    const result = optimizeRoute(points, DEPOT, DEPOT_CITY, Number(vehicleCapacity));

    const route = await Route.create({
      city: city || "Multiple",
      wasteType: wasteType || "",
      status: "Pending",
      totalDistance: result.totalDistance,
      estimatedDuration: result.estimatedTime,
      stops: result.stops.map((s, i) => ({
        sequence: i + 1,
        latitude: s.latitude,
        longitude: s.longitude,
        city: s.city,
        reportId: s.reportId,
      })),
    });

    return res.status(201).json({ route });
  } catch (err) {
    console.error("Create optimized route error:", err);
    return res.status(500).json({ message: "Failed to optimize route", error: err.message });
  }
}

const VALID_TRANSITIONS = {
  Pending: ["InProgress", "Completed", "Archived"],
  InProgress: ["Completed", "Pending"],
  Completed: ["Pending", "InProgress", "Archived"],
  Archived: ["Pending"],
};

/**
 * PUT /api/route/:id/status
 */
export async function updateRouteStatus(req, res) {
  try {
    const { status } = req.body;
    const route = await Route.findById(req.params.id);
    if (!route) return res.status(404).json({ message: "Route not found" });

    if (!VALID_TRANSITIONS[route.status]?.includes(status)) {
      return res.status(400).json({ message: `Invalid status transition from ${route.status} to ${status}` });
    }

    route.status = status;
    await route.save();

    return res.status(200).json({ route });
  } catch (err) {
    console.error("Update route status error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * GET /api/route/stats
 */
export async function getRouteStats(req, res) {
  try {
    const [total, byStatus] = await Promise.all([
      Route.countDocuments(),
      Route.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    ]);

    const statusCounts = { Pending: 0, InProgress: 0, Completed: 0, Archived: 0 };
    byStatus.forEach((s) => {
      statusCounts[s._id] = s.count;
    });

    return res.status(200).json({ total, byStatus: statusCounts });
  } catch (err) {
    console.error("Get route stats error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
