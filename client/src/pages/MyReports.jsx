import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const FILTERS = ["All", "Pending", "InProgress", "Completed"];

export default function MyReports() {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = filter === "All" ? {} : { status: filter };
    api
      .get("/trashreport/mine", { params })
      .then((res) => setReports(res.data.reports))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="page">
      <div className="page-header">
        <h2>My Reports</h2>
      </div>

      <div className="report-filter-tabs">
        {FILTERS.map((f) => (
          <span
            key={f}
            className={`filter-tab ${filter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </span>
        ))}
      </div>

      {loading ? (
        <p className="page-loading">Loading...</p>
      ) : reports.length === 0 ? (
        <p className="hint-text">No reports in this category yet.</p>
      ) : (
        <div className="report-list">
          {reports.map((r) => (
            <Link to={`/my-reports/${r._id}`} key={r._id} className="report-card">
              <img src={`http://localhost:5000${r.imageUrl}`} alt="" className="report-thumb" />
              <div className="report-card-body">
                <p className="report-card-desc">{r.description || `Reported: ${r.wasteType}`}</p>
                <p className="report-card-meta">
                  {new Date(r.reportedAt).toLocaleDateString()} · {r.city}
                  {r.needsReview && <span className="needs-review-tag"> · Needs review</span>}
                </p>
              </div>
              <span className={`status-badge status-badge--${r.status.toLowerCase()}`}>{r.status}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
