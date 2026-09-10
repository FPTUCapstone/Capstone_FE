# Implementation Plan — UC-50 Approve Tour Operator Application Web Frontend

## Overview

This implementation plan defines the Web Frontend implementation for **UC-50: Approve Tour Operator Application** in the `Capstone_FE` Next.js App Router project. It adds TypeScript DTOs, API Client methods, UI components (Company legal info card, Document viewer grid, Approve/Reject modals, Loading skeletons), and the Admin App Router page at `/admin/tour-operator-applications/[userId]`.

---

## Technical Context & Decisions

1. **Architecture Boundaries**:
   - Route composition lives in `app/admin/(console)/tour-operator-applications/[userId]/page.tsx`.
   - Substantial feature implementation lives in `src/features/admin/tour-operator-applications/`.
2. **Server/Client Components Boundary**:
   - Page route acts as Server Component wrapper or client boundary where interactive modals (ApproveModal, RejectModal, Toast alerts) require `'use client'`.
3. **API Integration**:
   - Connects directly to backend API running at `http://localhost:5021/api/v1/admin/tour-operator-applications/`.
   - Sends Bearer token in `Authorization` header.
4. **Rich Aesthetics & Clear Structural Layout**:
   - High-contrast Light Theme tailored to match the Admin Console (`#f7f9fc`).
   - Deep dark navy titles (`text-slate-900 font-extrabold`), double section borders (`border-2 border-slate-300 bg-white rounded-2xl p-6 shadow-sm`), and individual field container boxes (`border border-slate-200 bg-slate-50/70 p-4 rounded-xl`).
   - High-contrast action buttons: Emerald primary Approve button (`bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md`) and Rose outline Reject button (`border-2 border-rose-300 bg-white text-rose-700 hover:bg-rose-50 font-bold`).
   - Development mock fallback data for sample applications `#2` and `#3` for zero-setup live testing.

---

## Proposed File Changes

### Component 1: TypeScript Types & DTOs
- [NEW] [`tour-operator-application.ts`](file:///d:/study/Project-Capstone/Capstone_FE/src/types/tour-operator-application.ts): Type definitions for `OperatorDocumentDto`, `TourOperatorApplicationDetailDto`, `ApproveOperatorApplicationResponseDto`, and error contracts.

### Component 2: API Service & Client Layer
- [NEW] [`tourOperatorApplicationApi.ts`](file:///d:/study/Project-Capstone/Capstone_FE/src/features/admin/tour-operator-applications/api/tourOperatorApplicationApi.ts): Functions for `getDetail(userId)`, `approve(userId)`, `reject(userId, reason)`.

### Component 3: Feature UI Components
- [NEW] [`ApplicationHeader.tsx`](file:///d:/study/Project-Capstone/Capstone_FE/src/features/admin/tour-operator-applications/components/ApplicationHeader.tsx): Back button, company title, status badges, Approve/Reject buttons.
- [NEW] [`CompanyInfoCard.tsx`](file:///d:/study/Project-Capstone/Capstone_FE/src/features/admin/tour-operator-applications/components/CompanyInfoCard.tsx): Company name, Tax Code, Business License No, Phone, Address, Reviewer info.
- [NEW] [`DocumentsGrid.tsx`](file:///d:/study/Project-Capstone/Capstone_FE/src/features/admin/tour-operator-applications/components/DocumentsGrid.tsx): Document cards, status pills, file preview link, missing document alert.
- [NEW] [`ApproveModal.tsx`](file:///d:/study/Project-Capstone/Capstone_FE/src/features/admin/tour-operator-applications/components/ApproveModal.tsx): Confirmation dialog with loading spinner, API approve call, and MSG114 toast.
- [NEW] [`RejectModal.tsx`](file:///d:/study/Project-Capstone/Capstone_FE/src/features/admin/tour-operator-applications/components/RejectModal.tsx): Rejection reason dialog, UI stub call, and MSG116 toast.
- [NEW] [`DetailSkeleton.tsx`](file:///d:/study/Project-Capstone/Capstone_FE/src/features/admin/tour-operator-applications/components/DetailSkeleton.tsx): Loading skeletons for header, card, and documents grid.

### Component 4: App Router Page
- [NEW] [`page.tsx`](file:///d:/study/Project-Capstone/Capstone_FE/app/admin/(console)/tour-operator-applications/[userId]/page.tsx): Route page composing the detail view.

---

## Sequential Execution Tasks

### Task 1: TypeScript Types & DTOs Layer
- **Files**: `src/types/tour-operator-application.ts`.
- **Verification Command**: `npm run typecheck`
- **Definition of Done**: Defines all 4 DTO interfaces matching backend contracts.

### Task 2: API Service & Client Layer
- **Files**: `src/features/admin/tour-operator-applications/api/tourOperatorApplicationApi.ts`.
- **Verification Command**: `npm run typecheck`
- **Definition of Done**: Exported `getDetail`, `approve`, `reject` functions.

### Task 3: Feature UI Components (Header, Company Card, Documents Grid, Modals, Skeleton)
- **Files**: Files in `src/features/admin/tour-operator-applications/components/`.
- **Verification Command**: `npm run typecheck`
- **Definition of Done**: Rich Aesthetics UI components compiled without errors.

### Task 4: App Router Page Integration
- **Files**: `app/admin/(console)/tour-operator-applications/[userId]/page.tsx`.
- **Verification Command**: `npm run typecheck && npm run lint`
- **Definition of Done**: Route page resolves `params.userId`, fetches data, and renders interactive review surface.

### Task 5: Project Build Verification
- **Verification Command**: `npm run build`
- **Definition of Done**: Next.js production build succeeds with zero errors.

---

## Verification Plan

### Automated Checks
- `npm run typecheck`
- `npm run lint`
- `npm run build`

### Manual Verification
- Test running dev server (`npm run dev`) and viewing `http://localhost:3001/admin/tour-operator-applications/2` with backend running on `http://localhost:5021`.
