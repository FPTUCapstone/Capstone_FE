import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RouteDirectoryUnavailableView } from './RouteDirectoryUnavailableView';

describe('RouteDirectoryUnavailableView', () => {
  it('renders the Route Master Data header and English copy', () => {
    render(<RouteDirectoryUnavailableView />);

    expect(screen.getByRole('heading', { level: 1, name: 'Route Master Data' })).toBeTruthy();
    expect(screen.getByText('Master Data Governance')).toBeTruthy();
    expect(screen.getByText('Backend integration pending')).toBeTruthy();
  });

  it('renders disabled search and transport mode filter controls with aria-describedby', () => {
    render(<RouteDirectoryUnavailableView />);

    const search = screen.getByRole('searchbox', { name: 'Search routes' }) as HTMLInputElement;
    expect(search.disabled).toBe(true);
    expect(search.getAttribute('aria-describedby')).toBe('route-controls-pending-desc');

    const filter = screen.getByRole('combobox', { name: 'Transport Mode filter' }) as HTMLSelectElement;
    expect(filter.disabled).toBe(true);
    expect(filter.getAttribute('aria-describedby')).toBe('route-controls-pending-desc');
  });

  it('renders navigation link to create a route and return to administration dashboard', () => {
    render(<RouteDirectoryUnavailableView />);

    const createLink = screen.getByRole('link', { name: 'Create Route' });
    expect(createLink.getAttribute('href')).toBe('/admin/routes/create');

    const dashboardLink = screen.getByRole('link', { name: 'Return to Administration Dashboard' });
    expect(dashboardLink.getAttribute('href')).toBe('/admin');
  });
});
