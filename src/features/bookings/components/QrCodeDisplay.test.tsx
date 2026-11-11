import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { qrCodeSvgMock } = vi.hoisted(() => ({
  qrCodeSvgMock: vi.fn((props: { value: string }) => <svg data-testid="qr-svg" data-value={props.value} />),
}));
vi.mock('qrcode.react', () => ({ QRCodeSVG: qrCodeSvgMock }));

import { QrCodeDisplay } from './QrCodeDisplay';

describe('QrCodeDisplay', () => {
  it('encodes the content exactly as received with a real QR encoder', () => {
    const content = 'TM1.q8V0-_Xk.3fJ9_aQ';

    render(<QrCodeDisplay value={content} size={220} ariaLabel="Mã QR vé TK-0000000456" />);

    expect(qrCodeSvgMock).toHaveBeenCalledTimes(1);
    expect(qrCodeSvgMock.mock.calls[0][0]).toMatchObject({
      value: content,
      size: 220,
      level: 'M',
      marginSize: 4,
    });
    expect(screen.getByTestId('qr-svg').getAttribute('data-value')).toBe(content);
    expect(screen.getByRole('img', { name: 'Mã QR vé TK-0000000456' })).toBeTruthy();
  });
});
