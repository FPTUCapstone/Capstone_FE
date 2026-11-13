# UC 67 Frontend Plan

1. Keep `/admin/reports` Administrator-only via the signed admin session guard.
2. Replace production fixtures with BFF-backed generate and export calls; preserve fixtures only behind the existing non-production demo flag.
3. Parse the typed reporting contract defensively and render server-supplied metrics, breakdown rows, closed period, loading, error, and empty states.
4. Limit export choices to CSV and Excel and request an idempotent export operation UUID.
5. Validate TypeScript, lint, production build, and route behaviour with a closed period, an open-period error, all booking types, and both file downloads.
