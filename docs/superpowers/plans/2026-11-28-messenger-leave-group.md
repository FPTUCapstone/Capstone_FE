# Messenger Web leave group: scope and plan

The user's assigned scope authorizes this change and source-only review. Do not run tests, build, lint, type analysis or browser verification.

## Acceptance and contract

- Own only GroupDetailsDialog.tsx, the new services/groupLeaveApi.ts and this entry. Parent owns GroupChatHub, SupportChat and GroupHighlights; no backend edits.
- Show leave only for an Active Traveler in an Active travel group whose loaded active member list includes their user ID. Independent chat groups have no leave API and receive no leave action.
- Confirm the group title. Explain host succession exactly as implemented: earliest JoinedAtUtc, then smallest user ID; no remaining active member closes the group and expires usable invitations. TourOperators cannot leave through this endpoint. Closed groups reject leave.
- POST /api/v1/travel-groups/{groupId}/leave, no body, GUID Idempotency-Key through chatRequest extraHeaders. Validate LeaveTravelGroupResponse: groupId, membershipStatus Left, groupClosed, nullable newHostUserId, leftAtUtc.
- Keep one retry key per authenticated user/group in the service across failures, cancellation of confirmation, closing and remounting the dialog. Clear it only on confirmed success. This cache lasts for the current JS runtime; reload persistence is outside scope.
- A retained operation can be retried even if member loading now fails or the group has closed: an uncertain prior request may already have committed, and backend idempotent replay precedes membership/closed checks. This exception cannot start a new leave without a retained key.
- Prevent double submission and dialog dismissal during the request. Bound the entire operation, including auth refresh/response parsing, to 20 seconds. Timeout is uncertain: retain the key and offer retry.
- Translate server leave error codes specifically; preserve shared transport/auth errors. Failure never calls onLeft or closes the dialog.
- Success calls optional onLeft?: () => void and closes details. Parent must remove chat/bubble, clear selection/dialog state and refresh conversations; parent cache for retry keys is unnecessary.

## Implementation steps

1. Inspect dialog, auth, chatRequest, member contract, backend controller/response/handler and local UI conventions.
2. Add service-owned retry keys, bounded leave request, response validation and leave error messages.
3. Add eligibility, explicit confirmation, pending dismissal guard and success callback to details without changing parent-owned files.
4. Review changed source for scope, eligibility, error paths, retries and stale component lifecycles. Automated and browser verification remain unexecuted by instruction.

## Source review outcome

Implemented the three assigned files. Reviewed request/response and error codes against the backend source, dismissal paths, duplicate submit guard, timeout cleanup, remount retry cache and suppression of stale completion callbacks. Retained-key replay remains available after membership loading fails or a group closes. No tests, build, lint, type analysis or browser tools were run. Parent-owned files and backend files were not edited.
