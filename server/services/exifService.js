import exifr from "exifr";

/**
 * Attempts to read GPS coordinates embedded in a photo's EXIF metadata.
 * Returns { latitude, longitude } or null if the photo has no GPS data
 * (common on screenshots, edited images, or photos with location services
 * disabled at capture time) — the frontend falls back to manual pin
 * placement in that case.
 */
export async function extractGpsCoordinates(imageBuffer) {
  try {
    const gps = await exifr.gps(imageBuffer);
    if (!gps || gps.latitude == null || gps.longitude == null) {
      return null;
    }
    return { latitude: gps.latitude, longitude: gps.longitude };
  } catch (err) {
    // Malformed EXIF data, unsupported format, etc. — treat as "no GPS data"
    // rather than failing the whole upload over a metadata quirk.
    console.warn("EXIF extraction failed:", err.message);
    return null;
  }
}
