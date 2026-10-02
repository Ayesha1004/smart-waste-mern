
import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";

const pinIcon = L.divIcon({
  className: "report-pin-marker",
  iconSize: [20, 20],
  iconAnchor: [10, 20],
});

function ClickToPlace({ onMove, interactive }) {
  useMapEvents({
    click(e) {
      if (interactive) onMove([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

function RecenterOnChange({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, 15);
    }
  }, [position, map]);
  return null;
}

// FIX: Leaflet measures its container's size once, at mount time. If the
// surrounding flex layout hasn't fully settled yet (a common race when a
// map sits inside dynamically-rendered containers), Leaflet locks onto a
// too-small size and never notices the real size afterward — this is why
// the original .NET map.js called setTimeout(() => map.invalidateSize(), 100)
// after init. This component does the React equivalent.
function InvalidateSizeOnMount() {
  const map = useMap();
  useEffect(() => {
    // A short delay, same idea as the original map.js — gives the
    // surrounding CSS layout (flexbox) time to settle before Leaflet
    // re-measures. Running twice (immediate + delayed) covers both
    // fast and slow layout settling.
    console.log("INVALIDATE SIZE RUNNING", map.getSize());
    map.invalidateSize();
    const timer = setTimeout(() => map.invalidateSize(), 150);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

export default function MapPicker({ position, onChange, interactive = true }) {
   console.log("MAPPICKER VERSION CHECK: NEW CODE IS RUNNING");
  const center = position || [30.3755, 69.3451];
  const zoom = position ? 15 : 5;

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    setSearchError(null);

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
      const res = await fetch(url);
      const results = await res.json();

      if (!results || results.length === 0) {
        setSearchError("No matching location found");
        return;
      }

      const { lat, lon } = results[0];
      onChange([parseFloat(lat), parseFloat(lon)]);
    } catch (err) {
      setSearchError("Search failed — check your connection and try again");
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="map-picker">
      {interactive && (
        <form onSubmit={handleSearch} className="map-search-bar">
          <input
            type="text"
            placeholder="Search for a place or address..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" disabled={searching}>
            {searching ? "Searching..." : "Search"}
          </button>
        </form>
      )}
      {searchError && <p className="map-search-error">{searchError}</p>}

      <div className="map-container">
        <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <ClickToPlace onMove={onChange} interactive={interactive} />
          <RecenterOnChange position={position} />
          <InvalidateSizeOnMount />
          {position && <Marker position={position} icon={pinIcon} />}
        </MapContainer>
      </div>
    </div>
  );
}
