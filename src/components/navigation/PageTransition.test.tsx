import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PageTransition } from './PageTransition';

// Mock usePathname
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

describe('PageTransition component', () => {
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

  it('renders children with page enter animation class', () => {
    render(
      <PageTransition>
        <div data-testid="page-content">Page Content</div>
      </PageTransition>
    );

    const content = screen.getByTestId('page-content');
    expect(content).toBeDefined();

    const container = content.parentElement!;
    expect(container.className).toContain('animate-page-enter');
  });

  it('respects prefers-reduced-motion by bypassing motion animations', () => {
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
      <PageTransition>
        <div data-testid="page-content-reduced">Reduced Content</div>
      </PageTransition>
    );

    const container = screen.getByTestId('page-content-reduced').parentElement!;
    expect(container.className).toContain('motion-reduce:animate-none');
  });
});
