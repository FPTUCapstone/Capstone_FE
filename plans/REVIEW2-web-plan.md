# REVIEW2 — Web implementation plan

Spec: `specs/REVIEW2-web-spec.md`. Each task: failing test first, minimal code, `npm test` for the touched suites.

| # | Task | Files | Verified by |
|---|---|---|---|
| 1 | Contract types + runtime validation for §3.1–3.3 fields | `scheduling/types/schedulingTypes.ts`, `public/pois/types/poi.ts`, `public/pois/services/poiApi.ts` | `schedulingTypes.review2.test.ts`, `poiApi.test.ts` |
| 2 | Presentation helpers: price label, cost split, distance/duration, walk hint, radius warning, arrival diff | `scheduling/utils/itineraryPresentation.ts` | `itineraryPresentation.test.ts` |
| 3 | Timeline price label, summary cost split, POI detail price, form radius warning + `excludeFoodAndDrink` | `ItineraryTimeline.tsx`, `ItinerarySummaryCards.tsx`, `PoiDetailPage.tsx`, `CreateSchedulingRequestForm.tsx`, `placeSearchApi.ts`, `PlacePickerDialog.tsx` | component tests |
| 4 | API: `updateItineraryStops` (PUT `stops`), `stop_infeasible` details, `getItinerarySuggestions` | `scheduling/services/schedulingApi.ts` | `schedulingApi.test.ts` |
| 5 | Leg row + [Đổi] menu + motorbike note + infeasible message | `ItineraryLegRow.tsx`, `ItineraryTimeline.tsx`, `ViewSuggestedItineraryPage.tsx` | `ItineraryTimeline.test.tsx`, page tests |
| 6 | Change badges + Undo toast | `ViewSuggestedItineraryPage.tsx`, `ItineraryTimeline.tsx` | page tests |
| 7 | "⋯" menu, mandatory confirm, lunch card, "＋ Thêm quán ăn", regenerate warning | `ItineraryStopMenu.tsx`, `ItineraryTimeline.tsx`, page | page tests |
| 8 | Suggestions dialog (greyed reasons, empty state) → PUT stops | `ItinerarySuggestionsDialog.tsx` | dialog + page tests |
| 9 | Tripadvisor client + block + translation toggle, robots.txt | `public/pois/services/externalReviewsApi.ts`, `public/pois/components/TripadvisorReviews.tsx`, `app/robots.ts` | component + robots tests |
| 10 | (P1) mapbox-gl maps with fallback | `scheduling/components/maps/*` | fallback tests (no token) |

Final: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`.
