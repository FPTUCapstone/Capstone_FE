import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AdminPasswordRecoveryPage } from './AdminPasswordRecoveryPage';

describe('AdminPasswordRecoveryPage auth layout', () => {
  it('renders the split-screen administration recovery layout', () => {
    const { container } = render(<AdminPasswordRecoveryPage />);
    const page = container.firstElementChild;

    expect(page?.className).toContain('min-h-screen');
    expect(page?.className).toContain('grid');
    expect(screen.getByText('Admin account recovery')).toBeDefined();
    expect(screen.getByLabelText('Email Address')).toBeDefined();

    const backLink = screen.getByRole('link', { name: /return to admin login/i });
    expect(backLink.getAttribute('href')).toBe('/admin/login');
  });
});
