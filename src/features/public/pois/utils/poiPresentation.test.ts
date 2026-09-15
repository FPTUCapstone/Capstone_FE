import { describe, expect, it } from 'vitest';

import { buildPageItems, formatDuration, projectPoiCoordinates } from './poiPresentation';

describe('POI presentation helpers', () => {
  it('centers a single map marker', () => {
    expect(projectPoiCoordinates([{ id: 1, latitude: 16.05, longitude: 108.2 }])).toEqual([
      { id: 1, x: 50, y: 50 },
    ]);
  });

  it('fits all map markers inside a padded viewport', () => {
    const points = projectPoiCoordinates([
      { id: 1, latitude: -33.8, longitude: 151.2 },
      { id: 2, latitude: 16.05, longitude: 108.2 },
      { id: 3, latitude: 48.85, longitude: 2.35 },
    ]);

    expect(points.every(({ x, y }) => x >= 10 && x <= 90 && y >= 12 && y <= 88)).toBe(true);
    expect(new Set(points.map(({ x }) => x)).size).toBeGreaterThan(1);
  });

  it('formats suggested duration without inventing a range', () => {
    expect(formatDuration(90)).toBe('1 giờ 30 phút');
    expect(formatDuration(120)).toBe('2 giờ');
  });

  it('builds compact pagination around the current page', () => {
    expect(buildPageItems(6, 12)).toEqual([1, 'ellipsis', 4, 5, 6, 7, 8, 'ellipsis', 12]);
    expect(buildPageItems(1, 1)).toEqual([1]);
  });
});
