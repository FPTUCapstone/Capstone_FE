import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MarkAsResolvedDialog } from './MarkAsResolvedDialog';

describe('MarkAsResolvedDialog', () => {
  let onConfirm: ReturnType<typeof vi.fn<(reason: string) => Promise<void>>>;
  let onClose: ReturnType<typeof vi.fn<() => void>>;
  let onSuccess: ReturnType<typeof vi.fn<() => void>>;

  beforeEach(() => {
    onConfirm = vi.fn<(reason: string) => Promise<void>>().mockResolvedValue(undefined);
    onClose = vi.fn<() => void>();
    onSuccess = vi.fn<() => void>();
  });

  it('renders nothing while closed', () => {
    render(<MarkAsResolvedDialog isOpen={false} onConfirm={onConfirm} onClose={onClose} onSuccess={onSuccess} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('blocks submission on a blank reason, keeping the entered value', async () => {
    render(<MarkAsResolvedDialog isOpen onConfirm={onConfirm} onClose={onClose} onSuccess={onSuccess} />);
    const input = screen.getByLabelText('Reason');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Mark as Resolved' }));
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(onConfirm).not.toHaveBeenCalled();
    expect((input as HTMLTextAreaElement).value).toBe('   ');
  });

  it('trims the reason before confirming, then calls onSuccess', async () => {
    render(<MarkAsResolvedDialog isOpen onConfirm={onConfirm} onClose={onClose} onSuccess={onSuccess} />);
    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: '  Operator confirmed receipt out of band  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Mark as Resolved' }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(onConfirm).toHaveBeenCalledWith('Operator confirmed receipt out of band');
  });

  it('sends exactly one request when the confirm button is double-clicked', async () => {
    let resolveConfirm: () => void = () => {};
    onConfirm.mockReturnValue(new Promise<void>((resolve) => { resolveConfirm = resolve; }));
    render(<MarkAsResolvedDialog isOpen onConfirm={onConfirm} onClose={onClose} onSuccess={onSuccess} />);
    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'Operator confirmed receipt' } });
    const button = screen.getByRole('button', { name: 'Mark as Resolved' });
    fireEvent.click(button);
    fireEvent.click(button);
    resolveConfirm();
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('shows the mapped error and keeps the entered value on failure', async () => {
    onConfirm.mockRejectedValue(new Error('This payout settlement is not in SettlementFailed status.'));
    render(<MarkAsResolvedDialog isOpen onConfirm={onConfirm} onClose={onClose} onSuccess={onSuccess} />);
    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'Operator confirmed receipt' } });
    fireEvent.click(screen.getByRole('button', { name: 'Mark as Resolved' }));
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('This payout settlement is not in SettlementFailed status.');
    expect((screen.getByLabelText('Reason') as HTMLTextAreaElement).value).toBe('Operator confirmed receipt');
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('calls onClose when Cancel is clicked', () => {
    render(<MarkAsResolvedDialog isOpen onConfirm={onConfirm} onClose={onClose} onSuccess={onSuccess} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
