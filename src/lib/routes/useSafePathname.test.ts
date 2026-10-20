import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSafePathname } from './useSafePathname';

const mockUsePathname = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

describe('useSafePathname', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns pathname from next/navigation usePathname when available', () => {
    mockUsePathname.mockReturnValue('/tours/dalat-adventure');
    const { result } = renderHook(() => useSafePathname());
    expect(result.current).toBe('/tours/dalat-adventure');
  });

  it('falls back to window.location.pathname when usePathname throws or is null', () => {
    mockUsePathname.mockImplementation(() => {
      throw new Error('Not available in this context');
    });

    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, pathname: '/pois/hoan-kiem' },
      configurable: true,
      writable: true,
    });

    const { result } = renderHook(() => useSafePathname());
    expect(result.current).toBe('/pois/hoan-kiem');

    Object.defineProperty(window, 'location', {
      value: originalLocation,
      configurable: true,
      writable: true,
    });
  });

  it('falls back to "/" when both usePathname and window.location are unavailable', () => {
    mockUsePathname.mockImplementation(() => {
      throw new Error('Not available');
    });

    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, pathname: '' },
      configurable: true,
      writable: true,
    });

    const { result } = renderHook(() => useSafePathname());
    expect(result.current).toBe('/');

    Object.defineProperty(window, 'location', {
      value: originalLocation,
      configurable: true,
      writable: true,
    });
  });
});
