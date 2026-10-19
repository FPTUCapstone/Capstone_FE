import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SmoothScrollProvider, useSmoothScroll } from '../SmoothScrollProvider';

const mockDestroy = vi.fn();
const mockRaf = vi.fn();
const mockScrollTo = vi.fn();

// Mock lenis constructor
vi.mock('lenis', () => {
  return {
    default: class MockLenis {
      destroy = mockDestroy;
      raf = mockRaf;
      scrollTo = mockScrollTo;
      constructor(public options: Record<string, unknown>) {}
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
});

describe('SmoothScrollProvider (Scoped Homepage Motion)', () => {
  it('instantiates Lenis and handles smooth scrolling on desktop', () => {
    const { unmount } = render(
      <SmoothScrollProvider>
        <ConsumerComponent />
      </SmoothScrollProvider>
    );

    expect(screen.getByRole('button', { name: 'Scroll to Target' })).toBeDefined();

    // On unmount, lenis instance is destroyed and RAF is cancelled
    unmount();
    expect(mockDestroy).toHaveBeenCalledTimes(1);
  });

  it('bypasses Lenis initialization when prefers-reduced-motion is active', () => {
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
    // Since reduced motion was active, Lenis was never instantiated
    expect(mockDestroy).not.toHaveBeenCalled();
  });
});
