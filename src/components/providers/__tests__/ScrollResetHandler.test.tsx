import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ScrollResetHandler } from '../ScrollResetHandler';

describe('ScrollResetHandler (Universal Scroll Reset On Reload)', () => {
  const originalScrollTo = window.scrollTo;
  const mockScrollTo = vi.fn();

  beforeEach(() => {
    mockScrollTo.mockClear();
    window.scrollTo = mockScrollTo;
    window.location.hash = '';

    // Mock history.scrollRestoration
    Object.defineProperty(window.history, 'scrollRestoration', {
      writable: true,
      configurable: true,
      value: 'auto',
    });
  });

  afterEach(() => {
    cleanup();
    window.scrollTo = originalScrollTo;
    vi.restoreAllMocks();
  });

  it('sets history.scrollRestoration to manual on mount', () => {
    render(<ScrollResetHandler />);
    expect(window.history.scrollRestoration).toBe('manual');
  });

  it('resets window scroll position to top on initial mount/reload when no hash is present', () => {
    render(<ScrollResetHandler />);
    expect(mockScrollTo).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: 'instant',
    });
  });

  it('respects anchor hash and does not overwrite scroll target if a hash is present', () => {
    window.location.hash = '#destinations';
    render(<ScrollResetHandler />);
    expect(mockScrollTo).not.toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: 'instant',
    });
  });

  it('triggers window.scrollTo(0, 0) on beforeunload to clear browser history scroll snapshot', () => {
    render(<ScrollResetHandler />);
    mockScrollTo.mockClear();

    window.dispatchEvent(new Event('beforeunload'));
    expect(mockScrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('cleans up beforeunload listener on unmount', () => {
    const { unmount } = render(<ScrollResetHandler />);
    unmount();
    mockScrollTo.mockClear();

    window.dispatchEvent(new Event('beforeunload'));
    expect(mockScrollTo).not.toHaveBeenCalled();
  });

  it('resets global Lenis instance to top immediately on mount or route transition', () => {
    const mockLenisScrollTo = vi.fn();
    (window as unknown as { __lenis?: { scrollTo: typeof mockLenisScrollTo } }).__lenis = {
      scrollTo: mockLenisScrollTo,
    };

    render(<ScrollResetHandler />);
    expect(mockLenisScrollTo).toHaveBeenCalledWith(0, { immediate: true });
    expect(mockScrollTo).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: 'instant',
    });

    delete (window as unknown as { __lenis?: unknown }).__lenis;
  });
});
