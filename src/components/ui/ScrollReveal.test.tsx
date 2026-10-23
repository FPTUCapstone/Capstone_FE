import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ScrollReveal, EditorialTextReveal, ImageReveal, CardReveal } from './ScrollReveal';

describe('ScrollReveal motion specifications', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('applies original distinct upward translation for fade-up animation (translate-y-7)', () => {
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
    expect(wrapper.className).toContain('translate-y-7');
  });

  it('applies subtle image scale 0.95 for zoom-in animation', () => {
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
    expect(wrapper.className).toContain('scale-95');
  });

  it('uses viewport rootMargin in IntersectionObserver to ensure in-view animations', () => {
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
    expect(capturedOptions?.rootMargin).toBe('0px 0px -40px 0px');
  });

  it('reveals element with smooth entrance transition when IntersectionObserver intersects', () => {
    let triggerIntersection: IntersectionObserverCallback | undefined;

    class MockObserver implements IntersectionObserver {
      readonly root = null;
      readonly rootMargin = '';
      readonly thresholds = [];
      constructor(callback: IntersectionObserverCallback) {
        triggerIntersection = callback;
      }
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    }
    window.IntersectionObserver = MockObserver;

    render(
      <ScrollReveal animation="fade-up">
        <span data-testid="target-span">Animated Content</span>
      </ScrollReveal>
    );

    const wrapper = screen.getByTestId('target-span').parentElement!;
    expect(wrapper.getAttribute('data-revealed')).toBe('false');

    // Trigger intersection
    act(() => {
      triggerIntersection?.(
        [
          {
            isIntersecting: true,
            target: wrapper,
          } as unknown as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver
      );
    });

    expect(wrapper.getAttribute('data-revealed')).toBe('true');
    expect(wrapper.className).toContain('opacity-100');
    expect(wrapper.className).toContain('translate-y-0');
  });

  it('renders EditorialTextReveal with upward editorial-text animation (translate-y-4)', () => {
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
      <EditorialTextReveal>
        <h2 data-testid="editorial-heading">Editorial Title</h2>
      </EditorialTextReveal>
    );

    const wrapper = screen.getByTestId('editorial-heading').parentElement!;
    expect(wrapper.getAttribute('data-revealed')).toBe('false');
    expect(wrapper.className).toContain('translate-y-4');
  });

  it('renders ImageReveal with upward settle and scale', () => {
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
      <ImageReveal>
        <div data-testid="editorial-img-container">Image Wrapper</div>
      </ImageReveal>
    );

    const wrapper = screen.getByTestId('editorial-img-container').parentElement!;
    expect(wrapper.getAttribute('data-revealed')).toBe('false');
    expect(wrapper.className).toContain('scale-[0.97]');
    expect(wrapper.className).toContain('translate-y-4');
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
      <CardReveal>
        <div data-testid="card-container">Card Item</div>
      </CardReveal>
    );

    const wrapper = screen.getByTestId('card-container').parentElement!;
    expect(wrapper.getAttribute('data-revealed')).toBe('false');
    expect(wrapper.className).toContain('scale-[0.97]');
    expect(wrapper.className).toContain('translate-y-8');
  });
});
