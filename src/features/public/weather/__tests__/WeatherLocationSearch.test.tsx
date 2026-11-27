import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as placeSearchApi from '@/features/scheduling/services/placeSearchApi';
import { WeatherLocationSearch } from '../components/WeatherLocationSearch';

vi.mock('@/features/scheduling/services/placeSearchApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/scheduling/services/placeSearchApi')>();
  return {
    ...actual,
    isAddressSearchAvailable: vi.fn(),
    createAddressSession: vi.fn(() => 'session-1'),
    suggestAddresses: vi.fn(),
    retrieveAddress: vi.fn(),
    getBrowserLocation: vi.fn(),
  };
});

describe('WeatherLocationSearch', () => {
  beforeEach(() => {
    vi.mocked(placeSearchApi.isAddressSearchAvailable).mockReturnValue(true);
    vi.mocked(placeSearchApi.createAddressSession).mockReturnValue('session-1');
    vi.mocked(placeSearchApi.suggestAddresses).mockReset();
    vi.mocked(placeSearchApi.retrieveAddress).mockReset();
    vi.mocked(placeSearchApi.getBrowserLocation).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
    vi.restoreAllMocks();
  });

  it('hides the search bar completely when Mapbox token is not configured', () => {
    vi.mocked(placeSearchApi.isAddressSearchAvailable).mockReturnValue(false);

    const { container } = render(<WeatherLocationSearch onSelectLocation={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('does not call suggestAddresses for queries shorter than 2 characters and debounces rapid input', async () => {
    vi.useFakeTimers();
    const suggestMock = vi.mocked(placeSearchApi.suggestAddresses).mockResolvedValue([
      { id: 'mbx-sapa', name: 'Sa Pa', fullAddress: 'Thị xã Sa Pa, Lào Cai' },
    ]);

    render(<WeatherLocationSearch onSelectLocation={vi.fn()} />);
    const input = screen.getByRole('combobox');

    fireEvent.change(input, { target: { value: 'S' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(suggestMock).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: 'Sa' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });
    fireEvent.change(input, { target: { value: 'Sa Pa' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });
    expect(suggestMock).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
    expect(suggestMock).toHaveBeenCalledTimes(1);
    expect(suggestMock).toHaveBeenCalledWith('Sa Pa', 'session-1');
  });

  it('renders suggestion name and address only without temperature and supports keyboard navigation', async () => {
    vi.useFakeTimers();
    const onSelectLocation = vi.fn();
    vi.mocked(placeSearchApi.suggestAddresses).mockResolvedValue([
      { id: 'mbx-sapa', name: 'Sa Pa', fullAddress: 'Thị xã Sa Pa, Lào Cai' },
      { id: 'mbx-sadec', name: 'Sa Đéc', fullAddress: 'Đồng Tháp' },
    ]);
    vi.mocked(placeSearchApi.retrieveAddress).mockResolvedValue({
      label: 'Sa Pa, Thị xã Sa Pa, Lào Cai',
      latitude: 22.34,
      longitude: 103.84,
    });

    render(<WeatherLocationSearch onSelectLocation={onSelectLocation} />);
    const input = screen.getByRole('combobox');

    fireEvent.change(input, { target: { value: 'Sa' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });

    const listbox = screen.getByRole('listbox');
    expect(listbox.textContent).toContain('Sa Pa');
    expect(listbox.textContent).toContain('Thị xã Sa Pa, Lào Cai');
    expect(listbox.textContent).not.toContain('°');

    expect(input.getAttribute('aria-expanded')).toBe('true');

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    const options = screen.getAllByRole('option');
    expect(options[0].getAttribute('aria-selected')).toBe('true');
    expect(input.getAttribute('aria-activedescendant')).toBe(options[0].id);

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(options[1].getAttribute('aria-selected')).toBe('true');

    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(options[0].getAttribute('aria-selected')).toBe('true');

    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter' });
      await Promise.resolve();
    });

    expect(placeSearchApi.retrieveAddress).toHaveBeenCalledWith(
      { id: 'mbx-sapa', name: 'Sa Pa', fullAddress: 'Thị xã Sa Pa, Lào Cai' },
      'session-1',
    );
    expect(onSelectLocation).toHaveBeenCalledWith({
      name: 'Sa Pa',
      subtitle: 'Thị xã Sa Pa, Lào Cai',
      latitude: 22.34,
      longitude: 103.84,
      timeZoneId: 'Asia/Ho_Chi_Minh',
    });
    expect(input.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes dropdown on Escape key', async () => {
    vi.useFakeTimers();
    vi.mocked(placeSearchApi.suggestAddresses).mockResolvedValue([
      { id: 'mbx-sapa', name: 'Sa Pa', fullAddress: 'Thị xã Sa Pa, Lào Cai' },
    ]);

    render(<WeatherLocationSearch onSelectLocation={vi.fn()} />);
    const input = screen.getByRole('combobox');

    fireEvent.change(input, { target: { value: 'Sa' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });
    expect(screen.getByRole('listbox')).toBeDefined();

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(input.getAttribute('aria-expanded')).toBe('false');
  });

  it('rejects browser geolocation outside Vietnam without calling onSelectLocation', async () => {
    const onSelectLocation = vi.fn();
    vi.mocked(placeSearchApi.getBrowserLocation).mockResolvedValue({
      latitude: 48.8566,
      longitude: 2.3522,
    });

    render(<WeatherLocationSearch onSelectLocation={onSelectLocation} />);
    const locateButton = screen.getByRole('button', { name: /Vị trí của tôi/i });

    await act(async () => {
      fireEvent.click(locateButton);
      await Promise.resolve();
    });

    expect(onSelectLocation).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toContain('Chỉ hỗ trợ địa điểm trong Việt Nam');
  });

  it('selects browser geolocation when inside Vietnam bounds', async () => {
    const onSelectLocation = vi.fn();
    vi.mocked(placeSearchApi.getBrowserLocation).mockResolvedValue({
      latitude: 10.7769,
      longitude: 106.7009,
    });

    render(<WeatherLocationSearch onSelectLocation={onSelectLocation} />);
    const locateButton = screen.getByRole('button', { name: /Vị trí của tôi/i });

    await act(async () => {
      fireEvent.click(locateButton);
      await Promise.resolve();
    });

    expect(onSelectLocation).toHaveBeenCalledWith({
      name: 'Vị trí của tôi',
      latitude: 10.7769,
      longitude: 106.7009,
      timeZoneId: 'Asia/Ho_Chi_Minh',
    });
  });
});
