export type MockPaymentOutcome = 'Success' | 'Cancelled' | 'Expired';

export type MockPaymentStatus = 'Pending' | MockPaymentOutcome;

export interface MockPayment {
  bookingId: string;
  bookingCode: string;
  paymentId: string;
  amount: number;
  currency: 'VND';
  status: MockPaymentStatus;
}

export function createMockPayment(bookingId: string): MockPayment {
  return {
    bookingId,
    bookingCode: 'BK-DEMO-UC28',
    paymentId: 'PAY-DEMO-UC28',
    amount: 1700000,
    currency: 'VND',
    status: 'Pending',
  };
}

export function resolveMockPaymentOutcome(
  payment: MockPayment,
  outcome: MockPaymentOutcome,
): MockPayment {
  return { ...payment, status: outcome };
}
