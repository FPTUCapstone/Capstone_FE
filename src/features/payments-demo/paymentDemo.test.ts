import { describe, expect, it } from 'vitest';

import { createMockPayment, resolveMockPaymentOutcome } from './paymentDemo';

describe('UC-28 local payment demo model', () => {
  it('starts as a pending payment and resolves a selected local outcome', () => {
    const payment = createMockPayment('demo-booking-28');

    expect(payment.status).toBe('Pending');
    expect(resolveMockPaymentOutcome(payment, 'Success').status).toBe('Success');
    expect(resolveMockPaymentOutcome(payment, 'Cancelled').status).toBe('Cancelled');
    expect(resolveMockPaymentOutcome(payment, 'Expired').status).toBe('Expired');
  });
});
