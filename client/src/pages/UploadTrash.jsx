import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import MapPicker from "../components/MapPicker";

export default function UploadTrash() {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [description, setDescription] = useState("");
  const [position, setPosition] = useState(null); // [lat, lng]
  const [hasGpsData, setHasGpsData] = useState(false);
  const [checkingLocation, setCheckingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null); // classification result shown after submit

  async function handleFileChange(e) {
    const selected = e.target.files[0];
    if (!selected) return;

    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setResult(null);
    setError(null);
    setPosition(null);

    // Immediately check for EXIF GPS data so the pin can auto-place
    // before the user even fills in a description
    setCheckingLocation(true);
    try {
      const formData = new FormData();
      formData.append("image", selected);
      const res = await api.post("/trashreport/extract-coordinates", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.hasCoordinates) {
        setPosition([res.data.latitude, res.data.longitude]);
        setHasGpsData(true);
      } else {
        setHasGpsData(false); // no GPS in photo — user must click the map to place a pin
      }
    } catch (err) {
      console.warn("Coordinate extraction failed, falling back to manual pin:", err);
      setHasGpsData(false);
    } finally {
      setCheckingLocation(false);
    }
  }

  function handleMapClick(newPosition) {
    setPosition(newPosition);
    setHasGpsData(false); // any manual click overrides auto-detected GPS as the source of truth
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!file) return setError("Please select a photo");
    if (!position) return setError("Please set a location — click the map to place a pin");

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("description", description);
      formData.append("latitude", position[0]);
      formData.append("longitude", position[1]);
      formData.append("hasGpsData", hasGpsData);

      const res = await api.post("/trashreport/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setResult(res.data.classification);
    } catch (err) {
      setError(err.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Upload Trash Report</h2>
        <p>Report illegal dumping — attach a photo and confirm the location.</p>
      </div>

      <div className="upload-layout">
        <form onSubmit={handleSubmit} className="upload-form-panel">
          <div className="form-group">
            <label>Photo</label>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} />
          </div>

          {previewUrl && (
            <img src={previewUrl} alt="Preview" className="upload-preview" />
          )}

          {checkingLocation && <p className="hint-text">Checking photo for location data...</p>}
          {file && !checkingLocation && !hasGpsData && !position && (
            <p className="hint-text">No location found in this photo — click the map to drop a pin.</p>
          )}
          {file && !checkingLocation && hasGpsData && (
            <p className="hint-text hint-success">Location detected automatically from the photo.</p>
          )}

          <div className="form-group">
            <label>Description (optional)</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {error && <div className="alert-error">{error}</div>}

          <button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Report"}
          </button>

          {result && (
            <div className={result.needsReview ? "alert-warning" : "alert"}>
              <strong>Detected: {result.wasteType}</strong>
              <br />
              Confidence: {(result.confidence * 100).toFixed(1)}%
              {result.needsReview && (
                <>
                  <br />
                  Low confidence — this report has been flagged for manual review.
                </>
              )}
              <br />
              <button type="button" onClick={() => navigate("/my-reports")} className="link-button">
                View My Reports →
              </button>
            </div>
          )}
        </form>

        <MapPicker position={position} onChange={handleMapClick} interactive={true} />
      </div>
    </div>
  );
}
