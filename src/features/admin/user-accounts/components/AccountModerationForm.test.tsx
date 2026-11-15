import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AccountModerationForm } from './AccountModerationForm';

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));

describe('AccountModerationForm', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    refresh.mockReset();
  });

  it('requires a reason, sends only the reason and refreshes the account after unlocking', async () => {
    const request = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', request);
    render(<AccountModerationForm accountId="42" locked />);

    const button = screen.getByRole<HTMLButtonElement>('button', { name: 'Unlock account' });
    expect(button.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Reason for unlocking'), { target: { value: 'Resolved' } });
    fireEvent.click(button);

    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    expect(request).toHaveBeenCalledWith('/api/admin/users/42/unlock', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ reason: 'Resolved' }),
    }));
  });

  it('shows an API denial without treating the account as updated', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ title: 'Account unavailable.' }, { status: 404 })));
    render(<AccountModerationForm accountId="42" locked={false} />);
    fireEvent.change(screen.getByLabelText('Reason for locking'), { target: { value: 'Policy violation' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lock account' }));

    expect((await screen.findByRole('alert')).textContent).toBe('Account unavailable.');
    expect(refresh).not.toHaveBeenCalled();
  });
});
