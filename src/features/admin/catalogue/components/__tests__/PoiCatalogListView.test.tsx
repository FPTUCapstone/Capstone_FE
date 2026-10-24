import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/catalogue/points-of-interest',
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

import { PoiCatalogListView, type AdminPoiItem } from '../PoiCatalogListView';

const TEST_POIS: AdminPoiItem[] = [
  {
    id: 1,
    name: 'Notre-Dame Cathedral Basilica of Saigon',
    category: 'Historical & Cultural',
    address: '01 Cong Xa Paris, Ben Nghe, District 1, Ho Chi Minh City',
    coordinates: { lat: 10.7798, lng: 106.699 },
    openingHoursSummary: '08:00 - 17:00 (Daily)',
    status: 'Active',
  },
  {
    id: 2,
    name: 'War Remnants Museum',
    category: 'Historical Museum',
    address: '28 Vo Van Tan, Ward 6, District 3, Ho Chi Minh City',
    coordinates: { lat: 10.7794, lng: 106.6922 },
    openingHoursSummary: '07:30 - 17:30 (Daily)',
    status: 'Active',
  },
];

describe('PoiCatalogListView (Screen #16)', () => {
  it('renders header with title, master data badge and create button', () => {
    render(<PoiCatalogListView />);

    expect(screen.getByRole('heading', { level: 1, name: 'Points of Interest Catalog' })).toBeTruthy();
    expect(screen.getByText('Master Data Management')).toBeTruthy();
    expect(screen.getAllByRole('link', { name: /Create New POI/i }).length).toBeGreaterThanOrEqual(1);
  });

  it('renders honest empty state when no points of interest are loaded', () => {
    render(<PoiCatalogListView initialPois={[]} />);

    expect(screen.getByText('No points of interest available')).toBeTruthy();
    expect(
      screen.getByText('Catalog records will appear here when the directory service is connected.'),
    ).toBeTruthy();
  });

  it('renders table rows and category filter when items are provided', () => {
    render(<PoiCatalogListView initialPois={TEST_POIS} />);

    expect(screen.getByRole('table', { name: 'Points of Interest Data Table' })).toBeTruthy();
    expect(screen.getByText('Notre-Dame Cathedral Basilica of Saigon')).toBeTruthy();
    expect(screen.getByText('War Remnants Museum')).toBeTruthy();
    expect(screen.getByRole('combobox')).toBeTruthy();
  });
});
