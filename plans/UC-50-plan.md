# Implementation Plan — UC-50 Frontend: Approve Tour Operator Application

## Overview
This implementation plan defines the Next.js / TypeScript frontend implementation for **UC-50: Approve Tour Operator Application** in `Capstone_FE`.

The feature enables Administrators to review applicant business/legal info, inspect uploaded Business License documents, and approve pending applications.

---

## Technical Context & Decisions

1. **Framework**: Next.js (App Router), TypeScript, TailwindCSS.
2. **State Management**: React Query / SWR / local React state.
3. **API Integration**: `GET /api/v1/admin/tour-operator-applications/{userId}` & `POST /api/v1/admin/tour-operator-applications/{userId}/approve`.
4. **Toast Notifications**: `MSG114` toast confirmation on success.

---

## Proposed Component Changes

### Component 1: Admin Feature Components
- [`ApplicationDetailView.tsx`](file:///d:/study/Project-Capstone/Capstone_FE/src/features/admin/tour-operator-applications/components/ApplicationDetailView.tsx): Review detail surface.
- [`DocumentViewer.tsx`](file:///d:/study/Project-Capstone/Capstone_FE/src/features/admin/tour-operator-applications/components/DocumentViewer.tsx): Business license document viewer.
- [`tourOperatorAdminService.ts`](file:///d:/study/Project-Capstone/Capstone_FE/src/features/admin/tour-operator-applications/services/tourOperatorAdminService.ts): API client endpoints.

---

## Verification Plan

### Automated / Build Checks
- Run build check: `npm run build`
- Run linting check: `npm run lint`
