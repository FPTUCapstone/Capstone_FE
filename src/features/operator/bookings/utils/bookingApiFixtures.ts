/**
 * Test-only response bodies copied from Capstone_BE/docs/UC-40-api-contract.md.
 * Shared by the parser and service tests so both exercise the exact contract examples.
 */
export const listExample = () => ({
  pageNumber: 1,
  pageSize: 20,
  totalCount: 37,
  totalPages: 2,
  summary: { totalBookings: 37, totalParticipants: 112, totalConfirmedAmount: 98400000.0 },
  items: [
    {
      bookingId: '1201',
      bookingCode: 'BK-20261020-0007',
      tour: { tourId: '101', title: 'Ba Na Hills full-day tour' },
      schedule: {
        scheduleId: '311',
        startAtUtc: '2026-11-02T00:00:00+00:00',
        endAtUtc: '2026-11-02T10:00:00+00:00',
      },
      booker: { userId: '55', fullName: 'Nguyen Van A', email: 'a@example.com' },
      quantity: 3,
      totalAmount: 2400000.0,
      discountAmount: 100000.0,
      status: 'Confirmed',
      paymentStatus: 'Paid',
      checkInStatus: 'NotCheckedIn',
      checkedInAtUtc: null,
      bookedAtUtc: '2026-10-20T03:15:00+00:00',
    },
  ],
});

export const detailExample = () => ({
  bookingId: '1201',
  bookingCode: 'BK-20261020-0007',
  status: 'Confirmed',
  paymentStatus: 'Paid',
  bookedAtUtc: '2026-10-20T03:15:00+00:00',
  cancelledAtUtc: null,
  cancelReason: null,
  tour: { tourId: '101', title: 'Ba Na Hills full-day tour' },
  schedule: {
    scheduleId: '311',
    startAtUtc: '2026-11-02T00:00:00+00:00',
    endAtUtc: '2026-11-02T10:00:00+00:00',
    meetingPoint: 'Da Nang Cruise Port',
  },
  booker: { userId: '55', fullName: 'Nguyen Van A', email: 'a@example.com', phoneNumber: '+84901234567' },
  quantity: 3,
  participants: [
    { fullName: 'Nguyen Van A', participantType: 'Adult' },
    { fullName: 'Nguyen Thi B', participantType: 'Child' },
  ],
  ticket: {
    ticketCode: 'TK-0000001201',
    status: 'Valid',
    issuedAtUtc: '2026-10-20T03:16:00+00:00',
    expiresAtUtc: null,
  },
  checkInStatus: 'NotCheckedIn',
  checkedInAtUtc: null,
  payment: {
    gateway: 'PayOS',
    gatewayTransactionRef: 'FT26102012345',
    status: 'Success',
    amount: 2400000.0,
    succeededAtUtc: '2026-10-20T03:15:40+00:00',
  },
  paidAmount: 2400000.0,
  subtotalAmount: 2500000.0,
  discountAmount: 100000.0,
  totalAmount: 2400000.0,
  coupon: { code: 'SUMMER10', name: 'Summer 10%', discountAmount: 100000.0 },
  canCancel: true,
  cancelBlockedReason: null,
});

