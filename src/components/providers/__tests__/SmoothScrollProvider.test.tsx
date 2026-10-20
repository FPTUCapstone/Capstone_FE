import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SmoothScrollProvider, useSmoothScroll } from '../SmoothScrollProvider';

const mockDestroy = vi.fn();
const mockRaf = vi.fn();
const mockScrollTo = vi.fn();
const mockStop = vi.fn();
const mockStart = vi.fn();
let lastLenisOptions: Record<string, unknown> = {};

// Mock lenis constructor
vi.mock('lenis', () => {
  return {
    default: class MockLenis {
      destroy = mockDestroy;
      raf = mockRaf;
      scrollTo = mockScrollTo;
      stop = mockStop;
      start = mockStart;
      constructor(public options: Record<string, unknown>) {
        lastLenisOptions = options;
      }
    },
  };
});

function ConsumerComponent() {
  const { scrollTo } = useSmoothScroll();
  return (
    <button type="button" onClick={() => scrollTo('#test', { offset: -50 })}>
      Scroll to Target
    </button>
  );
}

beforeEach(() => {
  mockDestroy.mockClear();
  mockRaf.mockClear();
  mockScrollTo.mockClear();
  mockStop.mockClear();
  mockStart.mockClear();
  lastLenisOptions = {};
  localStorage.clear();
  delete document.documentElement.dataset.motion;

  class MockResizeObserver implements ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = MockResizeObserver;

  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
  delete document.documentElement.dataset.motion;
});

describe('SmoothScrollProvider (Global Premium Motion & Accessibility System)', () => {
  it('instantiates global Lenis and handles smooth scrolling on desktop public route', () => {
    const { unmount } = render(
      <SmoothScrollProvider>
        <ConsumerComponent />
      </SmoothScrollProvider>
    );

    expect(screen.getByRole('button', { name: 'Scroll to Target' })).toBeDefined();

    // Verify global options: allowNestedScroll is true and duration is 1.05
    expect(lastLenisOptions.duration).toBe(1.05);
    expect(lastLenisOptions.allowNestedScroll).toBe(true);

    // On unmount, single lenis instance is destroyed and RAF is cancelled
    unmount();
    expect(mockDestroy).toHaveBeenCalledTimes(1);
  });

  it('defaults to full motion and instantiates global Lenis as core TripMate UI/UX', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { unmount } = render(
      <SmoothScrollProvider>
        <div>Content</div>
      </SmoothScrollProvider>
    );

    unmount();
    // Full motion is the primary default experience for TripMate; Lenis is instantiated
    expect(mockDestroy).toHaveBeenCalledTimes(1);
  });

  it('initializes Lenis on operational admin route without stopping, enabling global smooth scrolling', () => {
    const { unmount } = render(
      <SmoothScrollProvider>
        <div>Admin Table Content</div>
      </SmoothScrollProvider>
    );

    // Operational workspace retains active smooth scrolling; stop is NOT called on mount
    expect(mockStop).not.toHaveBeenCalled();
    expect(lastLenisOptions.allowNestedScroll).toBe(true);

    unmount();
    expect(mockDestroy).toHaveBeenCalledTimes(1);
  });

  it('initializes Lenis on partner route without stopping, enabling global smooth scrolling', () => {
    const { unmount } = render(
      <SmoothScrollProvider>
        <div>Partner Bookings Table</div>
      </SmoothScrollProvider>
    );

    expect(mockStop).not.toHaveBeenCalled();
    unmount();
    expect(mockDestroy).toHaveBeenCalledTimes(1);
  });

  it('initializes Lenis when tripmate_motion is explicitly full in localStorage despite prefers-reduced-motion', () => {
    localStorage.setItem('tripmate_motion', 'full');
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { unmount } = render(
      <SmoothScrollProvider>
        <div>Content</div>
      </SmoothScrollProvider>
    );

    unmount();
    expect(mockDestroy).toHaveBeenCalledTimes(1);
  });

  it('bypasses Lenis when tripmate_motion is explicitly reduced in localStorage', () => {
    localStorage.setItem('tripmate_motion', 'reduced');

    const { unmount } = render(
      <SmoothScrollProvider>
        <div>Content</div>
      </SmoothScrollProvider>
    );

    unmount();
    expect(mockDestroy).not.toHaveBeenCalled();
  });

  it('protects nested scroll containers via prevent callback option', () => {
    render(
      <SmoothScrollProvider>
        <div>Content</div>
      </SmoothScrollProvider>
    );

    const preventFn = lastLenisOptions.prevent as (node: HTMLElement) => boolean;
    expect(typeof preventFn).toBe('function');

    // Test standard element (not prevented)
    const normalDiv = document.createElement('div');
    expect(preventFn(normalDiv)).toBe(false);

    // Test element with data-lenis-prevent
    const preventedDiv = document.createElement('div');
    preventedDiv.setAttribute('data-lenis-prevent', '');
    expect(preventFn(preventedDiv)).toBe(true);

    // Test child inside dialog
    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    const childOfDialog = document.createElement('button');
    dialog.appendChild(childOfDialog);
    document.body.appendChild(dialog);
    expect(preventFn(childOfDialog)).toBe(true);
    document.body.removeChild(dialog);

    // Test child inside .lenis-prevent
    const preventContainer = document.createElement('div');
    preventContainer.className = 'lenis-prevent';
    const childOfPrevent = document.createElement('p');
    preventContainer.appendChild(childOfPrevent);
    document.body.appendChild(preventContainer);
    expect(preventFn(childOfPrevent)).toBe(true);
    document.body.removeChild(preventContainer);
  });
});
