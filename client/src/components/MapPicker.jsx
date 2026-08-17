import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
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

/**
 * position: [lat, lng] or null (null = no pin placed yet)
 * onChange: (position) => void, called when the user clicks to place/move the pin
 * interactive: if false, the map is read-only (used in ReportDetail)
 */
export default function MapPicker({ position, onChange, interactive = true }) {
  const center = position || [30.3753, 69.3451]; // Pakistan-wide default view if no pin yet
  const zoom = position ? 15 : 5;

  return (
    <div className="map-container">
      <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <ClickToPlace onMove={onChange} interactive={interactive} />
        {position && <Marker position={position} icon={pinIcon} />}
      </MapContainer>
    </div>
  );
}
