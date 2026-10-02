import { useEffect, useState } from "react";
import api from "../../services/api";
import RouteMap from "../../components/RouteMap";

export default function ManageRoutes() {
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({ city: "", status: "", wasteType: "" });
  const [optimizing, setOptimizing] = useState(false);

  async function loadRoutes() {
    setLoading(true);
    try {
      const params = {};
      if (filters.city) params.city = filters.city;
      if (filters.status) params.status = filters.status;
      if (filters.wasteType) params.wasteType = filters.wasteType;

      const res = await api.get("/route", { params });
      setRoutes(res.data.routes);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load routes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRoutes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleOptimize() {
    setOptimizing(true);
    setError(null);
    try {
      const res = await api.post("/route/optimize", {
        city: filters.city || undefined,
        wasteType: filters.wasteType || undefined,
      });
      setRoutes((prev) => [res.data.route, ...prev]);
      setSelectedRoute(res.data.route);
    } catch (err) {
      setError(err.response?.data?.message || "Optimization failed");
    } finally {
      setOptimizing(false);
    }
  }

  async function handleStatusChange(routeId, newStatus) {
    try {
      const res = await api.put(`/route/${routeId}/status`, { status: newStatus });
      setRoutes((prev) => prev.map((r) => (r._id === routeId ? res.data.route : r)));
      if (selectedRoute?._id === routeId) setSelectedRoute(res.data.route);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update route status");
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Manage Routes</h2>
      </div>

      <div className="route-filter-bar">
        <input
          placeholder="City"
          value={filters.city}
          onChange={(e) => setFilters({ ...filters, city: e.target.value })}
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">Any status</option>
          <option value="Pending">Pending</option>
          <option value="InProgress">InProgress</option>
          <option value="Completed">Completed</option>
          <option value="Archived">Archived</option>
        </select>
        <input
          placeholder="Waste type"
          value={filters.wasteType}
          onChange={(e) => setFilters({ ...filters, wasteType: e.target.value })}
        />
        <button onClick={loadRoutes}>Apply Filters</button>
        <button onClick={handleOptimize} disabled={optimizing} className="btn-primary">
          {optimizing ? "Optimizing..." : "Optimize Route"}
        </button>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="route-manage-layout">
        <RouteMap route={selectedRoute} />

        <div className="route-list-panel">
          {loading ? (
            <p className="page-loading">Loading...</p>
          ) : routes.length === 0 ? (
            <p className="hint-text">No routes yet — try Optimize Route above.</p>
          ) : (
            routes.map((r) => (
              <div
                key={r._id}
                className={`route-list-card ${selectedRoute?._id === r._id ? "selected" : ""}`}
                onClick={() => setSelectedRoute(r)}
              >
                <div className="route-list-card-header">
                  <strong>{r.city}</strong>
                  <span className={`status-badge status-badge--${r.status.toLowerCase()}`}>{r.status}</span>
                </div>
                <p className="route-list-card-meta">
                  {r.stops.length} stops · {r.totalDistance.toFixed(1)} km · {Math.round(r.estimatedDuration)} min
                </p>
                <select
                  value={r.status}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => handleStatusChange(r._id, e.target.value)}
                  className="role-pill-select"
                >
                  <option value="Pending">Pending</option>
                  <option value="InProgress">InProgress</option>
                  <option value="Completed">Completed</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
