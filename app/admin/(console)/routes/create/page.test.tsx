import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const mocks = vi.hoisted(() => ({
  resolveWebSession: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock('@/lib/server/webSession', () => ({ resolveWebSession: mocks.resolveWebSession }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));

import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import CreateRoutePage from './page';

describe('CreateRoutePage (/admin/routes/create protected route)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('redirects to sign-in with the route return URL when there is no administration session', async () => {
    mocks.resolveWebSession.mockResolvedValue(null);

    await CreateRoutePage();

    expect(mocks.redirect).toHaveBeenCalledWith('/sign-in?returnUrl=%2Fadmin%2Froutes%2Fcreate');
  });

  it('renders the page for an Administrator session', async () => {
    mocks.resolveWebSession.mockResolvedValue({ accessToken: 'tok', role: 'Administrator' });

    render(await CreateRoutePage());

    expect(screen.getByRole('heading', { level: 1, name: 'Create Route' })).toBeTruthy();
  });

  it('renders AdminAccessDeniedView for a Staff session (BR-115)', async () => {
    mocks.resolveWebSession.mockResolvedValue({ accessToken: 'tok', role: 'Staff' });

    const view = await CreateRoutePage();

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(view?.type).toBe(AdminAccessDeniedView);
  });
});
