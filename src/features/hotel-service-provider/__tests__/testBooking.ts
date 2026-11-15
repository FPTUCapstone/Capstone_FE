import type { BookingRequestItem } from '../types';
export const testBooking: BookingRequestItem = {
  id: '9', requestCode: 'SR-9', serviceId: 2, serviceName: 'Riverside Hotel', serviceOption: 'Deluxe',
  requestedDate: '2020-01-01', requestedTime: '14:00', quantity: 2, travelerName: 'Nguyen An',
  travelerPhone: '0905123456', travelerEmail: 'an@example.com', status: 'PendingConfirmation',
  estimatedAmount: 100000, rowVersion: 'AAAAAAAB=', responseDeadlineUtc: '2099-01-01T00:00:00Z',
  outcomeAvailableAtUtc: '2020-01-01T17:00:00Z', autoCompleteAtUtc: '2099-01-04T17:00:00Z',
};
