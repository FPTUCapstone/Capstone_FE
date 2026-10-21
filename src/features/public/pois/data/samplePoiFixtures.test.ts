import { describe, expect, it } from 'vitest';
import {
  getSamplePagedPois,
  getSamplePoiDetail,
  SAMPLE_POIS,
} from './samplePoiFixtures';

describe('samplePoiFixtures', () => {
  it('contains 8 valid sample POIs with geographical coordinates', () => {
    expect(SAMPLE_POIS).toHaveLength(8);
    for (const poi of SAMPLE_POIS) {
      expect(typeof poi.id).toBe('number');
      expect(poi.name).toBeTruthy();
      expect(typeof poi.latitude).toBe('number');
      expect(typeof poi.longitude).toBe('number');
      expect(poi.latitude).toBeGreaterThan(15);
      expect(poi.latitude).toBeLessThan(17);
      expect(poi.longitude).toBeGreaterThan(107);
      expect(poi.longitude).toBeLessThan(109);
    }
  });

  it('filters by keyword search', () => {
    const res = getSamplePagedPois(new URLSearchParams({ search: 'Mỹ Khê' }));
    expect(res.items.length).toBeGreaterThanOrEqual(1);
    expect(res.items[0].name).toContain('Mỹ Khê');
  });

  it('filters by category', () => {
    const res = getSamplePagedPois(new URLSearchParams({ categoryId: '4' }));
    expect(res.items.length).toBeGreaterThanOrEqual(1);
    for (const item of res.items) {
      expect(item.categoryId).toBe(4);
    }
  });

  it('returns comprehensive POI detail with photos and opening hours', () => {
    const detail = getSamplePoiDetail(1);
    expect(detail).not.toBeNull();
    expect(detail?.name).toBe('Bãi biển Mỹ Khê');
    expect(detail?.photos).toHaveLength(5);
    expect(detail?.openingHours).toHaveLength(7);
    expect(detail?.latitude).toBeCloseTo(16.0597, 3);
  });

  it('returns null for unknown POI ID', () => {
    const detail = getSamplePoiDetail(99999);
    expect(detail).toBeNull();
  });
});
