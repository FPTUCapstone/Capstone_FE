# Delivery plan

1. Restore shared TripMate shell, font and sizing; provide exit/back navigation and unread filters.
2. Keep real conversation/user search and fix narrow-screen direct-chat navigation.
3. Persist friend requests and friendship transitions in Backend with authorization and concurrency protection.
4. Add friend discovery and requests UI to Web, then Mobile using the same contract.
5. Run permission/state and chat regression tests, lint/typecheck/analyze. Verify real Web at desktop/phone sizes; verify authenticated two-account request/chat workflow with SQL Server, then Mobile.

Current evidence: Web guest Edge 1440 and 390 pixels no horizontal overflow; Plus Jakarta Sans computed. Web chat/friends/routes 64 tests passed; typecheck and changed-source lint passed before adding refresh button. Authenticated E2E and Mobile validation pending. Product source has no seeded demo contacts.


## Web dock verification 2026-11-27

Implemented header icon and nonmodal picker with inline Active-user search. Chat opens at the bottom right; minimize creates a side bubble, restore retains draft, close removes window without deleting messages. Shared layout preserves dock through client navigation. Existing itinerary-page message shortcut opens the same picker. Support-chat overlap fixed. Reads are gated on expanded conversation visibility.

Latest source: typecheck passed, changed-source ESLint passed, 108 tests passed across chat, navigation and persistent layout. Edge live two-account workflow passed against isolated SQL database/API5058: picker/search/open; minimize/restore draft; independent picker; navigate while keeping chat/draft; close; incoming unread while minimized. Screenshots are in the Windows temporary directory: messenger-dock-picker.png, messenger-dock-open-desktop.png, messenger-dock-minimized.png. Web remains at http://localhost:3001. No commit/push or merge performed.


## Compact chat corrections (2026-11-27)

Picker stacks above the active chat. Dock is 327px wide and 440px tall at desktop viewport; compact direct-message bubbles omit repeated sender names. Timestamp/read metadata appears on hover or keyboard focus. Removed composer counter/help line; send button centered with textarea and textarea height resets with draft changes. Minimized dock uses padded 64px bounds to contain badge/close controls and prevent horizontal scrollbar.

Live Edge checks: width=327, send center delta=0px, picker top layer=true, hover timestamp=true, minimized scrollWidth/clientWidth=64/64 and scrollHeight/clientHeight=64/64; restore preserves draft. Changed-source lint passes; typecheck passes; chat/navigation/layout tests108/108 pass. Screenshot evidence: messenger-compact-327.png, messenger-compact-picker-front.png, messenger-compact-minimized.png in Windows temp directory. No push.


## Facebook DevTools and group workflow verification (2026-11-27)

Facebook was inspected in the user-authenticated browser via Chrome DevTools. Only UI layout/style measurements were used: picker360px, blank floating compose328px, search input36px, new-message button32px, editor font15px/line-height20.1px, emoji/attachment controls36px. The observed full-page composer has a maximum height143.333px in its viewport. No Facebook messages were sent.

Corrections: horizontal message overflow hidden and time tooltip rendered outside the scrolling element; textarea grows1/3/6 lines to40/78/138px without visible scrollbars; resize recalculates the editor height; emoji sits within the input and inserts real characters; plus menu is available for direct chats; search icon18px; mini close is a centered SVG; redundant picker close removed.

Two creation choices now exist: independent chat group (select2–49 other Active users, 3–50 total) and itinerary-linked travel group (existing UC-17, owned itinerary and idempotency header). Travel host can request a real invitation code/QR through existing UC-18. Independent groups route through separate APIs/cursors/keys and have text chat without travel-tool actions.

Real browser E2E passed: independent3-person group creation, send/receive, live reply and history after reload; travel group creation, invitation code, second-user join through the existing itinerary-page modal, and group-message receive. UI metrics passed: composer40/78/138, no scrollbar, send center delta0px on one line, search18px, message scrollWidth/clientWidth325/325, emoji insertion and mini SVG centering. Database QA data is isolated; no product seed data. Screenshot evidence: messenger-composer-fixed.png, messenger-minimized-fixed.png, messenger-travel-group-live.png in Windows temp directory.

Final Web checks: 120 tests passed across 13 files; typecheck and changed-source ESLint passed. Hover timestamps use a body portal to avoid scroll-container clipping and stay below the chat header. Backend independent-group validation includes application, endpoint/realtime and SQL concurrency checks recorded in its own plan. Changes remain local and uncommitted. Mobile integration for the new independent chat-group contract is not covered by this Web verification.

## Follow-up acceptance (2026-11-27)
User authorizes: Web compact header (~one fifth width for minimize/close/search), smaller sender and list actions, tighter edge spacing, support chat stays accessible in a separate corner; group member panel and travel invite-code entry; Mobile existing UC-22 GPS opt-in/live location entry. Important group polls/notices must remain accessible independently of text history, voters are visible to group members, creator edits validated on server and client. Preserve existing votes/payment confirmations: reject unsafe edits rather than silently changing prior member decisions. Real database QA only; Web workflow first, then Mobile. No push requested.

Plan: parent handles Web shell, important/edit integration and tests; BE worker handles authorized message edit/read contracts with concurrency; FE worker handles forms/details/join and friends; Mobile worker integrates existing GPS/member/join and independent groups. Run focused regressions, real SQL/browser workflows, then Mobile verification. Report remaining gates honestly.


Follow-up verification: Web full suite passed 107 Node tests plus 4,587 Vitest tests (5 existing skips) before the final metadata/sign-in patch. Current focused regressions cover edit retry/unmount/revision, voted-poll metadata preservation, sign-in POST and highlights. Live Edge 1440/390 checks passed compact header/support placement/no horizontal overflow; real two-account travel group member list, voting, voter identity, option append after votes, expense edit/realtime and rejection after payment confirmation passed. An append failure found in live testing was fixed by preserving stored poll metadata instead of rewriting derived totalVotes. The pinned poll remained accessible from the important section with 88 messages in the isolated QA database; volume fixtures live outside repositories. No push.
