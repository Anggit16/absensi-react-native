/**
 * Perhitungan jarak geografis (haversine) untuk validasi geofence di sisi klien.
 * Backend tetap menghitung ulang jarak; nilai klien hanya untuk tampilan
 * dan pencegahan dini sebelum request dikirim.
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_METERS = 6371000;

export function distanceMeters(origin: Coordinates, target: Coordinates): number {
  const latFrom = (origin.latitude * Math.PI) / 180;
  const latTo = (target.latitude * Math.PI) / 180;
  const latDelta = latTo - latFrom;
  const lngDelta = ((target.longitude - origin.longitude) * Math.PI) / 180;

  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(latFrom) * Math.cos(latTo) * Math.sin(lngDelta / 2) ** 2;

  return Math.round(EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}
