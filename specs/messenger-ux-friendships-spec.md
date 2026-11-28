# Messenger usability and friendships

User-authorized scope: align Web and Mobile messaging with TripMate typography, spacing and navigation; add user discovery and persistent friendships. Keep SignalR, group tools and real database data.

Acceptance: desktop list plus chat, compact phone list/detail navigation, visible back navigation, unread filter, accessible search. New direct chat becomes visible immediately. Search discloses only active users and public profile fields. Friend requests may be accepted/declined only by recipient, cancelled only by sender. Repeated operations and concurrent reciprocal requests are safe. Unfriend preserves chat history; direct chat remains available without friendship as previously authorized.

Validation: existing messaging lifecycle tests, friendship permission/state tests, typecheck/lint, responsive browser verification and subsequent Mobile validation. Never seed mock data into product source.


## Corrected Web interaction (user clarification 2026-11-27)

The default entry is a header message icon opening a nonmodal floating conversation/user picker. Selecting a conversation or Active user opens a chat window at the bottom right without navigating away. The minus button minimizes it to a compact side bubble; restoring keeps the per-thread draft. Close removes the window/bubble without deleting messages. Picker and chat can coexist; pointer events outside these surfaces remain available. The persistent layout retains the dock during client route navigation. Minimized/closed chats must not mark incoming messages read. The unread badge remains on the header/bubble. Account changes clear the in-memory dock. Full-page /messages remains an optional direct route, not the default navigation.
