import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import L from "leaflet";

function stopIcon(sequence) {
  return L.divIcon({
    className: "route-stop-marker",
    html: `<div class="route-stop-number">${sequence}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
  });
}

/**
 * route: { stops: [{ sequence, latitude, longitude, city, reportId }], ... } or null
 */
export default function RouteMap({ route }) {
  if (!route || !route.stops || route.stops.length === 0) {
    return (
      <div className="map-container route-map-empty">
        <p>Select or generate a route to see it on the map.</p>
      </div>
    );
  }

  const positions = route.stops.map((s) => [s.latitude, s.longitude]);
  const center = positions[0];

  return (
    <div className="map-container">
      <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <Polyline positions={positions} pathOptions={{ color: "#3d6c99", weight: 4, dashArray: "8,8" }} />
        {route.stops.map((s) => (
          <Marker key={s.sequence} position={[s.latitude, s.longitude]} icon={stopIcon(s.sequence)}>
            <Popup>
              Stop {s.sequence} — {s.city}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
