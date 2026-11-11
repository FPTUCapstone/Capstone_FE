import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { QrCodeDisplay } from './QrCodeDisplay';

describe('QrCodeDisplay with the real encoder', () => {
  it('renders an SVG whose modules change with the content', () => {
    const first = render(<QrCodeDisplay value="TM1.first.signature" size={200} />);
    const firstPath = first.container.querySelector('svg path:last-of-type')?.getAttribute('d');
    first.unmount();
    const second = render(<QrCodeDisplay value="TM1.second.signature" size={200} />);
    const secondPath = second.container.querySelector('svg path:last-of-type')?.getAttribute('d');

    expect(firstPath).toBeTruthy();
    expect(secondPath).toBeTruthy();
    expect(secondPath).not.toBe(firstPath);
  });
});
