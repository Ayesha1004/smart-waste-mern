/**
 * Reverse-geocodes coordinates to a city name using Nominatim (OpenStreetMap).
 * Nominatim's usage policy requires a descriptive User-Agent and no more
 * than ~1 request/second — fine for single-report uploads, but don't batch
 * this in a tight loop without adding delay/caching if that ever comes up
 * (e.g. bulk re-geocoding in an admin tool).
 */
export async function getCityFromCoordinates(latitude, longitude) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "SmartWasteManagementSystem/1.0 (student project)",
      },
    });

    if (!response.ok) {
      console.warn("Geocoding request failed:", response.status);
      return "Unknown";
    }

    const data = await response.json();
    const address = data.address || {};

    // Nominatim doesn't always return the same field for "city" depending
    // on the location — fall back through a few reasonable alternatives.
    return address.city || address.town || address.village || address.county || "Unknown";
  } catch (err) {
    console.warn("Geocoding error:", err.message);
    return "Unknown";
  }
}
