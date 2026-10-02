import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Reduced-Motion Accessibility & Contract', () => {
  describe('ScrollReveal reduced-motion behavior', () => {
    it('reveals content immediately when prefers-reduced-motion is active without waiting for intersection', async () => {
      // Mock matchMedia returning true for reduced motion
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
          <div data-testid="revealed-content">Immediate Content</div>
        </ScrollReveal>
      );

      await waitFor(() => {
        const element = screen.getByTestId('revealed-content').parentElement!;
        expect(element.getAttribute('data-revealed')).toBe('true');
        expect(element.className).toContain('opacity-100');
        expect(element.className).toContain('translate-y-0');
        expect(element.className).not.toContain('opacity-0');
      });
    });

    it('defers reveal when prefers-reduced-motion is false and intersection has not occurred', () => {
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

      // Mock IntersectionObserver that does NOT fire intersection
      class InactiveIntersectionObserver implements IntersectionObserver {
        readonly root: Element | Document | null = null;
        readonly rootMargin: string = '';
        readonly thresholds: ReadonlyArray<number> = [];
        observe() {}
        unobserve() {}
        disconnect() {}
        takeRecords(): IntersectionObserverEntry[] {
          return [];
        }
      }
      window.IntersectionObserver = InactiveIntersectionObserver;

      render(
        <ScrollReveal animation="fade-up">
          <div data-testid="deferred-content">Deferred Content</div>
        </ScrollReveal>
      );

      const element = screen.getByTestId('deferred-content').parentElement!;
      expect(element.getAttribute('data-revealed')).toBe('false');
      expect(element.className).toContain('opacity-0');
    });
  });

  describe('CSS stylesheet reduced-motion contract in app/globals.css', () => {
    it('covers animate-ping, animate-pulse, animate-spin, animate-in, and motion utilities in reduced-motion media query', () => {
      const globalsCssPath = path.resolve(process.cwd(), 'app/globals.css');
      const cssContent = fs.readFileSync(globalsCssPath, 'utf8');

      expect(cssContent).toContain('@media (prefers-reduced-motion: reduce)');

      const reducedMotionBlock = cssContent.slice(
        cssContent.lastIndexOf('@media (prefers-reduced-motion: reduce)')
      );

      // Verify essential Landing animation utilities are explicitly suppressed
      expect(reducedMotionBlock).toContain('.animate-ping');
      expect(reducedMotionBlock).toContain('.animate-pulse');
      expect(reducedMotionBlock).toContain('.animate-spin');
      expect(reducedMotionBlock).toContain('.animate-in');
      expect(reducedMotionBlock).toContain('.animate-route-draw');
      expect(reducedMotionBlock).toContain('.animate-ambient-float');
      expect(reducedMotionBlock).toContain('.tilt-card:hover');
      expect(reducedMotionBlock).toContain('.btn-press:active');
      expect(reducedMotionBlock).toContain('animation: none !important');
    });
  });
});
