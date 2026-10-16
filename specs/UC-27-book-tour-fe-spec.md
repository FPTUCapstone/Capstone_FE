# UC-27 Frontend Specification — Book Tour

**Feature:** UC-27 Book Tour  
**Platform:** Web / Next.js + React  
**Status:** Draft  
**Contract basis:** SRS 3.5.4 + Backend UC-27 API  

---

## 1. Purpose

UC-27 allows an authenticated Traveler to book a tour package by:
1. Selecting a departure schedule
2. Entering participant & contact information
3. Optionally applying a voucher
4. Previewing pricing (from Backend)
5. Confirming the booking

---

## 2. Scope & Exclusions

### Supported

- Traveler-only feature (role-based access)
- Multi-participant form with dynamic fields
- Contact information (separate from participants)
- Voucher application/removal with real-time quote update
- Server-computed pricing display (BR-63)
- Confirmation dialog before submission
- Loading states, error messages per SRS
- Form state persistence (session-level, not storage)

### Out of Scope

- Payment processing (UC-28)
- E-ticket display (UC-29)
- Booking management / cancellation
- Tour search / discovery (separate feature)
- Tour Operator bookings

---

## 3. Page Layout & Components

### Route

```
/traveler/tours/:tourScheduleId/book
```

### Page Structure

```
Header
  ├─ Tour Name, Dates
  ├─ [Back] to tour details
  └─ Progress indicator (1/3 Participants, 2/3 Contact, 3/3 Confirm)

Main Content
  ├─ Section 1: Participant Details
  │  ├─ "Number of participants" input (1-99)
  │  ├─ Dynamic participant form fields (Name, DOB, ID, Phone) × N
  │  ├─ [+ Add Participant] button
  │  └─ Per-field validation feedback
  │
  ├─ Section 2: Contact Information
  │  ├─ Contact name input
  │  ├─ Email input
  │  ├─ Phone number input
  │  └─ [Save as default] checkbox (future feature)
  │
  ├─ Section 3: Pricing & Voucher
  │  ├─ Price breakdown display
  │  │  ├─ Price per person
  │  │  ├─ Number of participants
  │  │  ├─ Subtotal = price × participants
  │  │  ├─ Discount (if voucher applied)
  │  │  └─ Total (bold, large)
  │  ├─ Voucher section
  │  │  ├─ Voucher code input
  │  │  ├─ [Apply] button
  │  │  ├─ Applied voucher display (with discount %)
  │  │  └─ [Remove] link if voucher applied
  │  └─ "Loading quote..." spinner (while fetching from Backend)
  │
  └─ Action Buttons
     ├─ [Cancel / Back] → return to tour details
     └─ [Confirm Booking] → opens confirmation dialog

Confirmation Dialog
  ├─ Summary: tour name, dates, participants, total price
  ├─ Message: "You will have 15 minutes to complete payment after confirming"
  └─ [Confirm] [Cancel] buttons
```

---

## 4. User Workflows

### Main Flow: Successful Booking

```
1. User clicks [Book Now] on tour schedule
2. Redirect to /traveler/tours/{id}/book
3. Preload tour schedule details (API call)
4. User enters number of participants
5. → Form updates to show N participant input sets
6. User fills in all participant details
7. → Backend quote called (onChange event)
8. User enters contact information
9. → Quote refreshed
10. [Optional] User enters voucher code
11. → Quote API called with voucher code
12. Price breakdown displays server-computed total
13. User clicks [Confirm Booking]
14. Confirmation dialog shown
15. User clicks [Confirm] in dialog
16. → POST /api/v1/traveler/tour-bookings called
17. Success response → Redirect to payment screen (UC-28)
18. Show toast: "Booking created! You have 15 minutes to complete payment"
```

### Alternative: Validation Error

```
1. User submits with invalid participant data
2. Backend returns 400 + error code (MSG78)
3. Frontend displays field-level error message
4. Form remains open for correction
5. User fixes and resubmits
```

### Alternative: Voucher Invalid

```
1. User applies voucher code
2. Backend returns 400 + MSG101 (invalid/expired)
3. Frontend shows inline error: "Voucher code is invalid, expired or fully used"
4. User can remove code or try different code
```

### Alternative: Insufficient Slots

```
1. User enters 50 participants
2. Backend returns 400 + MSG77 (insufficient slots, e.g., only 10 left)
3. Frontend shows error: "Not enough slots available for {count} participants. Maximum available: 10"
4. Form remains for adjustment
```

---

## 5. Component Specification

### TourBookingForm Component

```typescript
interface TourBookingFormProps {
  tourScheduleId: number;
  tourDetails: TourSchedule;
  onSuccess?: (booking: TourBooking) => void;
  onCancel?: () => void;
}

// State management
const [participants, setParticipants] = useState<Participant[]>([]);
const [contactInfo, setContactInfo] = useState<ContactInfo>({
  fullName: '',
  email: '',
  phoneNumber: ''
});
const [voucherCode, setVoucherCode] = useState<string>('');
const [quote, setQuote] = useState<QuoteResponse | null>(null);
const [loading, setLoading] = useState(false);
const [errors, setErrors] = useState<ValidationErrors>({});
const [showConfirmation, setShowConfirmation] = useState(false);

// Handlers
const handleNumberOfParticipantsChange = (count: number) => {
  // Update form to show N participant input sets
  // Trigger quote fetch
};

const handleVoucherApply = () => {
  // Call Backend quote endpoint with voucher
  // Update quote display
};

const handleConfirmBooking = async () => {
  // POST /api/v1/traveler/tour-bookings
  // On success: navigate to payment screen
  // On error: display error message
};
```

### ParticipantForm Component

```typescript
interface ParticipantFormProps {
  index: number;
  value: Participant;
  onChange: (participant: Participant) => void;
  error?: FieldError;
}

// Fields
- Full Name (text input, required)
- Date of Birth (date picker, required, format YYYY-MM-DD)
- Identity Document Number (text input, optional, max 50 chars)
- Phone Number (tel input, optional, format validation)
```

### PriceBreakdown Component

```typescript
interface PriceBreakdownProps {
  quote: QuoteResponse;
  loading?: boolean;
}

// Display
- Per-participant price
- Number of participants
- Subtotal
- Discount (if voucher)
- Total (highlighted)
- Loading state if refreshing
```

---

## 6. API Integration

### Quote Endpoint

```typescript
// Trigger on participant count change, contact info change, voucher apply/remove
const fetchQuote = async (
  tourScheduleId: number,
  numberOfParticipants: number,
  voucherCode?: string
) => {
  try {
    setLoading(true);
    const response = await fetch('/api/v1/traveler/tour-bookings/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tourScheduleId,
        numberOfParticipants,
        voucherCode
      })
    });
    
    if (response.ok) {
      const quote = await response.json();
      setQuote(quote);
      setErrors({}); // Clear quote-related errors
    } else {
      const error = await response.json();
      setErrors({ quote: error.message || 'Failed to fetch pricing' });
    }
  } finally {
    setLoading(false);
  }
};
```

### Create Booking Endpoint

```typescript
const submitBooking = async () => {
  try {
    setLoading(true);
    const response = await fetch('/api/v1/traveler/tour-bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tourScheduleId,
        numberOfParticipants: participants.length,
        participants,
        contactInformation: contactInfo,
        voucherCode: voucherCode || undefined
      })
    });
    
    if (response.status === 201) {
      const booking = await response.json();
      onSuccess?.(booking);
      // Redirect to /traveler/bookings/{bookingId}/payment
    } else if (response.status === 400 || response.status === 422) {
      const error = await response.json();
      // Map error code to SRS message, display to user
      setErrors(mapBackendErrors(error));
    } else if (response.status === 401) {
      // Trigger re-authentication (existing auth interceptor)
    }
  } finally {
    setLoading(false);
  }
};
```

---

## 7. Validation & Error Handling

### Client-side Validation (UX Only)

```
✗ Participant Name: non-empty, max 255 chars
✗ Date of Birth: valid date, age ≥ 18 (optional, business rule TBD)
✗ Phone: valid format (+84-based or 10-11 digits)
✗ Contact Email: valid email format
✗ Contact Phone: valid format
```

### Server-side Validation (Source of Truth)

- Backend validates all fields per spec
- Frontend displays server error messages with field highlighting

### Error Messages (SRS-aligned)

| Backend Error | HTTP | Display Message |
|--------------|------|-----------------|
| INVALID_PARTICIPANT (MSG78) | 400 | "Participant information is invalid; check date of birth and ID format" |
| INSUFFICIENT_SLOTS (MSG77) | 400 | "Not enough slots available for this departure. Maximum: {remaining}" |
| INVALID_SCHEDULE (MSG65) | 400 | "This tour departure is no longer available" |
| INVALID_VOUCHER (MSG101) | 400 | "Voucher code is invalid, expired or fully used" |
| VOUCHER_MINIMUM (MSG102) | 400 | "Voucher requires minimum purchase of {minimum}. Current: {subtotal}" |
| TOO_MANY_UNPAID (MSG126) | 400 | "You have too many pending bookings. Cancel one to proceed" |
| SERVER_ERROR (MSG127) | 5xx | "The service is temporarily unavailable. Please try again later" |

---

## 8. Responsive Design

- Desktop (≥1024px): 3-column layout (tour details, form, pricing sidebar)
- Tablet (768-1023px): 2-column layout (form stacked on pricing)
- Mobile (<768px): Single-column (full-width form, sticky pricing footer)

---

## 9. Accessibility

- Form labels linked to inputs (for=)
- Error messages announced (aria-live="polite")
- Focus management (focus trap in confirmation dialog)
- Keyboard navigation (Tab through fields, Enter to submit)

---

## 10. Performance

- Quote API debounced (300ms) on participant count change
- Lazy-load tour details if not already available
- Session-based state (no persistence to localStorage)

---

## Approval Gates

- [ ] Backend API contract confirmed
- [ ] Error code mapping finalized
- [ ] Tour schedule detail API available
- [ ] Confirmation dialog design approved
- [ ] Accessibility requirements confirmed
