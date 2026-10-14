# UC-66 Update Landing Page Content — Web Screen Specification

Screen #31 Landing Page Content Management. Source: SRS V2 §3.9.10, Table 4.1, Table 5, entity `LandingPageContent`, CR-05/06/07/09/11/12.

The Frontend is built first. Backend integrates afterwards by implementing the contract in this document. Until Backend exists, no save or publish ever reports a fabricated success.

## Route and scope

- Route: `/admin/landing-content` inside the existing admin console layout.
- Platform: Next.js Web only. The public Landing Page (`/`) and `src/data/landingData.ts` are **not** modified; this screen edits the content that Backend will later serve to that page.
- Feature module: `src/features/admin/landing-content`. Same-origin proxy: `app/api/admin/landing-content/**`, following the UC-57 `algorithmConfigProxy` pattern (token only in the HttpOnly admin cookie).
- Not modified (integration-owned by DatMNT): `src/lib/routes.ts`, `src/components/navigation/AdminNavigation.tsx`, `src/lib/server/adminSession.ts`. A suggested additive patch goes in the PR description.

## Recorded conflicts

### SRS_INTERNAL_CONFLICT: actor (Administrator vs Staff)

| Source | Actor |
|---|---|
| §3.9.10 Function Description, Credentials, BR-115; entity `LandingPageContent`; `docs/WEB_SCOPE_MATRIX.md` line 151 | Administrator |
| §2.2.2 UC catalogue (UC-66), Table 4.1 Screen #31 description, Table 5 Screen Authorization | Staff only |

**Decision (WP-08 owner KhanhPQ, 2026-10-14):** both `Administrator` and `Staff` sessions may use Screen #31; any other role fails closed. This matches neither source verbatim, so the team must confirm it. Follow-up needing DatMNT review (shared file): set `docs/WEB_SCOPE_MATRIX.md` line 151 to `Administrator, Staff`. The server proxy enforces the same rule, so the client is never the authorization boundary (CR-11).

### SRS_MESSAGE_GAP: message references in §3.9.10

The message table does not match the codes cited by §3.9.10: MSG19 is "Profile updated successfully." (not an image error), MSG29 is the geographic-coordinate error (not a banner-period error), and MSG148 has no row. Therefore:

- Use the table text exactly for **MSG01** (`This field is required.`), **MSG65** (`This tour package is currently unavailable for booking.`), **MSG126** (`You do not have permission to access this function.`), **MSG127** (`TripMate is temporarily unable to process your request. Please check your connection and try again.`), **MSG129** (`Operation completed successfully.`).
- Image rejection, invalid banner period and "published" success use descriptive English copy defined in `resources/en.ts`, marked `SRS_MESSAGE_GAP`, to be replaced when the SRS assigns real codes.

### Other assumptions (confirm before release)

- Supported image types are not named in the SRS. Assumed: JPEG, PNG, WebP; maximum 5 MB (BR-16).
- Layout figure is `[TBD]` in the SRS; the layout below is a proposal.
- The Backend routes and DTOs below are a **proposed contract**, not existing endpoints.

### SRS amendment backlog

The SRS is still being completed. The team lead confirmed that gaps found while coding are to be added to the SRS. This implementation uses the values below until the SRS is updated; each item is to be carried into SRS V2 by the SRS owner.

| # | Section | Proposed amendment |
|---|---|---|
| 1 | §2.2.2, Table 4.1, Table 5, §3.9.10, BR-115, entity `LandingPageContent` | Align the UC-66 actor across all sections. Current team decision: Administrator and Staff. |
| 2 | Message table | Add messages for: image too large or unsupported type, invalid banner display period, content published successfully (referenced as MSG19, MSG29, MSG148 in §3.9.10 but those rows mean something else or do not exist). |
| 3 | BR-16 / §3.9.10 | Name the supported image types (assumed JPEG, PNG, WebP). |
| 4 | §3.9.10 Screen Layout | Replace the `[TBD]` figure with the approved layout. |
| 5 | §3.9.10 | Add the approved-tours lookup, image upload and restore operations to the function description so Backend scope is explicit. |

## Layout

- Header: eyebrow `Landing page content`, title `Landing Page Content Management`, short description.
- Version panel: Published Version, Published By, Published At (dd/MM/yyyy, Asia/Ho_Chi_Minh, CR-07), version history list with [Restore Previous Version].
- Hero block: Headline, Sub-headline, Background Image, Call-to-action Label, Call-to-action Target.
- Featured destination block: ordered list (add, remove, reorder) of Name, Image, Description.
- Featured tour block: pick from approved tour packages only (BR-56).
- Promotional banner block: Banner Image, Link, Display Period (start, end).
- Actions: [Save Draft], [Preview], [Publish], [Restore Previous Version], [Cancel]. Publish opens a CR-05 confirmation modal (focus trap, Escape cancels).
- Preview renders the draft as read-only text/images in a panel and never changes the published version.
- At 320px blocks stack; no page-level horizontal overflow.

## Behaviour

1. **Guard:** no valid session redirects to `/admin/login?returnUrl=%2Fadmin%2Flanding-content`. `Administrator` and `Staff` proceed; other roles render `AdminAccessDeniedView` (MSG126).
2. **Load:** retrieves the published version as an editable draft plus history. Loading uses `role="status"`; stale content is never shown as current. If Backend is not integrated (proxy 404/503), show the pending banner with the MSG127 text and an empty editor; never invented content.
3. **Edit and validate (client, mirrored by Backend):** mandatory fields of a block in use → MSG01 under the field; images ≤ 5 MB and supported type, otherwise the file is rejected and other input is kept; banner end not before start; featured tours limited to those returned by the approved-tours endpoint.
4. **Save Draft:** enabled when dirty and valid; success toast MSG129; public page unchanged (BR-128, PC-03).
5. **Preview:** local render of the draft, no request that changes state.
6. **Publish:** validate, confirm in modal, then publish. Success only after a `2xx` with a valid body: show the new published version info. On failure the previous version stays published and Retry is offered (PC-05).
7. **Restore:** loads a selected history version into the draft, then continues from Publish (BR-27).
8. **Errors (CR-12):** 401 → login; 403 → MSG126; 409 → "content changed, reload" message with reload; 422 → field errors; tour no longer approved → MSG65 on the offending entry and no publish; 5xx/network → MSG127 with Retry and the statement that the request could not be confirmed.
9. **Copy:** all user-facing text in `resources/en.ts` (CR-09).

## Proposed Backend contract

All paths under `/api/v1/admin/landing-content`, bearer token supplied by the proxy; Backend must authorize the role itself.

| Operation | Request | Success | Errors |
|---|---|---|---|
| Read | `GET /` | `200 { published: Version, draft: Draft \| null, history: VersionSummary[] }` | 401, 403, 5xx |
| Save draft | `PUT /draft` `{ baseVersion, content }` | `200 Draft` | 422 field errors, 409 |
| Publish | `POST /publish` `{ baseVersion }` | `200 Version` | 409, 422 (incl. unapproved tour), 5xx |
| Restore | `POST /restore` `{ versionId }` | `200 Draft` (Backend stores the restored version as the current draft; the screen treats it as saved) | 404, 409 |
| Upload image | `POST /media` multipart | `201 { mediaId, url }` | 413/415/422 |
| Approved tours | `GET /approved-tours` | `200 TourOption[]` | 401, 403 |

`content` = `{ hero, destinations[], featuredTourIds[], banner }` using the fields listed under Layout. `VersionSummary` = `{ versionId, versionNumber, publishedByName, publishedAtUtc }`. Publishing also writes the audit log on the Backend (BR-130, PC-04); the Frontend does not claim an audit entry.

## Architecture

```
app/admin/(console)/landing-content/page.tsx        server guard, renders the screen
app/api/admin/landing-content/[[...path]]/route.ts  thin handler -> proxy
src/features/admin/landing-content/
  landingContent.ts           types, pure validators, response type guards
  landingContentService.ts    client service (same-origin fetch, typed errors)
  landingContentProxy.ts      server proxy (session + role check, token from cookie)
  LandingContentScreen.tsx    editor UI
  resources/en.ts
  *.test.ts(x)
```

## Test plan

- Validators and type guards (required fields, 5 MB boundary, type check, banner period, malformed bodies).
- Service: success and each error status mapped to a typed error; malformed body treated as unavailable.
- Proxy: no cookie, invalid session, both allowed roles, unknown role denied, cross-origin write rejected, upstream 401/403/409/422/5xx mapping.
- Page: session matrix (missing, unsealed, expired, tampered, mismatch) and both allowed roles; `returnUrl` is exact.
- Screen: loading, pending banner, dirty/valid button states, field errors, MSG65 on a bad tour, 409 handling, publish modal keyboard behaviour, no success message without a valid `2xx`, restore flow, preview does not call any write endpoint.
- Gates: `npm run typecheck`, `npm run lint`, `npm test`, `npx next build --webpack`, `git diff --check`.

## Out of scope

- Public Landing Page components and `src/data/landingData.ts`.
- Shared route registry, navigation and session code.
- Audit log viewing (UC-68/69).
