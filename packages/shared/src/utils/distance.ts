/**
 * Haversine distance calculation and formatting utilities.
 * Used by the resource locator to show proximity to the user.
 */

const EARTH_RADIUS_MILES = 3958.8;

/**
 * Calculate the straight-line distance between two geographic coordinates
 * using the Haversine formula.
 *
 * @param lat1 - Latitude of point 1 (degrees)
 * @param lon1 - Longitude of point 1 (degrees)
 * @param lat2 - Latitude of point 2 (degrees)
 * @param lon2 - Longitude of point 2 (degrees)
 * @returns Distance in miles
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRadians = (deg: number): number => (deg * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_MILES * c;
}

/**
 * Format a distance in miles to a user-friendly string.
 *
 * @param miles - Distance in miles
 * @returns Formatted string like "0.5 mi", "2.3 mi", or "15+ mi"
 */
export function formatDistance(miles: number): string {
  if (miles < 0.1) {
    return '< 0.1 mi';
  }
  if (miles >= 15) {
    return '15+ mi';
  }
  if (miles < 1) {
    return `${miles.toFixed(1)} mi`;
  }
  return `${miles.toFixed(1)} mi`;
}
