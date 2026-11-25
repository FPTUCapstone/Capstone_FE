# Weather packing tips on the itinerary page (Web)

Follows the backend spec `Capstone_BE/specs/UC-10-weather-packing-tips-spec.md` (approved 2026-11-24, implemented on
branch `feature/hoangtv-itinerary-weather-tips`, not yet merged or pushed).
Status: DRAFT, waiting for the developer's approval. Nothing is built yet.

## 1. Why
The traveler who plans a day should see, at the top of that itinerary, what to bring because of that day's weather.
The Web only shows what the backend sends. It never works out or guesses weather itself.

## 2. Contract (from the backend spec, section 4)
`GET /api/v1/itineraries/{id}/weather-tips`, Traveler token.

```json
{ "weatherTips": null }
```
or
```json
{ "weatherTips": {
    "date": "2026-11-25", "timeZoneId": "Asia/Ho_Chi_Minh", "forecastAtUtc": "2026-11-24T03:00:00Z",
    "summary": { "minTempC": 22, "maxTempC": 31, "maxRainProbabilityPercent": 60, "maxUvIndex": 8 },
    "tips": [ { "code": "weather_tip.rain", "severity": "Info", "text": "Mang ô hoặc áo mưa" } ]
} }
```
`severity` is `Info` or `Warning`; `tips` can be empty. FE-first rule: the endpoint is not deployed yet, so the Web is
built against this contract with mocked responses in tests, and there is no fake fallback in the product code.

## 3. Rules
| # | Rule |
|---|---|
| H1 | The page loads the itinerary exactly as today. The weather request starts after the itinerary has loaded, is never awaited by the page, and never delays or changes it. |
| H2 | The card shows only for a valid non-null `weatherTips`. It is hidden while loading, on `null`, on any HTTP error (401, 403, 404, 5xx), on a network error, on a timeout and on a response that does not match the contract. No error message, no skeleton, no retry button. |
| H3 | One request per itinerary id per page visit; it is cancelled when the page unmounts or the itinerary id changes. It is not re-requested after the traveler edits stops (the forecast does not depend on the edit being saved). |
| H4 | The card shows the backend's `text` as given. It does not translate by `code`, does not reorder tips and does not add tips of its own. |
| H5 | The card is read-only: no buttons, no dialogs, no storage. |

## 4. What the traveler sees
Placed between the summary cards and the booked services, inside the existing page, so no new route and no new screen.

```
 ┌───────────────────────────────────────────────────────────┐
 │ ☀ Thời tiết ngày 25/11          22–31°C · Mưa tối đa 60% · UV 8 │
 │ ⚠ Có dông hoặc mưa to, cân nhắc đổi sang điểm trong nhà     │   Warning: amber
 │ • Mang ô hoặc áo mưa                                         │   Info: neutral
 │ • Mang kem chống nắng và kính râm                            │
 └───────────────────────────────────────────────────────────┘
```
- Title: `Thời tiết ngày dd/MM` from `date`. Summary line from `summary`. The list is the tips in the order received.
- A Warning tip has a warning icon and the amber style of `DESIGN.md` (`bg-amber-50 text-amber-700 border-amber-200`),
  so it is not told apart by colour alone. Info tips use the page's neutral card style.
- With no tips: one line `Thời tiết thuận lợi, không cần chuẩn bị đặc biệt.` (my copy; change it if you prefer).
- The card is a labelled region (`role="region"`, `aria-label="Gợi ý theo thời tiết"`) and reads well on a phone width.
- It follows `DESIGN.md` tokens and the existing look of `ItinerarySummaryCards`; no new library.

## 5. Scope
- `src/features/scheduling/services/schedulingApi.ts`: `getItineraryWeatherTips(itineraryId, options?: { accessToken?, signal? }): Promise<WeatherTipsDto | null>`. It never throws for HTTP, network or contract problems (they all give `null`); an aborted request rejects with the abort error so the caller can ignore it.
- `src/features/scheduling/types/schedulingTypes.ts`: `WeatherTipsDto`, `WeatherTipDto`, `WeatherTipsSummaryDto` and a contract check function (same style as `isValidItineraryDetailDto`).
- `src/features/scheduling/components/ItineraryWeatherTipsCard.tsx`: the card (props: `tips: WeatherTipsDto`).
- `src/features/scheduling/components/useItineraryWeatherTips.ts`: the hook that implements H1-H3.
- `ViewSuggestedItineraryPage.tsx`: mount the hook and the card (about 5 lines).
- Tests (Vitest): API (200 valid, `null`, invalid shape, 401, 404, 500, network error, abort); card (Warning vs Info, empty tips, summary line, date format, accessible region); page (renders and works when the weather request fails or returns `null`; card shows between summary and booked services; request starts only after the itinerary loaded; one request per id).
- Checks before a PR: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`.

## 6. Not in scope
Tips per stop, the My Itineraries list, the creation form, English text, changing the itinerary because of weather,
deploying or enabling the backend flag (`WeatherTips__Enabled`), and Mobile (its own spec after this one).

## 7. Open points for the developer
1. The empty-tips sentence in section 4 is my wording.
2. `AGENTS.md` asks for an approved Web Screen Specification before a new visual screen. This is a card on an existing
   page, not a new screen. Tell me if you want it treated as needing one.
3. Nothing can be tried against the real endpoint until the backend branch is merged, migrated (no migration is
   needed) and `WeatherTips__Enabled=true` is set; the Web is verified with mocked responses until then.