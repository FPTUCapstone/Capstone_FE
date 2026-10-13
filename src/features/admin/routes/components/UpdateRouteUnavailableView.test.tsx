import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { UpdateRouteUnavailableView } from './UpdateRouteUnavailableView';

describe('UpdateRouteUnavailableView', () => {
  it('renders header, pending badge, and requested route ID context', () => {
    render(<UpdateRouteUnavailableView routeId="42" />);

    expect(screen.getByRole('heading', { level: 1, name: 'Update Route' })).toBeTruthy();
    expect(screen.getByText('Backend integration pending')).toBeTruthy();
    expect(screen.getByText('Requested Route ID')).toBeTruthy();
    expect(screen.getByText('42')).toBeTruthy();
  });

  it('renders back link, disabled status operation buttons, and disabled submit button with aria-describedby', () => {
    render(<UpdateRouteUnavailableView routeId="42" />);

    const backLink = screen.getByRole('link', { name: 'Back to Route Master Data' });
    expect(backLink.getAttribute('href')).toBe('/admin/routes');

    const deactivateBtn = screen.getByRole('button', { name: 'Deactivate Route unavailable' }) as HTMLButtonElement;
    expect(deactivateBtn.disabled).toBe(true);
    expect(deactivateBtn.getAttribute('aria-describedby')).toBe('route-controls-pending-desc');

    const activateBtn = screen.getByRole('button', { name: 'Activate Route unavailable' }) as HTMLButtonElement;
    expect(activateBtn.disabled).toBe(true);
    expect(activateBtn.getAttribute('aria-describedby')).toBe('route-controls-pending-desc');

    const submitBtn = screen.getByRole('button', { name: 'Save Changes (Unavailable)' }) as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);
    expect(submitBtn.getAttribute('aria-describedby')).toBe('route-controls-pending-desc');
  });
});
