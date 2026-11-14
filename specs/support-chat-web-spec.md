# Support chat Web

The user approved this FE implementation in the dedicated chatbot-fe worktree.

- Provide a keyboard-accessible support panel on existing Traveler and TourOperator Web surfaces using the shared session and JSON transport.
- POST `/api/v1/support-chat/messages` with a 1–2000 character message, up to ten nonblank transient history messages of up to 2000 characters each, and optional refund, itinerary or tour context with a positive Int64 decimal string ID. Normalize a nullable response context to an absent optional context.
- Render answers and source titles as plain text. Link only safe internal source paths.
- Show loading, actionable errors, retry, and sign-in recovery for 401. Cancel requests on disposal and discard stale responses after session changes.
- Keep conversations in component memory. Clear on session credential changes and Clear chat. Retain memory on close/reopen. Context changes cancel pending requests and invalidate retry, preserving the existing transcript when selecting server-suggested records.
- FE ownership includes responsive Web behavior. Backend and Flutter implementation belong to their respective worktrees.
- The refund progress page opens chat with its real booking ID through a session-scoped internal event. Infer context from /tours/{id}, /tours/{id}/book, /itinerary/{id} and /bookings/{id}/refund using usePathname. Itinerary context is available to Travelers. Preserve the explicit refund event and its session checks.

Acceptance is covered by focused service and interaction tests plus available repository validation. Live API and browser checks must be reported separately.

Editing a failed question invalidates its saved Retry request and clears recoverable error feedback. Unchanged questions retain identical-request retry. A 401 continues to require sign-in recovery.

## Approved unified chatbot follow-up

Readable-answer follow-up uses the existing Geist font in the chat panel, 15px answer text with generous line spacing, short case headings and semantic lists. Plain provider text remains escaped. Preserve one transcript scroll container, modeless outside interaction, keyboard behavior and current request/session guards. Human-readable source titles omit internal business-rule identifiers.

The approved manual-test corrections extend booking action arguments with children and infants, preserving the full composition in both the form and quote. Validate all counts together, reject duplicate/unsafe arguments and retain the existing manual form defaults when no valid assisted composition exists. A new URL handoff with changed schedule or participant counts initializes a new form, including on the same tour. Identical handoffs and profile rerenders preserve edits. Replies continue across public route navigation, stay cancellable on account changes or explicit reset, and preserve focus on outside controls. The panel allows pointer interaction with the rest of the page and can be collapsed while a reply is pending.

- Remove manual Context and ID controls. Show a small clearable context chip. Page context remains an optional hint alongside general tour discovery handled by the server planner.
- Use one scroll container for transcript, server-created action cards, pending messages and errors. Keep header and composer outside that container.
- Accept optional actions (including legacy null as absence) with type navigate or selectContext and label, plus the relevant URL or context and prompt. Reject unknown types, malformed shapes and unsafe URLs through the existing safe service error.
- Navigation action handoffs close the panel and retain its transcript for reopening. Navigate actions use only existing internal tour detail/booking, account trip list, itinerary detail, booking refund/ticket/payment routes and exact server-appended /tours, /itineraries and /partner/bookings paths. IDs are positive Int64 strings. Booking query keys are scheduleId and adults only, with no duplicate keys. Adults must be an integer in 1..50, matching Backend ChatQueryPlanValidator.MaximumPartySize.
- Selecting a suggested record immediately submits its prompt with the current bounded history and selected context. Keep cancellation, session and stale-response guards. Clear chat cancels outstanding work and clears transient messages.
- Read adults from the booking URL, validate 1..50, and initialize actual adult form state once. Invalid, missing or duplicate values use the existing default. Rerenders preserve edits. An explicit adult count initializes children and infants to zero. Missing prefill uses legacy defaults. New-tour navigation resets booking state, while same-tour rerenders preserve edits. Live capacity and existing explicit terms/checkout confirmation remain authoritative.
- Focused service, interaction and booking tests precede implementation. Verify the full suite and live authenticated Backend separately.

- Canonical Backend actions may include null inactive fields and null description. Normalize these away, reject nonnull conflicting variant fields and unknown properties. Preserve an unrelated typed draft when a selected-record response completes. Explicit refund-open events preserve the transcript and cancel pending work.
