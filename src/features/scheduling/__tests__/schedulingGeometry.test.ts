import { describe, expect, it } from 'vitest';

import { calculateDistanceKm, SPEED_KMH } from '../utils/schedulingGeometry';

describe('calculateDistanceKm', () => {
  it('returns zero for the same point', () => {
    expect(calculateDistanceKm(16.040393, 108.223058, 16.040393, 108.223058)).toBe(0);
  });

  it('returns the same distance in either direction', () => {
    const forward = calculateDistanceKm(16.040393, 108.223058, 16.069967, 108.246066);
    const reverse = calculateDistanceKm(16.069967, 108.246066, 16.040393, 108.223058);
    expect(forward).toBeCloseTo(reverse, 10);
  });

  it('estimates the local distance from Cham Museum to My Khe in kilometres', () => {
    const distance = calculateDistanceKm(16.040393, 108.223058, 16.069967, 108.246066);
    expect(distance).toBeGreaterThan(4);
    expect(distance).toBeLessThan(4.2);
  });
});

describe('SPEED_KMH', () => {
  it('preserves the planning estimate for every transport mode', () => {
    expect(SPEED_KMH).toEqual({ Motorbike: 35, Car: 30, Walking: 4.5, PublicTransit: 20 });
  });
});
