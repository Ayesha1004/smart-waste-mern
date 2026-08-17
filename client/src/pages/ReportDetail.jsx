import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import MapPicker from "../components/MapPicker";

export default function ReportDetail() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get(`/trashreport/${id}`)
      .then((res) => setReport(res.data.report))
      .catch((err) => setError(err.response?.data?.message || "Could not load report"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page-loading">Loading...</div>;
  if (error) return <div className="page"><div className="alert-error">{error}</div></div>;
  if (!report) return null;

  return (
    <div className="page">
      <Link to="/my-reports" className="back-link">← Back to My Reports</Link>

      <div className="upload-layout" style={{ marginTop: "1rem" }}>
        <div className="upload-form-panel">
          <img
            src={`http://localhost:5000${report.imageUrl}`}
            alt=""
            className="report-detail-image"
          />
        </div>
        <MapPicker position={[report.latitude, report.longitude]} onChange={() => {}} interactive={false} />
      </div>

      <div className="report-detail-meta">
        <span className={`status-badge status-badge--${report.status.toLowerCase()}`}>
          {report.status}
        </span>
        <span className="mono">Waste Type: {report.wasteType}</span>
        <span className="mono">Confidence: {(report.aiConfidence * 100).toFixed(1)}%</span>
        <span className="mono">Reported: {new Date(report.reportedAt).toLocaleDateString()}</span>
      </div>

      {report.needsReview && (
        <div className="alert-warning">This report was flagged for manual review due to low AI confidence.</div>
      )}

      {report.description && <p>{report.description}</p>}
    </div>
  );
}
