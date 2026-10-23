---
version: 1.0.1
name: TripMate Web Design System
description: Official design system specification for TripMate Web (Capstone_FE) — documenting the production visual identity, design tokens, typography, layout, component architecture, responsive rules, motion, and accessibility conventions. Grounded in actual implementation evidence and structured using the design methodology from VoltAgent/awesome-design-md.
source-attribution:
  reference: "VoltAgent/awesome-design-md (https://github.com/VoltAgent/awesome-design-md)"
  license: "MIT License"
  methodology: "Curated design-system documentation schema synthesizing Linear, Airbnb, Vercel, and Apple standards adapted for TripMate"

colors:
  # Primary Brand Palette (Public Travel Discovery)
  brand-teal: "#006B5F"
  brand-brightTeal: "#007D6E"
  brand-lightTeal: "#E8F7F4"
  brand-navy: "#00152A"
  brand-navyContainer: "#102A43"
  brand-coral: "#FF7043"

  # Operational & Administrative Primary
  primary: "#1D4ED8"
  primary-container: "#2563EB"
  primary-fixed: "#EAF1FE"
  primary-fixed-dim: "#BFD7F5"

  # Functional Accents & Semantic Status
  secondary-coral: "#FF6A3D"
  secondary-container: "#FFF0EA"
  secondary-hover: "#E8582C"
  tertiary-violet: "#7C3AED"
  tertiary-container: "#F1EBFE"
  error: "#E02D4D"
  error-container: "#FDECEF"
  success-green: "#0E9F6E"
  success-container: "#E6F7F0"
  warning-amber: "#D97706"
  warning-container: "#FEF3E2"

  # Surfaces & Canvas
  surface: "#F4F7FC"
  surface-card: "#FFFFFF"
  surface-soft: "#F7F9FC"
  surface-dim: "#E1E8F3"
  surface-container-high: "#E3E9F5"

  # Typography & Content Colors
  ink-primary: "#0F172A"
  ink-heading: "#0F1B2D"
  ink-secondary: "#64748B"
  ink-variant: "#33425A"
  ink-muted: "#6B7C97"

  # Borders & Outlines
  border-default: "#E2E8F0"
  border-line: "#E1E8F3"
  outline: "#6B7C97"

typography:
  font-jakarta: "var(--font-jakarta)"
  font-geist-sans: "var(--font-geist-sans)"
  font-geist-mono: "var(--font-geist-mono)"
  font-sans-fallback: "'Segoe UI', Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
  font-mono-fallback: "Consolas, 'Courier New', monospace"
  font-icon: "'Material Symbols Outlined'"

radii:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "14px"
  2xl: "16px"
  3xl: "24px"
  full: "9999px"

shadows:
  soft: "0 4px 20px -2px rgba(0, 21, 42, 0.05)"
  btn: "0 4px 12px 0 rgba(0, 107, 95, 0.25)"
  card-lg: "0 24px 48px -16px rgba(0, 21, 42, 0.18)"
  card-sh: "0 1px 2px rgba(15, 27, 45, .06), 0 8px 22px rgba(15, 27, 45, .06)"
---

# TripMate Web — Design System Specification

## 1. Design Philosophy & Visual Identity

TripMate Web is an intelligent travel atlas and multi-tenant portal for Central Vietnam (Đà Nẵng, Hội An, Cố Đô Huế). The visual identity combines **editorial cultural heritage** with **clean operational utility**:

1. **Atmospheric Cultural Clarity**: Public interfaces leverage high-fidelity photographic landscapes, rich Navy (`#00152A`) backgrounds, deep Brand Teal (`#006B5F`), and energetic Coral (`#FF7043` / `#FF6A3D`) accents to evoke Vietnam's central coastline and ancient architectural heritage.
2. **Operational Rigor & Legibility**: Management, administrator, and partner workspaces utilize a crisp, structured Slate/White palette (`#FFFFFF` surfaces over `#F4F7FC` / `#F7F9FC` canvas) anchored by functional Blue (`#1D4ED8`) and Slate typography for optimal data density and rapid scanning.
3. **Continuous Motion & Flow**: Interactions feel fluid rather than abrupt, utilizing Lenis smooth scrolling, subtle ScrollReveal staggered fades, and physics-based capsule indicator transitions.
4. **Zero Unjustified Decoration**: UI chrome recedes behind authentic photography and verified travel data; rounded corners, borders, and shadows have clear functional roles.

> [!NOTE]
> This document specifies the **CURRENT production design language** of TripMate Web as implemented in Next.js 16 (App Router) and Tailwind CSS. It is the baseline authority for frontend visual consistency.

---

## 2. Color Palette & Canonical Token Architecture

TripMate uses a hybrid semantic token architecture defined in `app/globals.css` with Tailwind CSS v4 `@theme` and dynamic CSS custom properties in `:root`.

### 2.1 Color Tokens & Semantic Roles

| Tailwind Utility | CSS Token (`@theme` / `:root`) | Hex Value | Primary Role & Consumers |
|---|---|---|---|
| `bg-brand-teal` / `text-brand-teal` | `--color-brand-teal` / `--brand-teal` | `#006B5F` | Primary travel public actions, brand buttons, active destination chips, public search CTAs. |
| `bg-brand-brightTeal` / `text-brand-brightTeal` | `--color-brand-brightTeal` / `--brand-brightTeal` | `#007D6E` | Hover/focus states on teal elements, icon badges, active highlight accents. |
| `bg-brand-lightTeal` / `text-brand-lightTeal` | `--color-brand-lightTeal` / `--brand-lightTeal` | `#E8F7F4` | Tinted background for active navigation items, status pills, text selection highlight. |
| `bg-brand-navy` / `text-brand-navy` | `--color-brand-navy` / `--brand-navy` | `#00152A` | Hero sections, dark public footer, high-contrast headings, card hover backdrops. |
| `bg-brand-navyContainer` | `--color-brand-navyContainer` / `--brand-navyContainer` | `#102A43` | Dark elevation surfaces, secondary navigation containers on dark surfaces. |
| `bg-primary` / `text-primary` | `--color-primary` / `--brand` | `#1D4ED8` | Operational primary actions (admin, partner, traveler profile, checkout), focus rings. |
| `bg-primary-container` | `--color-primary-container` / `--brand6` | `#2563EB` | Active operational buttons, hover states on operational primary elements. |
| `bg-primary-fixed` | `--color-primary-fixed` / `--brand1` | `#EAF1FE` | Operational badge backgrounds, selected list item highlights. |
| `bg-brand-coral` / `bg-secondary` | `--color-brand-coral` / `--color-secondary` / `--acc` | `#FF7043` / `#FF6A3D` | Key waypoints, promotional badges, attention alerts, rating icons, secondary highlights. |
| `hover:bg-coral-hover` | `--color-coral-hover` | `#E8582C` | Interactive hover state for coral buttons and links. |
| `bg-tertiary` / `text-tertiary` | `--color-tertiary` / `--vio` | `#7C3AED` | AI itinerary generation badges, intelligent rerouting highlights, algorithmic tags. |
| `bg-tertiary-container` | `--color-tertiary-container` / `--vio1` | `#F1EBFE` | Background for AI and algorithmic feature containers. |
| `bg-error` / `text-error` | `--color-error` / `--red` | `#E02D4D` | Form validation errors, destructive modal actions, failed payment or cancellation badges. |
| `bg-error-container` | `--color-error-container` / `--red1` | `#FDECEF` | Alert backgrounds for errors and rejections. |
| `bg-surface` / `bg-brand-surface` | `--color-surface` / `--color-brand-surface` / `--bg` | `#F4F7FC` / `#F7F9FC` | Global page canvas background (light, clean, modern cool-slate; applied on `<body>`). |
| `bg-brand-card` | `--color-brand-card` / `--color-surface-bright` | `#FFFFFF` | Standard card, modal, dialog, and panel background. |
| `border-brand-border` | `--color-brand-border` / `--color-outline-variant` / `--line` | `#E2E8F0` / `#E1E8F3` | Card dividers, input borders, table borders, panel separators. |
| `text-brand-textPrimary` | `--color-brand-textPrimary` / `--color-on-surface` / `--ink` | `#0F172A` / `#0F1B2D` | Primary body copy, table text, form labels, card titles. |
| `text-brand-textSecondary` | `--color-brand-textSecondary` / `--color-on-surface-variant` / `--ink2` | `#64748B` / `#33425A` | Subtitles, helper text, timestamps, table column headers, metadata. |

### 2.2 Semantic Color Rule: Dual-Primary Architecture

> [!IMPORTANT]
> **Teal (`#006B5F`) and Blue (`#1D4ED8`) serve different semantic domains:**
> - **Brand Teal (`#006B5F`)**: Reserved for **Public Travel Discovery** (Landing Page, Tour Discovery, POI Explorer, Public Capsule Navigation).
> - **Operational Blue (`#1D4ED8`)**: Reserved for **Account & Operational Workflows** (Sign In, Registration, Partner Portal, Admin Console, Checkout, Financial Management).
> 
> *Never merge or homogenize these two palettes into a single arbitrary primary color.*

---

## 3. Typography & Hierarchy

### 3.1 Font Configuration

TripMate Web integrates modern typography through Next.js Font in `app/layout.tsx` and CSS token definitions in `app/globals.css`:

```tsx
// app/layout.tsx font imports
const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin', 'vietnamese'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin', 'vietnamese'] });
const jakarta = Plus_Jakarta_Sans({ variable: '--font-jakarta', subsets: ['latin', 'vietnamese'], weight: ['400', '500', '600', '700', '800'] });
```

```css
/* app/globals.css font fallbacks */
--font-sans: "Segoe UI", Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: Consolas, "Courier New", monospace;
```

- **Primary UI Type**: Plus Jakarta Sans and Geist Sans provide optimal legibility, clean geometry, and full Vietnamese diacritics support.
- **Iconography**: Google Material Symbols Outlined (`.material-symbols-outlined`), loaded via Google Fonts with variable axis `wght 400`, `opsz 24`.
- **Code & IDs**: Geist Mono / Consolas for booking reference codes, UUIDs, and API tokens.

### 3.2 Typographic Hierarchy Scale

| Level | Size | Weight | Tracking | Usage |
|---|---|---|---|---|
| **Display Hero** | `text-4xl` to `text-5xl` (36px–48px) | `font-extrabold` (800) | `-0.025em` (`tracking-tight`) | Public Landing Hero headline ("Khám phá miền Trung theo cách của bạn"). |
| **Section Title** | `text-2xl` to `text-3xl` (24px–30px) | `font-bold` (700) | `-0.02em` | Major section headers ("Ba Điểm Đến Biểu Tượng Miền Trung", "Khám phá địa điểm"). |
| **Card / Modal Title**| `text-lg` to `text-xl` (18px–20px) | `font-bold` (700) | `normal` | POI cards, Tour cards, Dialog headers, Panel titles. |
| **Subheading / Label** | `text-sm` to `text-base` (14px–16px) | `font-semibold` (600) | `normal` | Form labels, table headers, navigation links, stat values. |
| **Body Regular** | `text-sm` (14px) / `text-base` (16px) | `font-normal` (400) | `normal` | Descriptions, editorial text, reviews, terms of service. |
| **Caption & Meta** | `text-xs` (12px) | `font-medium` (500) | `+0.01em` | Badges, tags, opening hours, distances, helper text. |
| **Micro Tag** | `text-[11px]` to `text-[10px]` | `font-bold` (700) | `+0.05em` (`uppercase`) | Category labels, status indicators, counter badges. |

---

## 4. Spacing, Layout & Grid Conventions

### 4.1 Spacing Scale

TripMate adheres to the Tailwind 4px base increment (`p-1` = 4px, `p-2` = 8px, `p-4` = 16px, `p-6` = 24px, `p-8` = 32px):

- **Component Internal Padding**:
  - Buttons (compact): `px-3 py-1.5`
  - Buttons (standard): `px-4 py-2` or `px-5 py-2.5`
  - Cards: `p-5` or `p-6`
  - Modals: `p-6` to `p-8`
- **Section Spacing**:
  - Page container vertical padding: `py-8` to `py-16`
  - Grid gaps: `gap-4` (compact lists), `gap-6` (standard card grids), `gap-8` (major layout splits)

### 4.2 Layout Containers & Max Widths

- **Public Content**: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` (1280px standard container)
- **Narrow Editorial**: `max-w-4xl mx-auto` (896px for terms, articles, single-column reading)
- **Operational Console (Admin/Partner)**: `max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8` for dense data tables
- **Auth Shell**: Centered split hero or card container (`max-w-md` for forms, `max-w-4xl` for split auth)

---

## 5. Border Radius & Elevation System

### 5.1 Radius Architecture

- **Micro Radii (`rounded-md` / 6px)**: Checkboxes, dropdown items, table row action buttons.
- **Element Radii (`rounded-xl` / 12px to `rounded-2xl` / 16px)**: Standard cards, form inputs, modal dialogs, map containers.
- **Pill / Capsule (`rounded-full` / 9999px)**: Public Navigation capsule, category chips, status badges, hero filter pills.

### 5.2 Elevation & Shadow Architecture

```css
--shadow-soft: 0 4px 20px -2px rgba(0, 21, 42, 0.05);
--shadow-btn: 0 4px 12px 0 rgba(0, 107, 95, 0.25);
--shadow-card-lg: 0 24px 48px -16px rgba(0, 21, 42, 0.18);
--sh: 0 1px 2px rgba(15, 27, 45, .06), 0 8px 22px rgba(15, 27, 45, .06);
```

- **Flat/Subtle (`shadow-2xs` / `shadow-xs`)**: Standard cards, table rows, form controls.
- **Floating Element (`shadow-soft` / `shadow-md`)**: Floating search bars, category selectors, dropdown popovers.
- **Modal / High Elevation (`shadow-card-lg` / `shadow-2xl`)**: Dialog overlays, persistent navigation capsule, prominent callout cards.

---

## 6. Shared Component Guidelines

### 6.1 Buttons & Interactive Controls

| Variant | Tailwind Classes | Usage |
|---|---|---|
| **Public Primary (Teal)** | `bg-[#006B5F] hover:bg-[#007D6E] text-white font-bold rounded-xl shadow-btn transition` | Primary booking CTA, search execution, public registration. |
| **Operational Primary (Blue)** | `bg-[#1D4ED8] hover:bg-[#2563EB] text-white font-bold rounded-xl transition` | Admin approvals, login submission, profile update, checkout confirmation. |
| **Secondary Outline** | `border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition` | Secondary actions, cancel buttons, back navigation, filters. |
| **Ghost / Subtle** | `text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg p-2 transition` | Table row action buttons, icon triggers, close buttons. |
| **Destructive** | `bg-[#E02D4D] hover:bg-[#C81E3D] text-white font-bold rounded-xl transition` | Delete route, cancel payout, ban user account. |

### 6.2 Status Badges

Utilize [`StatusBadge.tsx`](src/components/ui/StatusBadge.tsx):

- **Active / Approved / Paid**: `bg-emerald-50 text-emerald-700 border-emerald-200`
- **Pending / In Review**: `bg-amber-50 text-amber-700 border-amber-200`
- **Rejected / Cancelled**: `bg-rose-50 text-rose-700 border-rose-200`
- **Draft / Inactive**: `bg-slate-100 text-slate-600 border-slate-200`

### 6.3 Form Controls

Utilize [`FormControls.tsx`](src/components/ui/FormControls.tsx):

- Height: 44px minimum for touch target compliance.
- Border: `border border-slate-200 rounded-xl bg-white px-3.5 py-2.5 text-sm`.
- Focus Ring: `focus:border-teal-500 focus:ring-2 focus:ring-teal-200 focus:outline-none` (Public) or `focus:border-blue-500 focus:ring-2 focus:ring-blue-200` (Operational).
- Error State: `border-rose-400 focus:border-rose-500 focus:ring-rose-100` accompanied by a visible error message.

### 6.4 Modals & Dialogs

Utilize [`LegalModal.tsx`](src/components/ui/LegalModal.tsx) or pattern:

- Backdrop: `fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4`.
- Dialog Container: `w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100`.
- Accessibility: Focus trapped inside the dialog, first interactive element auto-focused, `Escape` key listener closes the modal, focus restored to trigger element on dismiss.

---

## 7. Responsive Design Principles

TripMate Web is built mobile-first, targeting three primary viewports:

| Viewport | Tailwind Breakpoint | Layout Behavior |
|---|---|---|
| **Mobile** | `< 640px` (`sm`) | Single-column stack, full-width cards, drawer/sheet navigation, sticky bottom CTAs where needed. |
| **Tablet** | `640px – 1024px` (`md`, `lg`) | 2-column card grids, horizontal filter bars, collapsed sidebar for admin console. |
| **Desktop** | `> 1024px` (`lg`, `xl`, `2xl`) | Floating public capsule navigation, multi-column editorial layouts (60/40 splits for map/timeline), fixed admin sidebar. |

---

## 8. Motion, Lenis & Animation Conventions

TripMate incorporates a curated motion system designed for smooth, premium feel without visual clutter:

1. **Lenis Smooth Scroll**: Configured in `SmoothScrollProvider.tsx` (`html.lenis`), active on public routes for fluid inertia scrolling.
2. **ScrollReveal Transitions**: Uses `ScrollReveal.tsx` with `data-revealed` attribute, driven by `--motion-ease-out-cubic: cubic-bezier(0.16, 1, 0.3, 1)` and durations from `300ms` to `700ms`.
3. **Sliding Capsule Navigation**: The desktop navigation capsule employs `.nav-sliding-pill` and `.nav-hover-pill` with `280ms cubic-bezier(0.16, 1, 0.3, 1)` transitions for magnetic tab tracking.
4. **Accessible Reduced-Motion**: When `prefers-reduced-motion: reduce` is detected without explicit full-motion override, continuous loops and entrance animations are safely disabled (`animation: none !important; transform: none !important`).

---

## 9. Accessibility (a11y) Standards

- **Color Contrast**: All text pairings must meet WCAG 2.1 AA standards (minimum 4.5:1 for body copy, 3:1 for large display headlines).
- **Keyboard Navigation**: All interactive elements (`button`, `a`, `input`, `select`) must have visible focus rings (`focus-visible:ring-2`).
- **Interactive Targets**: Minimum 44x44px touch targets on mobile devices.
- **ARIA & Semantics**: Explicit `role="dialog"`, `aria-modal="true"`, `aria-label`, and `aria-expanded` attributes on dynamic navigation, dropdowns, and modals.

---

## 10. Rules for Introducing New UI Components

1. **Inspect Before Creating**: Always check `src/components/ui/`, `src/components/layout/`, and existing feature modules before authoring a new component.
2. **Adhere to Server Component Default**: Place components in `src/features/<feature>/components/` or `src/components/`. Mark with `'use client'` only when interactive browser state (hooks, event listeners) is required.
3. **Token Compliance**: Always reference canonical tokens (`#006B5F`, `#1D4ED8`, `#00152A`, `#F4F7FC`) or Tailwind theme classes (`bg-brand-teal`, `text-brand-textPrimary`, `bg-primary`). Never introduce arbitrary new brand colors.
4. **Responsive Testing**: Every new component must be verified across Mobile (375px), Tablet (768px), and Desktop (1280px+).

---

## 11. Relationship to AGENTS.md & Governance

- `DESIGN.md` governs **visual presentation and styling conventions only**.
- It does **NOT** authorize new routes, database schema modifications, or changes to the approved Report 3 SRS business rules.
- When an approved SRS use case specifies screen behavior, `DESIGN.md` dictates the visual styling, while `AGENTS.md` and `docs/WEB_SCOPE_MATRIX.md` dictate platform ownership and implementation workflow.
