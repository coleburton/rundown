export type LatLngTuple = [number, number];

/**
 * Decodes an encoded polyline string (Google polyline format) into an array
 * of latitude/longitude tuples.
 */
export function decodePolyline(encoded: string): LatLngTuple[] {
  if (!encoded) {
    return [];
  }

  const coordinates: LatLngTuple[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);

    const deltaLat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += deltaLat;

    result = 0;
    shift = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);

    const deltaLng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += deltaLng;

    coordinates.push([lat * 1e-5, lng * 1e-5]);
  }

  return coordinates;
}
