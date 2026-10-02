import { useEffect, useState } from "react";
import api from "../../services/api";

const WASTE_TYPES = ["cardboard", "glass", "metal", "paper", "plastic", "trash"];

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function loadReports() {
    setLoading(true);
    try {
      const res = await api.get("/admin/reports"); // no params — everything, by default
      setReports(res.data.reports);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  async function handleCorrect(reportId, newType) {
    try {
      const res = await api.put(`/admin/reports/${reportId}/correct`, { wasteType: newType });
      setReports((prev) => prev.map((r) => (r._id === reportId ? res.data.report : r)));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to correct label");
    }
  }

  async function handleDelete(reportId) {
    if (!window.confirm("Delete this report permanently?")) return;
    try {
      await api.delete(`/admin/reports/${reportId}`);
      setReports((prev) => prev.filter((r) => r._id !== reportId));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete report");
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Manage Reports</h2>
        <p>{reports.length} total report{reports.length !== 1 ? "s" : ""} — no filters, everything shown</p>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {loading ? (
        <p className="page-loading">Loading...</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th></th>
              <th>Reporter</th>
              <th>City</th>
              <th>Waste Type</th>
              <th>Confidence</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r._id}>
                <td>
                  <img
                    src={`http://localhost:5000${r.imageUrl}`}
                    alt=""
                    style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 4 }}
                  />
                </td>
                <td className="mono">{r.userId?.fullName || "Unknown"}</td>
                <td className="mono">{r.city}</td>
                <td>
                  <select
                    value={r.wasteType}
                    onChange={(e) => handleCorrect(r._id, e.target.value)}
                    className="role-pill-select"
                  >
                    {WASTE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  {r.needsReview && <span className="needs-review-tag"> · flagged</span>}
                  {r.wasLabelCorrected && <span className="hint-success"> · corrected</span>}
                </td>
                <td className="mono">{(r.aiConfidence * 100).toFixed(0)}%</td>
                <td>
                  <span className={`status-badge status-badge--${r.status.toLowerCase()}`}>{r.status}</span>
                </td>
                <td>
                  <button onClick={() => handleDelete(r._id)} className="btn-danger">Delete</button>
                </td>
              </tr>
            ))}
            {reports.length === 0 && (
              <tr>
                <td colSpan={7} className="admin-table-empty">No reports yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
