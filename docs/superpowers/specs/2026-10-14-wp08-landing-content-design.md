# WP-08 Landing Content Management — Web Design

## Goal

Deliver the Web workspace for UC-66 (Update Landing Page Content, Screen #31). The Frontend is built first; Backend integrates afterwards by implementing the contract below. Until Backend exists, every save or publish attempt reports an honest "not integrated" outcome and never a fabricated success.

## Scope and ownership

- Platform: Next.js Web only. The published Landing Page (`/`) stays an unnumbered `PUBLIC_WEB` surface and is **not** modified by this work package.
- Screen owned: Screen #31 Landing Page Content Management at `/admin/landing-content`.
- Feature module: `src/features/admin/landing-content`.
- Same-origin proxy: `app/api/admin/landing-content/route.ts`, following the UC-57 pattern (`algorithmConfigProxy`): the bearer token lives only in the HttpOnly admin session cookie.
- Not modified (integration-owned by DatMNT): `src/lib/routes.ts`, `src/components/navigation/AdminNavigation.tsx`, `src/lib/server/adminSession.ts`. A suggested additive patch for the route registry and navigation goes in the PR description.
- No Backend or database change in this work package.

## SRS_INTERNAL_CONFLICT: Actor Authorization (Staff vs Administrator)

- `docs/WEB_SCOPE_MATRIX.md` line 151 lists UC-66 as `Administrator` (`ADMIN_WEB_ONLY`).
- The WP allocation draft (2026-10-08) lists WP-08 as a Staff CMS and states that SRS V2 treats Staff as a real internal actor.
- **Decision recorded by the WP-08 owner (KhanhPQ):** both `Administrator` and `Staff` sessions may open and use Screen #31. Any other role fails closed.
- Follow-up required (needs DatMNT review because the file is shared): update `docs/WEB_SCOPE_MATRIX.md` line 151 to `Administrator, Staff`. The PR description cites this spec and asks DatMNT to confirm. The server-side check in the proxy enforces the same rule, so the client is not the authorization boundary (CR-11).

## Assumptions and open items

- The SRS §3.9.10 field list was not available while writing this spec. The editable field set below is derived from the sections of the current Landing Page and **must be confirmed against SRS V2 §3.9.10 before the implementation plan is finalized**. Fields not backed by the SRS are removed rather than invented.
- The Backend route `/api/v1/admin/landing-content` and the DTO shape are a **proposed contract** for Backend to adopt or amend. Nothing here claims they exist.

## Backend contract (proposed, for Backend to implement)

| Operation | Request | Success | Errors |
|---|---|---|---|
| Read content | `GET /api/v1/admin/landing-content` | `200 { version, status: 'draft' \| 'published', updatedAtUtc, sections: Section[] }` | 401, 403, 5xx |
| Save draft | `PUT /api/v1/admin/landing-content/draft` with `{ baseVersion, sections }` | `200` same shape | 400/422 validation (field-level), 409 version conflict |
| Publish | `POST /api/v1/admin/landing-content/publish` with `{ baseVersion }` | `200` same shape | 409, 422 |

`Section` is `{ id: string, kind: string, fields: Record<string, string> }`. Timestamps are UTC ISO strings rendered per CR-07.

## Behaviour

1. **Route guard** (`/admin/landing-content`): no valid session redirects to `/admin/login?returnUrl=%2Fadmin%2Flanding-content`. `Administrator` and `Staff` render the workspace. Any other role renders `AdminAccessDeniedView`.
2. **Load:** the page loads content through the client service. While loading it shows a loading state. If the proxy answers 503/404 because Backend is not integrated, the screen shows a clear "Backend integration pending" banner and an empty editor. It never shows invented content as if it were the published content.
3. **Editing:** one editor panel per section with validated text fields (required, max length, trimmed). Dirty-state tracking, per-field errors with accessible labels, and a read-only preview of the edited text.
4. **Save Draft / Publish:** call the service. Save Draft is enabled only when the form is dirty and valid; Publish is enabled only for a saved, clean draft. Publish asks for confirmation in an accessible dialog (focus trap, Escape closes).
5. **Failure handling (CR-12):** 401 returns to login; 403 shows access denied; 409 shows a version-conflict message and offers reload; 422 maps to field errors; 5xx or network failure says the request could not be confirmed. A success message appears only after a `2xx` with a valid response body.
6. **Copy:** all user-facing text lives in `resources/en.ts` (CR-09).

## Architecture

```
app/admin/(console)/landing-content/page.tsx       server guard, renders the workspace
app/api/admin/landing-content/route.ts              thin handler -> proxy
src/features/admin/landing-content/
  landingContent.ts          types, validators, type guard for the response
  landingContentService.ts   client service (same-origin fetch, typed errors)
  landingContentProxy.ts     server proxy (session + role check, token from cookie)
  LandingContentScreen.tsx   editor UI
  resources/en.ts
  *.test.ts(x)
```

Each unit has one purpose: `landingContent.ts` is pure and has no I/O, the service owns client HTTP, the proxy owns server authorization and upstream calls, and the screen owns presentation and state.

## Testing

- Pure validators and response type guard.
- Service: success, each error status mapped to a typed error, malformed body treated as unavailable.
- Proxy: no cookie, invalid session, role `Staff` allowed, role `Administrator` allowed, unknown role denied, cross-origin write rejected, upstream 401/403/409/5xx mapping.
- Page: session security matrix (missing, unsealed, expired, tampered, mismatch) and both allowed roles.
- Screen: loading, backend-pending banner, dirty/valid button states, field errors, conflict message, publish dialog keyboard behaviour, no success message without a valid `2xx`.
- Gates: `npm run typecheck`, `npm run lint`, `npm test`, `npx next build --webpack`, `git diff --check`.

## Out of scope

- Editing the public Landing Page components or `src/data/landingData.ts`.
- Image or media upload, scheduling and version history (not in the confirmed requirement; add only if SRS §3.9.10 requires it).
- Shared route registry, navigation and session code.
