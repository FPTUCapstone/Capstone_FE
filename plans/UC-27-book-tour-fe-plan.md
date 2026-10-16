# UC-27 Frontend Implementation Plan — Book Tour

**Feature:** UC-27 Book Tour  
**Platform:** Next.js / React  
**Status:** Draft  
**Specification:** `specs/UC-27-book-tour-fe-spec.md`  

---

## 1. Delivery Boundary

This plan delivers:
- `/traveler/tours/:tourScheduleId/book` route
- TourBookingForm component (multi-step form)
- ParticipantForm component (dynamic participant fields)
- PriceBreakdown component
- Confirmation dialog
- API integration (quote, create booking)
- Error handling & validation feedback
- Responsive design (mobile/tablet/desktop)

Does NOT include:
- Tour search/discovery (UC-10)
- Payment processing UI (UC-28)
- Booking management pages
- Tour details page (assumed to exist)

---

## 2. Critical Blockers — MUST RESOLVE FIRST

### ⚠️ P0: Backend API Contract

1. **Quote Endpoint**
   - Endpoint: `POST /api/v1/traveler/tour-bookings/quote`
   - Response format confirmed (tourScheduleId, subtotal, discount, total, appliedVoucher)
   - Error response format (error code + message)
   - **Confirm API is deployed and testable**

2. **Create Booking Endpoint**
   - Endpoint: `POST /api/v1/traveler/tour-bookings`
   - Request format confirmed (exact field names)
   - Response format confirmed
   - **Confirm API is deployed and testable**

### ⚠️ P1: Tour Details API

- Assume tour schedule details (name, dates, price/pax, remaining slots) available via:
  - `GET /api/v1/tours/:tourScheduleId` (or similar)
  - Or pre-fetched from previous page navigation
- **Confirm API contract**

### ⚠️ P1: Authentication & Authorization

- Traveler role check: User is authenticated AND role = "Traveler"
- Non-Traveler redirect: 403 → show error, offer sign-in
- **Confirm existing auth interceptor covers this**

---

## 3. Task Breakdown

### Task 1: Page Route & Layout

**Files to create:**
- `app/traveler/tours/[tourScheduleId]/book/page.tsx` (Server Component)
- `app/traveler/tours/[tourScheduleId]/book/layout.tsx` (breadcrumb, back button)
- `src/features/traveler/booking/components/BookTourPageContent.tsx` (Client Component)

**Key Points:**
- Fetch tour schedule details server-side
- Redirect if tour not found (404)
- Protect route: role check
- Pass tour details as props to client component

**Timeline:** 1 day  
**Verify:** Page loads, tour details displayed

---

### Task 2: TourBookingForm Component & State

**Files:**
- `src/features/traveler/booking/components/TourBookingForm.tsx` (Client Component)
- `src/features/traveler/booking/hooks/useTourBookingForm.ts` (custom hook)
- `src/features/traveler/booking/types/booking.ts` (TypeScript types)

**State Management:**
```typescript
interface BookingFormState {
  numberOfParticipants: number;
  participants: Participant[];
  contactInfo: ContactInfo;
  voucherCode: string;
  quote: QuoteResponse | null;
  loading: boolean;
  errors: ValidationErrors;
  showConfirmation: boolean;
}
```

**Handlers:**
- `handleNumberOfParticipantsChange` → update form, fetch quote
- `handleVoucherApply` → fetch quote with voucher
- `handleVoucherRemove` → fetch quote without voucher
- `handleConfirmBooking` → POST to create booking endpoint

**Timeline:** 2 days  
**Verify:** Form state updates correctly, no console errors

---

### Task 3: ParticipantForm Component (Dynamic Fields)

**Files:**
- `src/features/traveler/booking/components/ParticipantForm.tsx`
- `src/features/traveler/booking/components/ParticipantFieldSet.tsx`

**Features:**
- Dynamic form fields based on `numberOfParticipants`
- Each participant has: name, DOB, ID, phone
- Add/remove participant buttons
- Client-side validation feedback (email format, etc.)
- Error messages from server

**Timeline:** 1.5 days  
**Verify:** Adding/removing participants works, validation shows/hides

---

### Task 4: ContactInfo Form

**Files:**
- `src/features/traveler/booking/components/ContactInfoForm.tsx`

**Fields:**
- Full name (text input)
- Email (email input with validation)
- Phone number (tel input)

**Timeline:** 0.5 days  
**Verify:** Form displays, validates email/phone format

---

### Task 5: PriceBreakdown Component

**Files:**
- `src/features/traveler/booking/components/PriceBreakdown.tsx`

**Display:**
- Subtotal = price/pax × numberOfParticipants
- Discount (if voucher applied)
- Total (bold, large)
- Remaining slots display
- Loading spinner while fetching quote

**Timeline:** 0.5 days  
**Verify:** Displays correctly with sample data, loading state works

---

### Task 6: Confirmation Dialog

**Files:**
- `src/features/traveler/booking/components/ConfirmationDialog.tsx`

**Content:**
- Summary: tour name, dates, participants, total
- Message: "You have 15 minutes to complete payment"
- [Confirm] [Cancel] buttons
- Keyboard focus trap
- Accessible (aria-labelledby, aria-modal)

**Timeline:** 1 day  
**Verify:** Dialog shows/hides, focus management works

---

### Task 7: API Integration Layer

**Files:**
- `src/features/traveler/booking/services/bookingApi.ts`
  - `fetchQuote(tourScheduleId, numberOfParticipants, voucherCode)`
  - `submitBooking(bookingData)`
  - Error mapping (Backend error codes → user messages)

**Error Handling:**
- Map Backend error codes (MSG65, MSG77, MSG78, etc.) to user-friendly messages
- 401 → trigger re-auth (use existing auth interceptor)
- 403 → show "Not available for non-Travelers"
- 5xx → "Service unavailable"

**Timeline:** 1.5 days  
**Verify:** API calls work, error responses handled correctly

---

### Task 8: Form Validation & Error Display

**Files:**
- `src/features/traveler/booking/utils/validation.ts`
  - Client-side field validation (email, phone, required fields)
  - Error message display helpers

**Validation Rules:**
- Participant name: non-empty, max 255 chars
- DOB: valid date, optional age check
- Phone: valid format (+84 or 10-11 digits)
- Email: RFC 5322 format

**Timeline:** 1 day  
**Verify:** Validation messages display correctly, form prevents invalid submission

---

### Task 9: Responsive Design & Styling

**Files:**
- Use existing Tailwind/styling system
- Components responsive: mobile/tablet/desktop layouts
- Sticky pricing footer on mobile

**Timeline:** 1 day  
**Verify:** Page renders correctly at 375px, 768px, 1024px viewports

---

### Task 10: Integration Tests & Manual Testing

**Files:**
- `src/features/traveler/booking/__tests__/TourBookingForm.test.tsx`
- Postman collection for API endpoints
- Test coverage checklist

**Test Scenarios:**
- Form submission with valid data
- Form submission with validation errors
- Voucher application/removal
- Insufficient slots error
- Server error handling
- Confirmation dialog interaction

**Timeline:** 2 days  
**Verify:** All tests pass, manual testing complete

---

## 4. Component Dependency Graph

```
BookTourPageContent (Server + Client)
  ├─ TourBookingForm (Client)
  │  ├─ ParticipantForm
  │  │  └─ ParticipantFieldSet × N
  │  ├─ ContactInfoForm
  │  ├─ PriceBreakdown
  │  ├─ VoucherForm
  │  └─ ConfirmationDialog
  └─ bookingApi (service layer)
```

---

## 5. External Dependencies

| Dependency | Status | Owner |
|-----------|--------|-------|
| Backend API (quote endpoint) | TBD | BE Team |
| Backend API (create booking) | TBD | BE Team |
| Tour details API | Assumed existing | — |
| Auth interceptor (401 handling) | Existing | — |
| Tailwind CSS | Existing | — |

---

## 6. Risks & Mitigation

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Backend API not ready | High | Use mock API responses until ready |
| Tour details API format differs | Medium | Confirm contract early, use adapter pattern |
| Network failures during quote fetch | Medium | Retry logic, loading skeleton |
| Form data too large (many participants) | Low | Limit participants to 50 (business rule TBD) |

---

## 7. Testing Strategy

```
Task 1-5: Unit tests for components (Jest + React Testing Library)
Task 6: Accessibility tests for dialog (axe-core)
Task 7: API integration tests (MSW - Mock Service Worker)
Task 8: Validation logic unit tests
Task 9: Responsive design manual tests (Chrome DevTools)
Task 10: End-to-end tests (Playwright) + manual testing
```

---

## 8. Effort Estimate

| Task | Days | Notes |
|------|------|-------|
| Task 1 (Route & Layout) | 1 | Straightforward page setup |
| Task 2 (Form State) | 2 | Custom hook, state management |
| Task 3 (Participant Fields) | 1.5 | Dynamic form fields |
| Task 4 (Contact Form) | 0.5 | Simple form |
| Task 5 (Price Display) | 0.5 | Component composition |
| Task 6 (Dialog) | 1 | Accessibility focus |
| Task 7 (API Integration) | 1.5 | Error mapping, retry logic |
| Task 8 (Validation) | 1 | Client & server validation |
| Task 9 (Responsive Design) | 1 | Tailwind styling |
| Task 10 (Tests & Manual) | 2 | Test coverage, QA |
| **TOTAL** | **12 days** | ~2 weeks (with code review) |

---

## 9. Execution Order

1. **Approve Spec + Blockers** (Day 0)
2. **Task 1** → Task 2 (Days 1-3)
3. **Task 3** → Task 4 → Task 5 (parallel) (Days 4-5)
4. **Task 6** → Task 7 (Days 6-7)
5. **Task 8** (Day 8)
6. **Task 9** (Day 9)
7. **Task 10** (Days 10-11)
8. **Code review + fixes** (Days 12-13)

---

## 10. Definition of Done

- [ ] Spec approved by team
- [ ] All 10 tasks implemented
- [ ] Unit tests pass (>80% coverage)
- [ ] Responsive design verified (mobile/tablet/desktop)
- [ ] Accessibility checks pass (keyboard nav, aria labels)
- [ ] Error messages map to SRS codes (MSG65, MSG77, etc.)
- [ ] API integration tested with mock & real Backend
- [ ] Manual testing with Postman + browser
- [ ] No P1/P2 code review findings
- [ ] Ready for user acceptance testing

---

## Approval Gates

- [ ] Specification approved
- [ ] Backend API contracts confirmed
- [ ] Tour details API contract confirmed
- [ ] Design/accessibility requirements approved
- [ ] Team capacity confirmed for 12-day effort
