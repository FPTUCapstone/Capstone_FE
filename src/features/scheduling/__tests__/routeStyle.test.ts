import { describe, expect, it } from 'vitest';

import {
  CHEVRON_IMAGE_SIZE,
  createChevronImage,
  legColor,
  ROUTE_END_COLOR,
  ROUTE_START_COLOR,
  routeColorAt,
} from '../components/maps/mapboxStyle';
import { MARKER_COLORS } from '../utils/mapGeometry';

const channels = (hex: string) => [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16));

describe('route colour by progress', () => {
  it('starts at the start colour and ends on the colour of the end marker', () => {
    expect(ROUTE_END_COLOR.toLowerCase()).toBe(MARKER_COLORS.end.toLowerCase());
    expect(routeColorAt(0)).toBe(ROUTE_START_COLOR.toLowerCase());
    expect(routeColorAt(1)).toBe(ROUTE_END_COLOR.toLowerCase());
  });

  it('shades in between and clamps outside 0..1', () => {
    const [startR, startG, startB] = channels(ROUTE_START_COLOR);
    const [endR, endG, endB] = channels(ROUTE_END_COLOR);

    expect(channels(routeColorAt(0.5))).toEqual([
      Math.round((startR + endR) / 2),
      Math.round((startG + endG) / 2),
      Math.round((startB + endB) / 2),
    ]);
    expect(routeColorAt(-3)).toBe(routeColorAt(0));
    expect(routeColorAt(9)).toBe(routeColorAt(1));
  });

  it('colours a leg by its order among all legs of the route', () => {
    expect(legColor(0, 1)).toBe(routeColorAt(0));
    expect([0, 1, 2].map((index) => legColor(index, 3))).toEqual([
      routeColorAt(0),
      routeColorAt(0.5),
      routeColorAt(1),
    ]);
  });
});

describe('chevron image drawn at runtime', () => {
  const { width, height, data } = createChevronImage();
  const alphaAt = (x: number, y: number) => data[(y * width + x) * 4 + 3];
  const opaqueRowsByColumn = Array.from({ length: width }, (_, x) =>
    Array.from({ length: height }, (_, y) => y).filter((y) => alphaAt(x, y) > 128),
  );

  it('is a square RGBA bitmap of the agreed size', () => {
    expect(width).toBe(CHEVRON_IMAGE_SIZE);
    expect(height).toBe(CHEVRON_IMAGE_SIZE);
    expect(data).toHaveLength(width * height * 4);
  });

  it('is white and mostly transparent', () => {
    let opaque = 0;
    for (let index = 0; index < data.length; index += 4) {
      if (data[index + 3] > 128) opaque += 1;
      if (data[index + 3] > 0) expect([data[index], data[index + 1], data[index + 2]]).toEqual([255, 255, 255]);
    }
    expect(opaque).toBeGreaterThan(20);
    expect(opaque).toBeLessThan((width * height) / 3);
  });

  it('points along +x, the direction of the line: the tip is on the right, the arms are on the left', () => {
    const filled = opaqueRowsByColumn.filter((rows) => rows.length > 0);
    const left = filled[0];
    const right = filled[filled.length - 1];
    const middle = (height - 1) / 2;

    expect(Math.abs(right[0] - middle)).toBeLessThanOrEqual(2);
    expect(Math.abs(right[right.length - 1] - middle)).toBeLessThanOrEqual(2);
    expect(left.some((row) => Math.abs(row - middle) > 4)).toBe(true);
  });
});
