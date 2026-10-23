---
name: tripmate-design-system
description: Design system and frontend UI/UX guidance for TripMate Web (Capstone_FE). Activate this skill whenever creating new interfaces, editing UI components, implementing approved screen specifications, checking visual consistency, or applying canonical design tokens, responsive layouts, motion, and accessibility standards. Grounded in DESIGN.md and VoltAgent/awesome-design-md methodology.
---

# TripMate Design System Agent Skill

This skill provides actionable design system rules, token references, and component composition patterns for frontend engineers and AI agents working on **TripMate Web** (`Capstone_FE`).

---

## 1. When to Activate This Skill

Activate this skill whenever the task involves:
- Creating a new TripMate Web screen, dialog, or UI component.
- Editing or refactoring existing UI components or feature views.
- Implementing an approved Web Screen Specification or visual mockup.
- Reviewing visual consistency, responsive breakpoints, or layout hierarchy.
- Applying CSS variables, Tailwind utility classes, or design tokens.
- Integrating motion, transitions, ScrollReveal, or Lenis smooth scrolling.
- Auditing accessibility (color contrast, keyboard focus, ARIA attributes).

---

## 2. Required Context & Reading Order

Before writing or modifying any UI code, you MUST inspect:
1. **Repository Rules & Workflow**: Read [`AGENTS.md`](file:///D:/FPT_University_các%20kì/CapStone_TripMate_DoAn/Capstone_FE-design-md/AGENTS.md) for Superpowers Protocol (Explore → Clarify → Spec → Plan → TDD → Verify) and route governance.
2. **Design System Specification**: Read [`DESIGN.md`](file:///D:/FPT_University_các%20kì/CapStone_TripMate_DoAn/Capstone_FE-design-md/DESIGN.md) for canonical tokens, typography scale, spacing, elevation, and component rules.
3. **Core Styling Definitions**: Check [`app/globals.css`](file:///D:/FPT_University_các%20kì/CapStone_TripMate_DoAn/Capstone_FE-design-md/app/globals.css) for active Tailwind `@theme` variables and utility classes.
4. **Existing Shared Components**: Check [`src/components/ui/`](file:///D:/FPT_University_các%20kì/CapStone_TripMate_DoAn/Capstone_FE-design-md/src/components/ui/) and [`src/components/layout/`](file:///D:/FPT_University_các%20kì/CapStone_TripMate_DoAn/Capstone_FE-design-md/src/components/layout/) before writing custom UI elements.
5. **Approved Task Specification**: Verify the approved screen specification or Jira use case (e.g. UC-10, UC-12, UC-26) to confirm scope.

---

## 3. Mandatory Behavioral Rules

1. **Preserve Current Visual Identity by Default**:
   - The current production UI/UX is the baseline authority.
   - Do NOT attempt to apply unsolicited visual redesigns, arbitrary color changes, or speculative themes.
   - Respect the established brand atmosphere: Central Vietnam travel heritage with clear operational clarity.

2. **Respect the Dual-Primary Color Architecture**:
   - **Brand Teal (`#006B5F` / hover `#007D6E`)**: Reserved for **Public Travel Discovery** (Landing Page, Tour Discovery, POI Explorer, Public Navigation, booking CTAs).
   - **Operational Blue (`#1D4ED8` / hover `#2563EB`)**: Reserved for **Account & Operational Workflows** (Sign In, Registration, Partner Management, Admin Console, Checkout, Financial Reports).
   - *Never merge or homogenize these two palettes into one universal primary color.*

3. **Reuse Existing Shared Components**:
   - Buttons: Use [`ActionButton.tsx`](file:///D:/FPT_University_các%20kì/CapStone_TripMate_DoAn/Capstone_FE-design-md/src/components/ui/ActionButton.tsx) or standard Tailwind classes with canonical tokens.
   - Form Inputs: Use [`FormControls.tsx`](file:///D:/FPT_University_các%20kì/CapStone_TripMate_DoAn/Capstone_FE-design-md/src/components/ui/FormControls.tsx) for consistent inputs, labels, and error messages.
   - Badges: Use [`StatusBadge.tsx`](file:///D:/FPT_University_các%20kì/CapStone_TripMate_DoAn/Capstone_FE-design-md/src/components/ui/StatusBadge.tsx) for status indicators.
   - Modals: Use [`LegalModal.tsx`](file:///D:/FPT_University_các%20kì/CapStone_TripMate_DoAn/Capstone_FE-design-md/src/components/ui/LegalModal.tsx) or the focus-trapped dialog pattern.
   - Brand Logo: Use [`src/components/brand/BrandLogo.tsx`](file:///D:/FPT_University_các%20kì/CapStone_TripMate_DoAn/Capstone_FE-design-md/src/components/brand/BrandLogo.tsx).

4. **Zero Duplicate or Hardcoded Design Tokens**:
   - Reference established `@theme` tokens or canonical Tailwind classes.
   - Do NOT add new arbitrary hex codes or create duplicate CSS custom properties without approval.

5. **Server Component Default**:
   - Author components as Server Components by default.
   - Add `'use client'` only at the outermost interactive boundary (event listeners, state hooks, browser APIs).

6. **Accessibility (a11y) Compliance**:
   - Maintain minimum 4.5:1 contrast for body copy and 3:1 for large display text against their backgrounds.
   - Provide visible focus rings (`focus-visible:ring-2`) on all interactive controls.
   - Ensure touch targets are at least 44x44px on mobile viewports.
   - Support `Escape` to dismiss and focus trapping for modal dialogs.

7. **Responsive Parity**:
   - Test every UI layout across Mobile (`<640px`), Tablet (`768px–1024px`), and Desktop (`>1024px`).
   - Prevent visual overflow and horizontal scrollbars.

---

## 4. Source-of-Truth Boundary

> [!CAUTION]
> **This Design System Skill governs PRESENTATION CONVENTIONS ONLY.**
> 
> It does **NOT** grant authority to:
> - Override or alter the official Report 3 SRS requirements.
> - Change business logic, validation rules, or pricing calculations.
> - Invent API contracts or backend endpoints.
> - Change user role permissions (Traveler, Tour Operator, Admin, Staff).
> - Bypass repository quality gates (`npm test`, `npm run lint`, `npm run typecheck`, `npm run build`).
> 
> *If an SRS requirement conflicts with a visual pattern, prioritize the approved functional specification and report the discrepancy to the developer.*

---

## 5. Quick Token Reference

```yaml
Brand Travel:
  teal: "#006B5F"
  bright-teal: "#007D6E"
  light-teal: "#E8F7F4"
  navy: "#00152A"
  coral: "#FF7043"

Operational:
  primary: "#1D4ED8"
  primary-container: "#2563EB"
  primary-fixed: "#EAF1FE"
  coral-accent: "#FF6A3D"
  violet-ai: "#7C3AED"

Surfaces:
  canvas: "#F4F7FC"
  card: "#FFFFFF"
  border: "#E2E8F0"
  text-primary: "#0F172A"
  text-secondary: "#64748B"

Typography:
  sans: '"Segoe UI", Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
  mono: 'Consolas, "Courier New", monospace'
  icons: 'Material Symbols Outlined'
```

---

## 6. Upstream Attribution & Reference

This internal design skill was synthesized using the architectural documentation methodologies cataloged in [`VoltAgent/awesome-design-md`](https://github.com/VoltAgent/awesome-design-md) (licensed under MIT License), drawing best practices from Linear, Airbnb, Vercel, and Apple design guidelines, specifically customized to TripMate Web's production design system.
