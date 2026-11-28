import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CommissionReconciliationPage from './page';

const mocks = vi.hoisted(() => ({ session: vi.fn(), redirect: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: async () => ({}) }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('@/lib/server/adminSession', () => ({ verifyAdminSessionFromCookies: mocks.session }));

describe('commission reconciliation direct URL', () => {
  beforeEach(() => vi.resetAllMocks());

  it('shows the reconciliation screen to Staff', async () => {
    mocks.session.mockReturnValue({ role: 'Staff' });
    expect(renderToStaticMarkup((await CommissionReconciliationPage())!)).toContain('Đối soát hoa hồng đối tác');
  });

  it('denies an Administrator at the same URL', async () => {
    mocks.session.mockReturnValue({ role: 'Administrator' });
    const markup = renderToStaticMarkup((await CommissionReconciliationPage())!);
    expect(markup).toContain('Staff Access Required');
    expect(markup).not.toContain('Đối soát hoa hồng đối tác');
  });

  it('returns a signed-out visitor to sign-in with the return path', async () => {
    mocks.session.mockReturnValue(null);
    await CommissionReconciliationPage();
    expect(mocks.redirect).toHaveBeenCalledWith('/admin/login?returnUrl=%2Fadmin%2Fcommercial-settlements%2Freconciliation');
  });
});
