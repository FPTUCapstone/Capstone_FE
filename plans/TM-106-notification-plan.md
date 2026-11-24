# TM-106 operator in-app notification implementation plan

1. Capture focused baseline: run existing `PartnerHeader.test.tsx` and `PartnerWorkspaceLayout` tests to confirm the clean starting point.
2. Add failing tests for the new notification API client (`notificationsApi.ts`): success parse of inbox list, 401 clears auth and throws, 403/400 map to typed errors, mark-read success.
3. Implement `notificationsApi.ts` + `types.ts` + parser against the real BE contract (`GET /api/v1/notifications`, `POST /api/v1/notifications/{id}/read`) to make those tests pass, following the `weatherSafetyApi.ts` conventions (error class, `isRecord` guard, auth token helper).
4. Add failing tests for the polling hook (`useNotificationInbox.ts`): fetches on mount, polls every 30s, cleans up interval on unmount, swallows fetch errors without throwing, exposes `unreadCount`/`items`/`markRead`/`refresh`.
5. Implement `useNotificationInbox.ts` to make those tests pass.
6. Add failing tests for `PartnerHeader` additions: bell renders unread badge count, badge hidden at zero, dropdown opens on click and lists items, clicking an item calls markRead; confirm all pre-existing `PartnerHeader.test.tsx` cases still pass unmodified.
7. Implement the bell + dropdown in `PartnerHeader.tsx`, wiring the hook, to make those tests pass without altering existing props/behavior.
8. Wire `PartnerWorkspaceLayout.tsx` to supply the hook state to `PartnerHeader` (mirroring how `weatherAlertBadgeCount` is threaded today), skip polling when `isDemo`.
9. Run full affected test suite, independently review the diff for scope creep or BE contract mismatches, fix findings and rerun.
10. Run `npm run lint && npm run typecheck && npm run build`; report results honestly, including anything not executed (e.g. no live BE/browser available in this environment).
