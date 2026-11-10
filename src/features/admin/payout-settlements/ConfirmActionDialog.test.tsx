import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConfirmActionDialog } from './ConfirmActionDialog';

describe('ConfirmActionDialog', () => {
  let onConfirm: ReturnType<typeof vi.fn<() => Promise<void>>>;
  let onClose: ReturnType<typeof vi.fn<() => void>>;
  let onSuccess: ReturnType<typeof vi.fn<() => void>>;

  beforeEach(() => {
    onConfirm = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    onClose = vi.fn<() => void>();
    onSuccess = vi.fn<() => void>();
  });

  it('renders nothing while closed', () => {
    render(
      <ConfirmActionDialog isOpen={false} title="Retry Transfer" body="Confirm?" confirmLabel="Retry" onConfirm={onConfirm} onClose={onClose} onSuccess={onSuccess} />,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('calls onConfirm then onSuccess, and does not call onClose itself (the caller decides)', async () => {
    render(
      <ConfirmActionDialog isOpen title="Retry Transfer" body="Confirm?" confirmLabel="Retry" onConfirm={onConfirm} onClose={onClose} onSuccess={onSuccess} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when Cancel is clicked', () => {
    render(
      <ConfirmActionDialog isOpen title="Retry Transfer" body="Confirm?" confirmLabel="Retry" onConfirm={onConfirm} onClose={onClose} onSuccess={onSuccess} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('sends exactly one request when the confirm button is double-clicked', async () => {
    let resolveConfirm: () => void = () => {};
    onConfirm.mockReturnValue(new Promise<void>((resolve) => { resolveConfirm = resolve; }));
    render(
      <ConfirmActionDialog isOpen title="Retry Transfer" body="Confirm?" confirmLabel="Retry" onConfirm={onConfirm} onClose={onClose} onSuccess={onSuccess} />,
    );
    const button = screen.getByRole('button', { name: 'Retry' });
    fireEvent.click(button);
    fireEvent.click(button);
    resolveConfirm();
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('shows the mapped error and keeps the dialog open on failure', async () => {
    onConfirm.mockRejectedValue(new Error('This payout settlement is not in SettlementFailed status.'));
    render(
      <ConfirmActionDialog isOpen title="Retry Transfer" body="Confirm?" confirmLabel="Retry" onConfirm={onConfirm} onClose={onClose} onSuccess={onSuccess} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('This payout settlement is not in SettlementFailed status.');
    expect(onSuccess).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeTruthy();
  });
});
