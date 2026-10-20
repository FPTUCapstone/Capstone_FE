import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/font/google', () => ({
  Geist: () => ({ variable: '' }),
  Geist_Mono: () => ({ variable: '' }),
  Plus_Jakarta_Sans: () => ({ variable: '' }),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock('@/features/auth/session/WebSessionProvider', () => ({
  WebSessionProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="web-session-provider">{children}</div>
  ),
}));

vi.mock('@/components/providers/SmoothScrollProvider', () => ({
  SmoothScrollProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="smooth-scroll-provider">{children}</div>
  ),
  useSmoothScroll: () => ({ lenis: null, scrollTo: vi.fn() }),
}));

vi.mock('@/components/providers/ScrollResetHandler', () => ({
  ScrollResetHandler: () => <div data-testid="scroll-reset-handler" />,
}));

vi.mock('@/components/layout/PersistentPublicLayout', () => ({
  PersistentPublicLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="persistent-public-layout">{children}</div>
  ),
}));

const RootLayout = (await import('./layout')).default;

describe('RootLayout composition', () => {
  it('mounts WebSessionProvider, SmoothScrollProvider, ScrollResetHandler, and PersistentPublicLayout wrapping children', () => {
    render(
      <RootLayout>
        <p data-testid="test-child">Child Content</p>
      </RootLayout>
    );

    expect(screen.getByTestId('web-session-provider')).toBeDefined();
    expect(screen.getByTestId('smooth-scroll-provider')).toBeDefined();
    expect(screen.getByTestId('scroll-reset-handler')).toBeDefined();
    expect(screen.getByTestId('persistent-public-layout')).toBeDefined();
    expect(screen.getByTestId('test-child')).toBeDefined();
  });
});
