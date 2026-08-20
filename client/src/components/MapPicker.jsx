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

// react-leaflet's `center` prop only applies on initial mount — this component
// watches `position` and imperatively pans the map whenever it changes
// programmatically (e.g. from a search result), not just from a click.
function RecenterOnChange({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, 15);
    }
  }, [position, map]);
  return null;
}

/**
 * position: [lat, lng] or null (null = no pin placed yet)
 * onChange: (position) => void, called when the user clicks OR searches to place/move the pin
 * interactive: if false, the map is read-only and the search bar is hidden (used in ReportDetail)
 */
export default function MapPicker({ position, onChange, interactive = true }) {
  const center = position || [30.3753, 69.3451]; // Pakistan-wide default view if no pin yet
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
      // Nominatim's forward-geocoding endpoint: text -> coordinates.
      // No custom headers needed here — Nominatim's policy accepts the
      // Referer header browsers send automatically for client-side apps.
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
          {position && <Marker position={position} icon={pinIcon} />}
        </MapContainer>
      </div>
    </div>
  );
}
