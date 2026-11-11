import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ManualSettlementDialog } from './ManualSettlementDialog';

describe('ManualSettlementDialog', () => {
  let onConfirm: ReturnType<typeof vi.fn<(transferReference: string) => Promise<void>>>;
  let onClose: ReturnType<typeof vi.fn<() => void>>;
  let onSuccess: ReturnType<typeof vi.fn<() => void>>;

  beforeEach(() => {
    onConfirm = vi.fn<(transferReference: string) => Promise<void>>().mockResolvedValue(undefined);
    onClose = vi.fn<() => void>();
    onSuccess = vi.fn<() => void>();
  });

  it('renders nothing while closed', () => {
    render(<ManualSettlementDialog isOpen={false} onConfirm={onConfirm} onClose={onClose} onSuccess={onSuccess} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('blocks submission on a blank reference, keeping the entered value', async () => {
    render(<ManualSettlementDialog isOpen onConfirm={onConfirm} onClose={onClose} onSuccess={onSuccess} />);
    const input = screen.getByLabelText('Transfer Reference');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Record Transfer' }));
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(onConfirm).not.toHaveBeenCalled();
    expect((input as HTMLInputElement).value).toBe('   ');
  });

  it('trims the reference before confirming, then calls onSuccess', async () => {
    render(<ManualSettlementDialog isOpen onConfirm={onConfirm} onClose={onClose} onSuccess={onSuccess} />);
    fireEvent.change(screen.getByLabelText('Transfer Reference'), { target: { value: '  SIM-TRX-002  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Record Transfer' }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(onConfirm).toHaveBeenCalledWith('SIM-TRX-002');
  });

  it('sends exactly one request when the confirm button is double-clicked', async () => {
    let resolveConfirm: () => void = () => {};
    onConfirm.mockReturnValue(new Promise<void>((resolve) => { resolveConfirm = resolve; }));
    render(<ManualSettlementDialog isOpen onConfirm={onConfirm} onClose={onClose} onSuccess={onSuccess} />);
    fireEvent.change(screen.getByLabelText('Transfer Reference'), { target: { value: 'SIM-TRX-003' } });
    const button = screen.getByRole('button', { name: 'Record Transfer' });
    fireEvent.click(button);
    fireEvent.click(button);
    resolveConfirm();
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('shows the mapped error and keeps the entered value on failure', async () => {
    onConfirm.mockRejectedValue(new Error('This payout settlement is not in SettlementFailed status.'));
    render(<ManualSettlementDialog isOpen onConfirm={onConfirm} onClose={onClose} onSuccess={onSuccess} />);
    fireEvent.change(screen.getByLabelText('Transfer Reference'), { target: { value: 'SIM-TRX-004' } });
    fireEvent.click(screen.getByRole('button', { name: 'Record Transfer' }));
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('This payout settlement is not in SettlementFailed status.');
    expect((screen.getByLabelText('Transfer Reference') as HTMLInputElement).value).toBe('SIM-TRX-004');
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('calls onClose when Cancel is clicked', () => {
    render(<ManualSettlementDialog isOpen onConfirm={onConfirm} onClose={onClose} onSuccess={onSuccess} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
