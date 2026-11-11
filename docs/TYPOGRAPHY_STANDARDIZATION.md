# TripMate Web — Typography Architecture Decision Record & Standardization Guide

**Status:** APPROVED & IMPLEMENTED  
**Date:** 2026-11-03  
**Authors:** Senior Frontend & UI/UX Engineering Team  
**Scope:** TripMate Web Application (`Capstone_FE`)  
**Target:** Production Baseline (`develop`)

---

## 1. Executive Summary & Context

Prior to this standardization, TripMate Web exhibited visual inconsistencies across different pages, platforms, and native form elements. While `Plus_Jakarta_Sans` and `Geist` were imported in `app/layout.tsx` via `next/font/google`, the Tailwind `@theme` configuration in `app/globals.css` hardcoded `--font-sans` to `"Segoe UI", Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;`. 

As a result:
- The design system's intended primary font (`Plus Jakarta Sans`) was bypassed in the CSS cascade.
- Windows clients rendered *Segoe UI*, macOS rendered *San Francisco*, and Linux rendered generic system fonts.
- Native interactive form controls (`input`, `button`, `select`, `textarea`) reverted to browser User-Agent fonts rather than inheriting the page font.
- Developers occasionally introduced ad-hoc inline classes such as `font-[family-name:var(--font-jakarta)]` to force rendering in specific components (e.g., `CreateCouponForm.tsx`), increasing stylistic divergence.

This specification documents the unified canonical typography architecture established in PR #135.

---

## 2. Architecture Decision: Canonical Font Family

### 2.1 Primary UI Type: Plus Jakarta Sans
- **Font Family:** `Plus Jakarta Sans` (`var(--font-jakarta)`)
- **Authority:** Approved in TripMate Web Design System (`DESIGN.md` §3.1), Internal Design Skill (`.agents/skills/tripmate-design-system/SKILL.md`), and the 72 Use Cases Design Inventory (`stitch_tripmat_72UC/index.html`).
- **Characteristics:** Modern geometric grotesque with warm humanist nuances, optimized for digital screens, mobile viewports, and complex tabular data interfaces.
- **Vietnamese Language Support:** Full native diacritics coverage (`ă â ê ô ơ ư đ Ă Â Ê Ô Ơ Ư Đ` and tonal markers: sắc, huyền, hỏi, ngã, nặng) under Unicode NFC normalization.
- **Weights Supported:** 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold), 800 (ExtraBold).

### 2.2 Secondary Modern Fallback: Geist Sans
- **Font Family:** `Geist Sans` (`var(--font-geist-sans)`)
- **Role:** High-legibility technical sans-serif font engineered for high-density modern web applications. Serves as immediate fallback if Plus Jakarta Sans fails or during asset swapping.

### 2.3 Monospace Font: Geist Mono
- **Font Family:** `Geist Mono` (`var(--font-geist-mono)`), backed by `Consolas, "Courier New", monospace`.
- **Role:** Booking confirmation IDs, coupon codes, GPS coordinates, financial audit logs, and technical telemetry.

### 2.4 Iconography: Material Symbols Outlined
- **Font Family:** `Material Symbols Outlined` (`.material-symbols-outlined`)
- **Role:** Scalable vector symbol ligatures loaded via Google Fonts. Strictly isolated from global typography cascades to prevent glyph corruption.

---

## 3. Global CSS Cascade & Token Architecture

The token hierarchy is structured in `app/globals.css` using Tailwind CSS v4 `@theme` and native CSS `:root` custom properties:

```css
@theme {
  --font-sans: var(--font-jakarta), var(--font-geist-sans), "Segoe UI", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
  --font-mono: var(--font-geist-mono), Consolas, "Courier New", monospace;
}

:root {
  --font-sans: var(--font-jakarta), var(--font-geist-sans), "Segoe UI", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
  --font-mono: var(--font-geist-mono), Consolas, "Courier New", monospace;
}
```

### 3.1 Document Root Application
Both `<html>` and `<body>` declare `font-family: var(--font-sans)`:
```css
html {
  overflow-x: clip;
  font-family: var(--font-sans);
}

body {
  margin: 0;
  overflow-x: clip;
  font-family: var(--font-sans);
  background-color: #F4F7FC;
  color: #0F1B2D;
}
```

### 3.2 Form Control & Portal Normalization
To prevent browser User-Agent font overriding on interactive controls, inheritance is enforced globally:
```css
/* Consistent typography inheritance for native interactive form controls */
button,
input,
optgroup,
select,
textarea {
  font-family: inherit;
  font-feature-settings: inherit;
  font-variation-settings: inherit;
}

/* Third-party widget & dialog typography normalization */
[role="dialog"],
.mapboxgl-popup,
.mapboxgl-ctrl,
.mapboxgl-ctrl-group {
  font-family: var(--font-sans);
}
```

---

## 4. Root Layout Integration (`app/layout.tsx`)

Next.js `next/font/google` preloads font subsets and injects optimized CSS variables with `display: 'swap'` to eliminate Cumulative Layout Shift (CLS):

```tsx
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});
```

The font variables are attached to both `<html>` and `<body>`:
```tsx
<html lang="vi" className={`${geistSans.variable} ${geistMono.variable} ${jakarta.variable}`}>
  <body
    className={`${geistSans.variable} ${geistMono.variable} ${jakarta.variable} antialiased bg-brand-surface font-sans text-brand-textPrimary selection:bg-brand-lightTeal selection:text-brand-teal`}
    suppressHydrationWarning
  >
```

---

## 5. Developer Guide for Authoring New Components

When building new features in `src/features/` or `src/components/`:

1. **Do Not Hardcode Fonts:** Never use arbitrary font classes like `font-[family-name:...]` or inline `style={{ fontFamily: '...' }}`.
2. **Inherit by Default:** Standard elements automatically inherit `Plus Jakarta Sans` from `<body>`. Use Tailwind font-weight utilities (`font-normal`, `font-medium`, `font-semibold`, `font-bold`, `font-extrabold`) to establish visual hierarchy.
3. **Use `font-mono` for Technical Data:** Apply `font-mono` when displaying booking IDs, hashes, timestamps, or numerical metrics in tables.
4. **Icons:** Use `<span className="material-symbols-outlined">icon_name</span>` for Material Symbols or standard SVG components. Never apply blanket CSS rules that override `.material-symbols-outlined`.
5. **Portals & Modals:** Components portalled to `document.body` via `createPortal` automatically inherit `var(--font-sans)` from `body`.
