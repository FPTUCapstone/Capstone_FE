import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CreateRouteUnavailableView } from './CreateRouteUnavailableView';

describe('CreateRouteUnavailableView', () => {
  it('renders header, explanation, SRS §3.9.4.1 form labels, and map preview pending notice', () => {
    render(<CreateRouteUnavailableView />);

    expect(screen.getByRole('heading', { level: 1, name: 'Create Route' })).toBeTruthy();
    expect(screen.getByText('Backend integration pending')).toBeTruthy();
    expect(screen.getByLabelText('Origin Point of Interest')).toBeTruthy();
    expect(screen.getByLabelText('Destination Point of Interest')).toBeTruthy();
    expect(screen.getByLabelText('Transport Mode')).toBeTruthy();
    expect(screen.getByLabelText('Distance (km)')).toBeTruthy();
    expect(screen.getByLabelText('Estimated Travel Time (minutes)')).toBeTruthy();
    expect(screen.getByLabelText('Route Note')).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Route Map Preview' })).toBeTruthy();
  });

  it('renders disabled controls with aria-describedby and disabled submit button', () => {
    render(<CreateRouteUnavailableView />);

    const originSelect = screen.getByLabelText('Origin Point of Interest') as HTMLSelectElement;
    expect(originSelect.disabled).toBe(true);
    expect(originSelect.getAttribute('aria-describedby')).toBe('route-controls-pending-desc');

    const destinationSelect = screen.getByLabelText('Destination Point of Interest') as HTMLSelectElement;
    expect(destinationSelect.disabled).toBe(true);
    expect(destinationSelect.getAttribute('aria-describedby')).toBe('route-controls-pending-desc');

    const submitBtn = screen.getByRole('button', { name: 'Create Route (Unavailable)' }) as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);
    expect(submitBtn.getAttribute('aria-describedby')).toBe('route-controls-pending-desc');
  });

  it('renders link back to route directory', () => {
    render(<CreateRouteUnavailableView />);

    const backLink = screen.getByRole('link', { name: 'Back to Route Master Data' });
    expect(backLink.getAttribute('href')).toBe('/admin/routes');
  });
});
