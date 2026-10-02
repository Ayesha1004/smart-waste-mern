const AVG_SPEED_KMH = 30; // 30 km/h average collection-vehicle speed
const SERVICE_TIME_PER_STOP = 2; // minutes per stop

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Haversine distance between two lat/lng points, in km.
 * Direct port of RouteOptimizer.cs's CalculateDistance.
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculateTotalDistance(route, depot) {
  if (route.length === 0) return 0;

  let distance = calculateDistance(depot.latitude, depot.longitude, route[0].latitude, route[0].longitude);
  for (let i = 1; i < route.length; i++) {
    distance += calculateDistance(
      route[i - 1].latitude,
      route[i - 1].longitude,
      route[i].latitude,
      route[i].longitude
    );
  }
  distance += calculateDistance(
    route[route.length - 1].latitude,
    route[route.length - 1].longitude,
    depot.latitude,
    depot.longitude
  );
  return distance;
}

function calculateEstimatedTime(route, depot) {
  const distance = calculateTotalDistance(route, depot);
  const travelTime = (distance / AVG_SPEED_KMH) * 60;
  const serviceTime = route.length * SERVICE_TIME_PER_STOP;
  return travelTime + serviceTime;
}

/**
 * Greedy nearest-neighbor construction — starts at the depot, repeatedly
 * jumps to whichever remaining point is closest to the current position.
 */
function nearestNeighbor(points, depot) {
  const optimizedOrder = [];
  const remaining = [...points];
  let currentLocation = depot;

  while (remaining.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const d = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        remaining[i].latitude,
        remaining[i].longitude
      );
      if (d < nearestDistance) {
        nearestDistance = d;
        nearestIndex = i;
      }
    }

    const nearest = remaining[nearestIndex];
    optimizedOrder.push(nearest);
    remaining.splice(nearestIndex, 1);
    currentLocation = { latitude: nearest.latitude, longitude: nearest.longitude };
  }

  return optimizedOrder;
}

function swap2Opt(route, i, k) {
  const before = route.slice(0, i);
  const reversed = route.slice(i, k + 1).reverse();
  const after = route.slice(k + 1);
  return [...before, ...reversed, ...after];
}

/**
 * 2-opt refinement — repeatedly tries reversing segments of the route to
 * see if it shortens the total distance, until no improvement is found.
 */
function apply2Opt(initialRoute, depot) {
  let route = initialRoute;
  let bestDistance = calculateTotalDistance(route, depot);
  let improved = true;

  while (improved) {
    improved = false;
    for (let i = 1; i < route.length - 1; i++) {
      for (let k = i + 1; k < route.length; k++) {
        const newRoute = swap2Opt(route, i, k);
        const newDistance = calculateTotalDistance(newRoute, depot);

        if (newDistance < bestDistance) {
          route = newRoute;
          bestDistance = newDistance;
          improved = true;
        }
      }
    }
  }

  return route;
}

function calculateCityCenterDistance(cityPoints, depot) {
  if (cityPoints.length === 0) return Infinity;
  const avgLat = cityPoints.reduce((sum, p) => sum + p.latitude, 0) / cityPoints.length;
  const avgLon = cityPoints.reduce((sum, p) => sum + p.longitude, 0) / cityPoints.length;
  return calculateDistance(depot.latitude, depot.longitude, avgLat, avgLon);
}

function clusterPointsByProximity(points, depot, capacity) {
  const sorted = [...points].sort(
    (a, b) =>
      calculateDistance(depot.latitude, depot.longitude, a.latitude, a.longitude) -
      calculateDistance(depot.latitude, depot.longitude, b.latitude, b.longitude)
  );

  const clusters = [];
  for (let i = 0; i < sorted.length; i += capacity) {
    clusters.push(sorted.slice(i, i + capacity));
  }
  return clusters;
}

function optimizeCityCluster(points, depot) {
  let route = nearestNeighbor(points, depot);
  route = apply2Opt(route, depot);

  return {
    stops: route,
    totalDistance: calculateTotalDistance(route, depot),
    estimatedTime: calculateEstimatedTime(route, depot),
  };
}

/**
 * Main entry point. points: [{ latitude, longitude, city, reportId }, ...]
 * depot: { latitude, longitude }
 * depotCity: string — points in this city are prioritized first
 * vehicleCapacity: max stops per vehicle/cluster (0 or undefined = unlimited)
 */
export function optimizeRoute(points, depot, depotCity = "Rawalpindi", vehicleCapacity = 0) {
  if (!points || points.length === 0) {
    return { stops: [], totalDistance: 0, estimatedTime: 0 };
  }

  // Group by city, prioritizing the depot's own city first, then by distance
  const grouped = {};
  for (const p of points) {
    const city = p.city || "Unknown";
    if (!grouped[city]) grouped[city] = [];
    grouped[city].push(p);
  }

  const cityGroups = Object.entries(grouped).sort(([cityA, pointsA], [cityB, pointsB]) => {
    if (cityA === depotCity && cityB !== depotCity) return -1;
    if (cityB === depotCity && cityA !== depotCity) return 1;
    return calculateCityCenterDistance(pointsA, depot) - calculateCityCenterDistance(pointsB, depot);
  });

  const optimizedClusters = [];

  for (const [, cityPoints] of cityGroups) {
    const clusters =
      vehicleCapacity > 0 && cityPoints.length > vehicleCapacity
        ? clusterPointsByProximity(cityPoints, depot, vehicleCapacity)
        : [cityPoints];

    for (const cluster of clusters) {
      optimizedClusters.push(optimizeCityCluster(cluster, depot));
    }
  }

  // Combine all clusters into one final result
  return {
    stops: optimizedClusters.flatMap((c) => c.stops),
    totalDistance: optimizedClusters.reduce((sum, c) => sum + c.totalDistance, 0),
    estimatedTime: optimizedClusters.reduce((sum, c) => sum + c.estimatedTime, 0),
  };
}
