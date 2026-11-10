# Plan: web itinerary road route

Spec: `specs/web-itinerary-road-route-spec.md`. One task at a time, test first.

1. `mapGeometry.ts` — `legs` on the map model. Test: `__tests__/mapGeometry.test.ts`.
2. `utils/mapboxDirections.ts` — `fetchRoadLeg` + success-only cache. Test: `__tests__/mapboxDirections.test.ts` (mock `fetch`).
3. `MapboxItineraryMap.tsx` — solid `itinerary-road` layer, fallback dashed layer, abort on redraw. Test: `__tests__/maps.test.tsx`.
4. `ViewSuggestedItineraryPage.tsx` — legend text. Test: existing page tests updated if they assert the old sentence.
5. Verify: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`; one local commit.
