# Implementation Plan — UC-51 Frontend: Reject Tour Operator Application

## Overview
This implementation plan defines the Next.js / TypeScript frontend implementation for **UC-51: Reject Tour Operator Application** in `Capstone_FE`.

The feature provides an Administrator UI for rejecting a Tour Operator application with a mandatory reason modal prompt, error handling, and toast notification (`MSG116`).

---

## Technical Context & Decisions

1. **Framework**: Next.js (App Router), TypeScript, TailwindCSS, React Hook Form / Zod.
2. **State Management**: React Query / SWR / local state for modal & mutation.
3. **API Endpoint**: `POST /api/v1/admin/tour-operator-applications/{id}/reject`.
4. **Toast & Modal**: Follows design system components.

---

## Proposed Component Changes

### Component 1: Admin Feature Components
- [`RejectModal.tsx`](file:///d:/study/Project-Capstone/Capstone_FE/src/features/admin/tour-operator-applications/components/RejectModal.tsx): Rejection reason prompt dialog (`MSG115`).
- [`tourOperatorAdminService.ts`](file:///d:/study/Project-Capstone/Capstone_FE/src/features/admin/tour-operator-applications/services/tourOperatorAdminService.ts): `rejectApplication(id: string, reason: string)` API call.

---

## Verification Plan

### Automated / Lint Tests
- Run build check: `npm run build`
- Run lint check: `npm run lint`
