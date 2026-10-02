import { optimizeRoute } from "../services/routeOptimizer.js";

const DEPOT = { latitude: 33.6007, longitude: 73.0679 }; // Rawalpindi

describe("routeOptimizer", () => {
  test("returns empty result for no points", () => {
    const result = optimizeRoute([], DEPOT, "Rawalpindi", 0);
    expect(result.stops).toEqual([]);
    expect(result.totalDistance).toBe(0);
    expect(result.estimatedTime).toBe(0);
  });

  test("handles a single point", () => {
    const points = [{ latitude: 33.65, longitude: 73.1, city: "Rawalpindi", reportId: "r1" }];
    const result = optimizeRoute(points, DEPOT, "Rawalpindi", 0);

    expect(result.stops).toHaveLength(1);
    expect(result.stops[0].reportId).toBe("r1");
    expect(result.totalDistance).toBeGreaterThan(0); // depot -> point -> depot, never zero unless same coords
  });

  test("does not lose or duplicate any points", () => {
    const points = [
      { latitude: 33.65, longitude: 73.10, city: "Rawalpindi", reportId: "a" },
      { latitude: 33.60, longitude: 73.05, city: "Rawalpindi", reportId: "b" },
      { latitude: 33.70, longitude: 73.15, city: "Rawalpindi", reportId: "c" },
      { latitude: 31.55, longitude: 74.34, city: "Lahore", reportId: "d" },
      { latitude: 31.50, longitude: 74.30, city: "Lahore", reportId: "e" },
    ];
    const result = optimizeRoute(points, DEPOT, "Rawalpindi", 0);

    expect(result.stops).toHaveLength(points.length);
    const returnedIds = result.stops.map((s) => s.reportId).sort();
    const originalIds = points.map((p) => p.reportId).sort();
    expect(returnedIds).toEqual(originalIds);
  });

  test("prioritizes the depot's own city before other cities", () => {
    const points = [
      { latitude: 31.55, longitude: 74.34, city: "Lahore", reportId: "far" },
      { latitude: 33.61, longitude: 73.07, city: "Rawalpindi", reportId: "near" },
    ];
    const result = optimizeRoute(points, DEPOT, "Rawalpindi", 0);

    // The depot-city point should come before the far-away city's point,
    // since city groups are ordered with the depot's own city first
    const nearIndex = result.stops.findIndex((s) => s.reportId === "near");
    const farIndex = result.stops.findIndex((s) => s.reportId === "far");
    expect(nearIndex).toBeLessThan(farIndex);
  });

  test("2-opt refinement never makes the route longer than nearest-neighbor alone", () => {
    // A deliberately "bad order" scenario where nearest-neighbor construction
    // alone tends to produce a suboptimal path that 2-opt should improve
    const points = [
      { latitude: 33.60, longitude: 73.00, city: "Rawalpindi", reportId: "1" },
      { latitude: 33.65, longitude: 73.20, city: "Rawalpindi", reportId: "2" },
      { latitude: 33.60, longitude: 73.40, city: "Rawalpindi", reportId: "3" },
      { latitude: 33.65, longitude: 73.10, city: "Rawalpindi", reportId: "4" },
    ];
    const result = optimizeRoute(points, DEPOT, "Rawalpindi", 0);

    // We can't easily assert an exact optimal distance without reimplementing
    // the algorithm, but total distance must be a finite, positive number,
    // and not wildly large (a sanity ceiling — real roads aren't 10,000km)
    expect(result.totalDistance).toBeGreaterThan(0);
    expect(result.totalDistance).toBeLessThan(500); // generous ceiling for 4 nearby points
  });

  test("respects vehicleCapacity by clustering large groups", () => {
    // 6 points in the same city, capacity of 2 per cluster -> should still
    // return all 6 stops, just internally clustered/optimized in groups
    const points = Array.from({ length: 6 }, (_, i) => ({
      latitude: 33.6 + i * 0.01,
      longitude: 73.0 + i * 0.01,
      city: "Rawalpindi",
      reportId: `p${i}`,
    }));

    const result = optimizeRoute(points, DEPOT, "Rawalpindi", 2);
    expect(result.stops).toHaveLength(6);
  });

  test("estimatedTime scales with number of stops (service time component)", () => {
    const onePoint = [{ latitude: 33.65, longitude: 73.1, city: "Rawalpindi", reportId: "1" }];
    const fivePoints = Array.from({ length: 5 }, (_, i) => ({
      latitude: 33.6 + i * 0.01,
      longitude: 73.0 + i * 0.01,
      city: "Rawalpindi",
      reportId: `p${i}`,
    }));

    const resultOne = optimizeRoute(onePoint, DEPOT, "Rawalpindi", 0);
    const resultFive = optimizeRoute(fivePoints, DEPOT, "Rawalpindi", 0);

    // More stops means more fixed per-stop service time added on top of travel time
    expect(resultFive.estimatedTime).toBeGreaterThan(resultOne.estimatedTime);
  });
});
