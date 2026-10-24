import { describe, expect, it, vi } from 'vitest';

const { redirectMock } = vi.hoisted(() => ({
  redirectMock: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));
vi.mock('next/navigation', () => ({ redirect: redirectMock }));

import AdminLoginRoute from './page';

async function redirectFor(returnUrl?: string | string[]) {
  try {
    await AdminLoginRoute({ searchParams: Promise.resolve({ returnUrl }) });
  } catch (error) {
    return (error as Error).message.replace('NEXT_REDIRECT:', '');
  }
  throw new Error('expected a redirect');
}

describe('/admin/login', () => {
  it('redirects to the unified sign-in page with no returnUrl', async () => {
    expect(await redirectFor()).toBe('/sign-in');
  });

  it('forwards a safe administration returnUrl', async () => {
    expect(await redirectFor('/admin/audit-logs?pageNumber=2')).toBe(
      `/sign-in?returnUrl=${encodeURIComponent('/admin/audit-logs?pageNumber=2')}`,
    );
  });

  it.each(['https://attacker.example/admin', '//attacker.example/admin', '/admin/login', '/traveler/trips'])(
    'drops the unsafe returnUrl %s',
    async (value) => {
      expect(await redirectFor(value)).toBe('/sign-in');
    },
  );
});
