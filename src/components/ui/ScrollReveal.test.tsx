import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ScrollReveal } from './ScrollReveal';

describe('ScrollReveal motion specifications', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
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
  });

  it('applies editorial 14px translate-y-3.5 for fade-up instead of exaggerated jump', () => {
    // Mock reduced motion false
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

    // Mock IntersectionObserver that doesn't trigger immediately
    class UnintersectedObserver implements IntersectionObserver {
      readonly root = null;
      readonly rootMargin = '';
      readonly thresholds = [];
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    }
    window.IntersectionObserver = UnintersectedObserver;

    render(
      <ScrollReveal animation="fade-up">
        <p data-testid="editorial-text">Editorial Headline</p>
      </ScrollReveal>
    );

    const wrapper = screen.getByTestId('editorial-text').parentElement!;
    expect(wrapper.getAttribute('data-revealed')).toBe('false');
    // Expect refined subtle translation (14px = translate-y-3.5)
    expect(wrapper.className).toContain('translate-y-3.5');
    expect(wrapper.className).not.toContain('translate-y-7');
  });

  it('applies subtle image scale 0.985 for zoom-in / image-reveal', () => {
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

    class UnintersectedObserver implements IntersectionObserver {
      readonly root = null;
      readonly rootMargin = '';
      readonly thresholds = [];
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    }
    window.IntersectionObserver = UnintersectedObserver;

    render(
      <ScrollReveal animation="zoom-in">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img data-testid="editorial-img" alt="Test" />
      </ScrollReveal>
    );

    const wrapper = screen.getByTestId('editorial-img').parentElement!;
    expect(wrapper.getAttribute('data-revealed')).toBe('false');
    expect(wrapper.className).toContain('scale-[0.985]');
    expect(wrapper.className).not.toContain('scale-95');
  });

  it('uses look-ahead positive rootMargin in IntersectionObserver to ensure fast-scroll safety', () => {
    let capturedOptions: IntersectionObserverInit | undefined;

    class CapturingObserver implements IntersectionObserver {
      readonly root = null;
      readonly rootMargin = '';
      readonly thresholds = [];
      constructor(_callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        capturedOptions = options;
      }
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    }
    window.IntersectionObserver = CapturingObserver;

    render(
      <ScrollReveal animation="fade-up">
        <div data-testid="target">Content</div>
      </ScrollReveal>
    );

    expect(capturedOptions).toBeDefined();
    // Look-ahead positive rootMargin (e.g. 60px 0px 60px 0px) to trigger before edge
    expect(capturedOptions?.rootMargin).toBe('60px 0px 60px 0px');
  });

  it('instantly reveals without transform delay when prefers-reduced-motion is true', async () => {
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

    render(
      <ScrollReveal animation="fade-up">
        <span data-testid="reduced-target">Reduced Content</span>
      </ScrollReveal>
    );

    await waitFor(() => {
      const wrapper = screen.getByTestId('reduced-target').parentElement!;
      expect(wrapper.getAttribute('data-revealed')).toBe('true');
      expect(wrapper.className).toContain('opacity-100');
      expect(wrapper.className).toContain('translate-y-0');
    });
  });

  it('renders EditorialTextReveal with 12px editorial-text animation (translate-y-3)', () => {
    class UnintersectedObserver implements IntersectionObserver {
      readonly root = null;
      readonly rootMargin = '';
      readonly thresholds = [];
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    }
    window.IntersectionObserver = UnintersectedObserver;

    render(
      <ScrollReveal animation="editorial-text">
        <h2 data-testid="editorial-heading">Editorial Title</h2>
      </ScrollReveal>
    );

    const wrapper = screen.getByTestId('editorial-heading').parentElement!;
    expect(wrapper.getAttribute('data-revealed')).toBe('false');
    expect(wrapper.className).toContain('translate-y-3');
    expect(wrapper.className).not.toContain('translate-y-8');
  });

  it('renders ImageReveal with 8px upward settle and scale 0.985', () => {
    class UnintersectedObserver implements IntersectionObserver {
      readonly root = null;
      readonly rootMargin = '';
      readonly thresholds = [];
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    }
    window.IntersectionObserver = UnintersectedObserver;

    render(
      <ScrollReveal animation="image-reveal">
        <div data-testid="editorial-img-container">Image Wrapper</div>
      </ScrollReveal>
    );

    const wrapper = screen.getByTestId('editorial-img-container').parentElement!;
    expect(wrapper.getAttribute('data-revealed')).toBe('false');
    expect(wrapper.className).toContain('scale-[0.985]');
    expect(wrapper.className).toContain('translate-y-2');
  });

  it('renders CardReveal with 32px upward settle and scale 0.97', () => {
    class UnintersectedObserver implements IntersectionObserver {
      readonly root = null;
      readonly rootMargin = '';
      readonly thresholds = [];
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    }
    window.IntersectionObserver = UnintersectedObserver;

    render(
      <ScrollReveal animation="card-reveal">
        <div data-testid="card-container">Card Item</div>
      </ScrollReveal>
    );

    const wrapper = screen.getByTestId('card-container').parentElement!;
    expect(wrapper.getAttribute('data-revealed')).toBe('false');
    expect(wrapper.className).toContain('scale-[0.97]');
    expect(wrapper.className).toContain('translate-y-8');
  });
});
