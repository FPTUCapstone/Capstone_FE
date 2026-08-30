# Legacy Traveler and Tour Operator Prototype

This directory preserves Traveler and Tour Operator UI from the original Vite prototype.

- These components are historical visual references; they are not a platform-scope definition.
- They are not imported by the production Next.js Web routes.
- Do not copy them directly into production Web or treat their existence as proof that a feature is Mobile-only.
- Determine Web, Mobile, or shared ownership from the latest approved SRS and `docs/WEB_SCOPE_MATRIX.md`.
- Their old `AppView` callback props remain only to keep the reference code understandable and type-safe.
- Add production routes only through an approved Web Screen Specification and implementation task.

Current implemented Web routes remain the Public Landing Page and Administrator application under `app/`; that implementation status does not limit the approved future Web product scope.
