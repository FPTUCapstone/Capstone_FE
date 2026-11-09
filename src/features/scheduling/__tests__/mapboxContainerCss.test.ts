import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

// Mapbox adds `mapboxgl-map` to the container element the app renders. That element sizes itself
// (h-[360px] on the itinerary map, h-56 on the radius map) inside parents with no fixed height, so a
// global `height: 100% !important` on `.mapboxgl-map` resolves to 0px and hides the map.
describe('Mapbox container sizing in app/globals.css', () => {
  it('leaves the map container size to the component that renders it', () => {
    const css = fs
      .readFileSync(path.resolve(process.cwd(), 'app/globals.css'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '');
    const rulesTargetingTheContainer = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(([, selectors]) =>
      selectors.split(',').some((selector) => /\.mapboxgl-map(?![\w-])/.test(selector)),
    );

    for (const [, selectors, declarations] of rulesTargetingTheContainer) {
      expect(declarations, `rule "${selectors.trim()}"`).not.toMatch(/(^|[;\s])(height|width)\s*:[^;]*!important/);
    }
  });
});
