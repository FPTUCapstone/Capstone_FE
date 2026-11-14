# Support chat Web plan

1. Inspect instructions, shared session, JSON transport, layout, UI primitives and installed Next.js client component documentation. Check the clean worktree baseline.
2. Add failing tests in `src/features/traveler/support-chat/services/supportChatService.test.ts` for contract validation, authentication, error statuses and safe URLs. Implement `supportChatService.ts` using `getApiBase` and `requestJson`.
3. Add failing interaction tests in `src/features/traveler/support-chat/SupportChat.test.tsx`. Implement `SupportChat.tsx` with an expandable nonmodal panel, explicit context, bounded history, retry, session reset and cancellation.
4. Mount the shared Traveler/Operator entry point in `src/components/layout/PersistentPublicLayout.tsx` and test its normal layout entry point.
5. Review scope and code quality. Run focused tests, npm test, lint, typecheck and build. Record actual outcomes and outstanding verification.
6. User follow-up adds `supportChatEvents.ts` and a tested “Ask about this refund” action in `RefundProgressPage.tsx`. Hide Operator itinerary context and test contextual opening with history reset.

The existing user instruction authorizes execution of this scope and plan. No commit or push is requested.

## Validation results

- `npm ci --no-audit --no-fund` passed. The first baseline attempt encountered incomplete dependencies while installation was running.
- Tests were added and observed failing before their implementation, including nullable response context, Int64 overflow and blank history regressions.
- Initial unrestricted `npm test` completed with 25 failures across nine Vitest files during concurrent validation and memory pressure.
- `npm test -- --maxWorkers=2` passed all 93 Node tests. Vitest passed 341 files and 3758 tests, with one 5000 ms timeout in the untouched scheduling test `CASE FE-1`.
- Sequential targeted rerun passed all 105 tests across five files. This includes all 63 chatbot/service/layout/refund tests and all 42 tests in the scheduling file that timed out.
- Repository-wide ESLint passed. Latest-source focused ESLint and `npm run typecheck` passed.
- Latest-source `npm run build` passed with `NODE_OPTIONS=--max-old-space-size=1024`.
- Headless Edge with mocked API responses passed at 375, 768 and 1280 px. Checked panel bounds, keyboard send, Escape focus restoration, refund booking-ID handoff, context reset, nullable context, 503 errors and identical retry requests.
- `git diff --check` passed. Changes are confined to FE source, colocated tests and the required spec/plan. The development server was stopped and its generated AGENTS.md heading change was reverted.

Live authenticated Backend/Gemini integration remains unverified. Conversations also reset on access-token replacement, including refresh, as a conservative session boundary.

## Final validation

- Added and verified a regression for emoji truncation at the UTF-16 history limit. Assistant history now preserves complete Unicode characters.
- Latest targeted run passed 68 tests across the feature, service, layout, refund and About page files.
- Latest full `npm test -- --maxWorkers=1` passed all 93 Node tests and all 3,760 Vitest tests across 342 files.
- Latest repository-wide lint, typecheck and production build passed. Build used a 1 GB Node heap limit.
- `git diff --check` passed.

Live Gemini response quality and authenticated integration with the running Backend are pending provider configuration. The initial knowledge corpus is maintained in Backend code. Chat history is transient and supports authenticated Traveler and TourOperator accounts.

## Review corrections

- Added failing regressions for editing a question after HTTP 429 and 503, then invalidated stale retry on edits.
- All 66 focused tests passed. Repository-wide lint, typecheck, production build and diff check passed.
- A further full-suite attempt passed 93 Node tests and encountered a scheduling timeout before it was stopped. Rerunning the entire untouched `CreateSchedulingRequestForm.test.tsx` file passed all 42 tests.

## Approved unified chatbot implementation

1. Extend service contract tests for tour context, actions and route/query validation, then implement the service parser.
2. Replace dropdown tests with page-context coverage and add action handoff, history retention, single-scroll, clear, cancellation and retry regressions. Implement implicit context and server-created action cards.
3. Test the booking route and actual form state for URL adults 1..50, invalid input, capacity enforcement and rerender edit preservation. Add the one-time prefill.
4. Run focused chatbot, booking, layout and refund tests, ESLint and typecheck. Run the production build and record outcomes and limitations here. Keep the existing dev server running.

All changes remain in chatbot-fe. Existing uncommitted changes are preserved. No commit or push is requested.


## Unified chatbot follow-up validation

- Service and UI regressions were observed failing before implementation, including tour/action contract support, implicit contexts, single scrolling, transient clearing and actual booking-route prefill.
- Latest focused run passed 155 tests across six files covering SupportChat, supportChatService, TourBookingPage, TourBookingView, RefundProgressPage and PersistentPublicLayout.
- Focused ESLint and project typecheck passed after moving route-derived state adjustment out of effects. The route cleanup cancels pending work, and the transcript survives navigation.
- Headless Edge with mocked session/API responses passed at widths 375, 768 and 1280 with 900 px height. Verified keyboard send, page bounds, one transcript scroller, fixed header/composer, close/reopen retention, action selection with prior history and precision-safe IDs, identical-request retry, booking navigation, actual adults=3 form state, editing to 4 and unchecked consent.
- Browser verification found that an open panel covered mobile booking controls during navigation. Navigation action links now close the panel and preserve its transient transcript for reopening. A failing interaction regression preceded that fix.
- The adults prefill validates 1..50 only at the handoff boundary. Normal checkout capacity remains governed by the existing loaded schedule and server quote. Invalid, absent or duplicate arguments fall back to legacy defaults. Explicit adult-count prefill initializes children and infants to zero, with a regression confirming exactly two adults in both quote counts and created participants. The form initializes once per tour and preserves edits across same-tour URL and profile rerenders. A keyed booking content boundary resets all booking state when tour ID changes.
- Strict action parsing normalizes null optional actions and null description/inactive variant fields. Nonnull conflicting fields, missing required values, unknown fields/types and unsafe destinations produce the existing safe service error. Exact server-appended /tours, /itineraries and /partner/bookings paths are permitted. Nullable response context continues to normalize to an absent context.
- Explicit session-scoped refund-open events, suggested record selection and page navigation retain the transcript and cancel stale work. Session credential replacement clears transient chat.

Final validation and live Backend/Gemini integration results are recorded below. The FE dev server on port 3001 is retained.


### Integration corrections

- Readability follow-up uses the existing Geist font scoped to the panel, 15px body text, 1.65 line spacing and a responsive 26rem panel. Provider paragraphs and bullet cases render as escaped text, semantic headings and lists. Citation details are collapsed initially and remain keyboard accessible.
- Regression-first tests cover structured cases, inline case labels, preserved conditions and unsafe markup. Focused chat and booking validation passed 166 tests. The source-collapse test checks the native details state because jsdom exposes descendants of closed details to role queries.
- Headless Edge verified the real authenticated reply, computed Geist font, three case headings, no displayed BR/CR/UC references, collapsed sources, responsive bounds at 375/768/1280 and one transcript scrollbar. Runtime errors were empty.

- Follow-up regressions reproduced dropped child/infant counts and cancellation during page navigation. The correction preserves complete counts through safe action parsing, the real booking form, quote and participant creation. Chat completion leaves outside controls focused and continues across public route changes.
- Follow-up focused validation passed 162 tests. ESLint and production build, including type checking, passed. Headless Edge verified the real local booking form with two adults and one child, interactive outside controls while a chat response was pending, and retained outside focus after completion, with zero runtime errors.

- Canonical Backend wire-format regressions were observed failing, then passed after nullable inactive field normalization and the server-appended static path allow-list were implemented.
- Selecting a record preserves an unrelated typed question. A response clears the composer only when its current draft matches the submitted request after trimming. Failed suggested requests retain retry-on-edit behavior.
- A synchronous request-ref guard prevents duplicate suggested-record submissions. Explicit refund handoff preserves history and cancels in-flight replies, with late-response regression coverage.
- Final full-suite validation passed 93 Node tests and 3,846 Vitest tests across 342 files.
- Authenticated browser verification used the real Backend and Gemini at widths 375, 768 and 1280. Tour search and selected-tour answers returned HTTP 200, with one scroll container and no runtime errors. An unrelated composer draft survived the selected-tour response.
- Current local catalog tours have no upcoming departures. Live tour selection was verified, while booking handoff counts and quote requests were verified through regression fixtures.
- Final production build, including TypeScript validation, passed. Diff whitespace validation passed in all three chatbot worktrees.
