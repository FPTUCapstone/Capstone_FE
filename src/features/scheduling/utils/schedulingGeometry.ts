import type { TransportMode } from '../types/schedulingTypes';

export function calculateDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const earthRadiusKm = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const midLat = (((lat1 + lat2) / 2) * Math.PI) / 180;
  const x = dLng * Math.cos(midLat);
  const y = dLat;
  return Math.sqrt(x * x + y * y) * earthRadiusKm;
}

export const SPEED_KMH: Record<TransportMode, number> = {
  Motorbike: 35,
  Car: 30,
  Walking: 4.5,
  PublicTransit: 20,
};
