# TM-106 FE Tour Moderation Integration Plan

> Execute natively, TDD, one task at a time. Spec: `specs/TM-106-tour-moderation-integration-spec.md`.

Global constraints: Server Components by default, client code feature-scoped under `src/features/admin/tour-reviews/`, no new libraries, existing design tokens/classes, English copy in `resources/en.ts`, `npm run lint && npm run typecheck && npm test && npm run build` before finishing.

Review focus: malformed/partial backend payloads; non-numeric ids in the URL; double submit on approve/reject; a tour already decided by someone else (409); keyword containing `%`/`_` (backend treats literally, UI just passes it); logout mid-review (401); production never showing fixtures.

1. **Client API + parsers** — `services/tourModerationApi.ts` + test (written first): `fetchPendingTourPage`, `fetchTourReview`, `submitApproval`, `submitRejection`, `ModerationApiError`.
2. **Proxy + routes** — `api/tourModerationProxy.ts` + test, four `app/api/admin/tours/**/route.ts` files. Staff only; whitelisted query; error mapping.
3. **Live loading in the screens** — hook `useModerationData`; `TourReviewQueue` and `TourReview` render loading/ready/empty/error/forbidden/unauthorised; adapt `QueueRow`/`TourContent` to nullable departure/capacity, image gallery, rule-based policy; keep demo path synchronous and unchanged.
4. **Live decisions** — `TourReviewDecisionPanel` takes `tourId` + `live`; live confirm calls the API with in-flight lock; outcome notices for 200/409/503/401/403; demo stays local.
5. **Update/extend tests** (`TourModeration.test.tsx`: production boundary now means "live fetch, never fixtures"), then lint/typecheck/test/build; commit locally. Do not push or open a PR without the requester's choice.
