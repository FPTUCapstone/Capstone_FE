import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { UpdateRouteUnavailableView } from './UpdateRouteUnavailableView';

describe('UpdateRouteUnavailableView', () => {
  it('renders header, pending badge, and requested route ID context', () => {
    render(<UpdateRouteUnavailableView routeId={42} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Update Route' })).toBeTruthy();
    expect(screen.getByText('Backend integration pending')).toBeTruthy();
    expect(screen.getByText('Requested Route ID')).toBeTruthy();
    expect(screen.getByText('42')).toBeTruthy();
  });

  it('renders back link to routes directory and disabled submit button', () => {
    render(<UpdateRouteUnavailableView routeId={42} />);

    const backLink = screen.getByRole('link', { name: 'Back to Route Master Data' });
    expect(backLink.getAttribute('href')).toBe('/admin/routes');

    const submitBtn = screen.getByRole('button', { name: 'Save Changes (Unavailable)' }) as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);
  });
});
