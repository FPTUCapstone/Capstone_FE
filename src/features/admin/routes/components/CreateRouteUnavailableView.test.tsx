import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CreateRouteUnavailableView } from './CreateRouteUnavailableView';

describe('CreateRouteUnavailableView', () => {
  it('renders header, explanation, and form labels', () => {
    render(<CreateRouteUnavailableView />);

    expect(screen.getByRole('heading', { level: 1, name: 'Create New Route' })).toBeTruthy();
    expect(screen.getByText('Backend integration pending')).toBeTruthy();
    expect(screen.getByLabelText('Route Name')).toBeTruthy();
    expect(screen.getByLabelText('Origin Location')).toBeTruthy();
    expect(screen.getByLabelText('Destination Location')).toBeTruthy();
    expect(screen.getByLabelText('Transportation Mode')).toBeTruthy();
    expect(screen.getByLabelText('Estimated Distance (km)')).toBeTruthy();
    expect(screen.getByLabelText('Estimated Duration (minutes)')).toBeTruthy();
  });

  it('renders disabled input controls and disabled submit button', () => {
    render(<CreateRouteUnavailableView />);

    const nameInput = screen.getByLabelText('Route Name') as HTMLInputElement;
    expect(nameInput.disabled).toBe(true);

    const submitBtn = screen.getByRole('button', { name: 'Save Route (Unavailable)' }) as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);
  });

  it('renders link back to route directory', () => {
    render(<CreateRouteUnavailableView />);

    const backLink = screen.getByRole('link', { name: 'Back to Route Master Data' });
    expect(backLink.getAttribute('href')).toBe('/admin/routes');
  });
});
