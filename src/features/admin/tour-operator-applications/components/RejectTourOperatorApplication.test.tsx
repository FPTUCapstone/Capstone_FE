import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RejectModal } from './RejectModal';

const api = vi.hoisted(() => ({ reject: vi.fn() }));

vi.mock('../api/tourOperatorApplicationApi', async () => {
  class ApiError extends Error {
    constructor(public statusCode: number, public errorCode: string, message: string) {
      super(message);
    }
  }
  return { ApiError, rejectOperatorApplication: api.reject };
});

const label = 'Please enter specific rejection reason to send to applicant:';

beforeEach(() => api.reject.mockReset());

describe('UC-51 rejection validation and submission', () => {
  it('rejects whitespace-only input without sending a request', () => {
    render(
      <RejectModal
        isOpen
        userId={3}
        companyName="Hoi An Travel"
        onClose={() => undefined}
        onSuccess={() => undefined}
      />,
    );

    fireEvent.change(screen.getByLabelText(label), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: /confirm rejection/i }));

    expect(screen.getByRole('alert').textContent).toMatch(/rejection reason is required/i);
    expect(api.reject).not.toHaveBeenCalled();
  });

  it('rejects a reason longer than 500 characters without sending a request', () => {
    render(
      <RejectModal
        isOpen
        userId={3}
        companyName="Hoi An Travel"
        onClose={() => undefined}
        onSuccess={() => undefined}
      />,
    );

    fireEvent.change(screen.getByLabelText(label), { target: { value: 'x'.repeat(501) } });
    fireEvent.click(screen.getByRole('button', { name: /confirm rejection/i }));

    expect(screen.getByRole('alert').textContent).toMatch(/cannot exceed 500 characters/i);
    expect(api.reject).not.toHaveBeenCalled();
  });

  it('trims a valid reason and emits the locked success message only after API success', async () => {
    const onSuccess = vi.fn();
    api.reject.mockResolvedValueOnce(undefined);
    render(
      <RejectModal
        isOpen
        userId={3}
        companyName="Hoi An Travel"
        onClose={() => undefined}
        onSuccess={onSuccess}
      />,
    );

    fireEvent.change(screen.getByLabelText(label), {
      target: { value: '  Business licence cannot be verified.  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: /confirm rejection/i }));

    await waitFor(() => expect(api.reject).toHaveBeenCalledWith(3, 'Business licence cannot be verified.'));
    expect(onSuccess).toHaveBeenCalledWith('Application rejected. Notification sent to operator.');
  });
});
