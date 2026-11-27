import { beforeEach, describe, expect, it, vi } from 'vitest';
const { session, redirect } = vi.hoisted(() => ({ session: vi.fn(), redirect: vi.fn((path: string) => { throw new Error(`REDIRECT:${path}`); }) }));
vi.mock('next/headers', () => ({ cookies: vi.fn(async () => ({})) }));
vi.mock('next/navigation', () => ({ redirect }));
vi.mock('@/lib/server/adminSession', () => ({ verifyAdminSessionFromCookies: session }));
vi.mock('./AdminPaymentChannelsScreen', () => ({ AdminPaymentChannelsScreen: () => null }));
import Page from '../../../../app/admin/(console)/operator-payment-channels/page';
import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { AdminPaymentChannelsScreen } from './AdminPaymentChannelsScreen';
beforeEach(() => vi.clearAllMocks());
describe('channel Administrator page access', () => {
  it('redirects Guest, denies Staff and permits Administrator', async () => {
    session.mockReturnValue(null); await expect(Page()).rejects.toThrow('REDIRECT:');
    session.mockReturnValue({ role: 'Staff' }); expect((await Page()).type).toBe(AdminAccessDeniedView);
    session.mockReturnValue({ role: 'Administrator' }); expect((await Page()).type).toBe(AdminPaymentChannelsScreen);
  });
});
