# REVIEW2 — Web: mentor feedback remediation (tickets 10, 11, 12, 18)

Status: approved by developer 2026-10-16 (implement directly from the agreed decisions)
Authority: cross-repo spec `.scratch/review2-mentor-feedback/spec.md` (decisions D1, D4, D5, D6, D9, D11;
API contract §3.1–3.6). This file only records the Web scope and acceptance criteria.

## Scope

Existing screens only: `/plan` (create form), `/itinerary/[id]` (UC-11 detail), `/pois/[id]` (UC-12 detail).
No new routes. The backend contract is built against with typed clients and mocked responses.

### Ticket 10 — types, prices, cost split, radius warning (D1, D9 fallback, D11-7)
- Web types declare every §3.1–3.3 field (`latitude`, `longitude`, `costKind`, `travelDistanceFromPreviousMeters`,
  `transportModeFromPrevious`, `address`, `transportMode`, `startLocation`, `endLocation`; scheduling item
  `travelDistanceToNextMeters`, `transportModeToNext`, `costKind`; POI detail `estimatedVisitCost`, `costKind`).
  New fields are optional in runtime validation so older responses still render.
- Price label: `null` → "Chưa có thông tin"; `0` → "Miễn phí"; `AverageSpend` → "Mức chi tiêu dự kiến: X VNĐ/người";
  otherwise "Giá vé dự kiến: X VNĐ/người". Timeline and POI detail use it (fixes `null` shown as "Miễn phí").
- Summary card shows "Vé · Ăn uống · Tổng" split by `costKind`.
- Create form shows a warning when radius > 30 km (default stays 10 km).
- Mandatory-stop picker passes `excludeFoodAndDrink=true` to the selectable-POI search.

### Ticket 11 — leg row, transport change, change badges, undo (D5, D11-3/4/6)
- Leg row: "9,4 km · khoảng 22 phút · 🛵 Xe máy [Đổi]"; km hidden when distance is null; metres under 1 km;
  "1 giờ 10 phút" at 60 min or more; walk hint "Gần, có thể đi bộ ~X phút" for legs under 1 km not walked.
- One motorbike note at the top: "ⓘ Thời gian xe máy là ước tính theo đường ô tô".
- [Đổi] (Đi bộ / Xe máy / Ô tô-taxi) sends `PUT /itineraries/{id}/items` `{ stops }` with an Idempotency-Key.
- 422 `itinerary.stop_infeasible` shows a Vietnamese message naming the stop and the reason.
- [Đổi] and edit actions are hidden when `isNavigationInProgress` or the viewer cannot manage the trip.
- After an edit: badges on stops whose arrival moved ("⟲ lùi 25 phút" / "⟲ sớm hơn 10 phút"), and an Undo toast
  for a few seconds that re-sends the previous stops.

### Ticket 12 — item menu, lunch card, suggestions, Tripadvisor (D4, D6, D11-1/2/5/8)
- One "⋯" menu per visit stop: Thay địa điểm / Bỏ khỏi lịch / Xem đánh giá. Removing a mandatory stop asks
  "Đây là điểm bạn đã chọn, chắc chắn bỏ?".
- Lunch card "🍜 Bữa trưa? [Chọn quán]" on the leg closest to 12:00 when the trip covers 11:00–13:30 and has no
  `AverageSpend` stop; one "＋ Thêm quán ăn" button at the end of the list.
- Suggestions dialog (`GET /itineraries/{id}/suggestions`): not-fitting items greyed with the reason and not
  selectable; empty list "Không có điểm phù hợp trong X km · [Mở rộng bán kính]" (links to `/plan`);
  choosing sends the full stops list (insert after anchor or replace in place).
- "Tạo lại" warns first when the itinerary contains a restaurant.
- Tripadvisor block (signed-in Traveler, loaded client-side after render): "Tripadvisor" text + API bubble image +
  link to `url`, review count, reviews; hidden when `source` is null; per-review "Dịch sang tiếng Việt" when
  `translationAvailable`, labelled "Bản dịch tự động · Xem bản gốc". No self-drawn stars for Tripadvisor.
- `robots.txt` disallows the review paths served through the Web origin.

### Ticket 18 (P1) — maps (D9)
- `mapbox-gl` (exact version), client-only dynamic import, token `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`.
- Create form: radius circle following the slider. Itinerary: numbered markers coloured by type, straight route,
  marker ↔ timeline highlight. Without a token the existing order diagram stays.

## Acceptance
- `npm test`, `npm run lint`, `npm run typecheck` green; no "Miễn phí" for `null`; review text not in SSR HTML.

## Out of scope
Roadmap items (§2 Roadmap of the cross-repo spec); navigation; any new route.
