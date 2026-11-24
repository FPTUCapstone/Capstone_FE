import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PlacePickerDialog } from '../components/PlacePickerDialog';
import * as placeSearchApi from '../services/placeSearchApi';

vi.mock('../services/placeSearchApi', async () => {
  const actual = await vi.importActual<typeof import('../services/placeSearchApi')>(
    '../services/placeSearchApi',
  );
  return {
    ...actual,
    searchSelectablePois: vi.fn(),
    isAddressSearchAvailable: vi.fn(() => false),
  };
});

const mockPois: placeSearchApi.SelectablePoi[] = [
  {
    id: 1,
    name: 'Cầu Rồng',
    categoryName: 'Điểm tham quan',
    address: 'Đà Nẵng',
    latitude: 16.061,
    longitude: 108.227,
  },
  {
    id: 2,
    name: 'Bãi biển Mỹ Khê',
    categoryName: 'Bãi biển',
    address: 'Sơn Trà, Đà Nẵng',
    latitude: 16.065,
    longitude: 108.247,
  },
];

describe('PlacePickerDialog', () => {
  const defaultNear = { latitude: 16.054, longitude: 108.202 };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(placeSearchApi.searchSelectablePois).mockResolvedValue(mockPois);
  });

  it('locks body scroll on mount and restores on unmount', () => {
    document.body.style.overflow = 'auto';
    const { unmount } = render(
      <PlacePickerDialog
        title="Chọn khu vực khám phá"
        allowAddresses={false}
        near={defaultNear}
        radiusKm={100}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(document.body.style.overflow).toBe('hidden');

    unmount();
    expect(document.body.style.overflow).toBe('auto');
  });

  it('renders data-lenis-prevent attributes to guard against smooth scroll displacement', () => {
    render(
      <PlacePickerDialog
        title="Chọn khu vực khám phá"
        allowAddresses={false}
        near={defaultNear}
        radiusKm={100}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('data-lenis-prevent')).not.toBeNull();

    const backdrop = dialog.parentElement;
    expect(backdrop?.getAttribute('data-lenis-prevent')).not.toBeNull();
  });

  it('renders distance badge relative to near point', async () => {
    render(
      <PlacePickerDialog
        title="Chọn khu vực khám phá"
        allowAddresses={false}
        near={defaultNear}
        radiusKm={100}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    const section = await screen.findByRole('region', { name: 'Địa điểm tham quan' });
    expect(within(section).getByText('Cầu Rồng')).toBeDefined();

    // Should display distance text
    const distanceBadges = within(section).getAllByText(/Cách bạn/);
    expect(distanceBadges.length).toBe(2);
    expect(distanceBadges[0].textContent).toContain('Cách bạn 2,8 km');
    expect(distanceBadges[1].textContent).toContain('Cách bạn 5,0 km');
  });

  it('calls onSelect when a place is chosen', async () => {
    const onSelect = vi.fn();
    render(
      <PlacePickerDialog
        title="Chọn điểm xuất phát"
        allowAddresses={false}
        near={defaultNear}
        radiusKm={10}
        onSelect={onSelect}
        onClose={vi.fn()}
      />,
    );

    const section = await screen.findByRole('region', { name: 'Địa điểm tham quan' });
    const cauRongItem = within(section).getByText('Cầu Rồng');
    fireEvent.click(cauRongItem);

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        label: 'Cầu Rồng',
        latitude: 16.061,
        longitude: 108.227,
      }),
    );
  });

  it('calls onClose when close button or Escape key is pressed', () => {
    const onClose = vi.fn();
    render(
      <PlacePickerDialog
        title="Chọn khu vực khám phá"
        allowAddresses={false}
        near={defaultNear}
        radiusKm={100}
        onSelect={vi.fn()}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByLabelText('Đóng'));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
