import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { VietQrModal } from '../components/VietQrModal';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const baseBill = {
  title: 'Tiền tàu cao tốc',
  totalAmount: 400000,
  perPersonAmount: 200000,
  participantNames: ['QA Host', 'QA Member'],
  payerName: 'QA Host',
  payerBankName: 'MBBank',
  payerBankAccount: '1234567890',
  paidUserIds: [],
};

describe('VietQrModal', () => {
  it('renders friendly bank name, loading status, and loaded QR image without lazy loading', () => {
    render(<VietQrModal data={baseBill} onClose={vi.fn()} />);

    expect(screen.getByText('MB Bank')).toBeDefined();
    expect(screen.getByRole('status').textContent).toContain('Đang tải mã VietQR');

    const img = screen.getByRole('img', { name: 'Mã VietQR chuyển khoản' }) as HTMLImageElement;
    expect(img.getAttribute('loading')).toBeNull();
    expect(img.src).toContain('https://img.vietqr.io/image/MB-1234567890-compact2.png');

    fireEvent.load(img);
    expect(screen.queryByText(/Đang tải mã VietQR/)).toBeNull();
  });

  it('shows honest error fallback and retry action without generating a fake QR when image fails or times out', () => {
    render(<VietQrModal data={baseBill} onClose={vi.fn()} />);

    const img = screen.getByRole('img', { name: 'Mã VietQR chuyển khoản' });
    fireEvent.error(img);

    expect(screen.getByRole('alert').textContent).toContain('Không thể tải ảnh mã VietQR lúc này');
    const retry = screen.getByRole('button', { name: 'Thử tải lại mã QR' });
    fireEvent.click(retry);

    const retriedImg = screen.getByRole('img', { name: 'Mã VietQR chuyển khoản' }) as HTMLImageElement;
    expect(retriedImg.src).toContain('&retry=1');
  });
});
