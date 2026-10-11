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

  it('renders disabled search and filter controls', () => {
    render(<RouteDirectoryUnavailableView />);

    const search = screen.getByRole('searchbox', { name: 'Search routes' }) as HTMLInputElement;
    expect(search.disabled).toBe(true);

    const filter = screen.getByRole('combobox', { name: 'Mode filter' }) as HTMLSelectElement;
    expect(filter.disabled).toBe(true);
  });

  it('renders navigation link to create a new route and return to staff workspace', () => {
    render(<RouteDirectoryUnavailableView />);

    const createLink = screen.getByRole('link', { name: 'Create New Route' });
    expect(createLink.getAttribute('href')).toBe('/admin/routes/create');

    const staffLink = screen.getByRole('link', { name: 'Return to Staff Workspace' });
    expect(staffLink.getAttribute('href')).toBe('/admin/staff');
  });
});
