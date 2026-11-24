import { beforeEach, describe, expect, it, vi } from 'vitest';
const { session, redirect } = vi.hoisted(() => ({ session: vi.fn(), redirect: vi.fn((path: string) => { throw new Error(`REDIRECT:${path}`); }) }));
vi.mock('next/headers', () => ({ cookies: vi.fn(async () => ({})) }));
vi.mock('next/navigation', () => ({ redirect }));
vi.mock('@/lib/server/adminSession', () => ({ verifyAdminSessionFromCookies: session }));
vi.mock('./ContractTemplatesScreen', () => ({ ContractTemplatesScreen: () => null }));
vi.mock('./ContractTemplateEditor', () => ({ ContractTemplateEditor: () => null }));
import Page from '../../../../app/admin/(console)/contract-templates/page';
import DetailPage from '../../../../app/admin/(console)/contract-templates/[id]/page';
import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { ContractTemplatesScreen } from './ContractTemplatesScreen';

beforeEach(() => vi.clearAllMocks());
describe('contract-template server route access', () => {
  it('redirects unauthenticated visitors and denies Staff', async () => {
    session.mockReturnValue(null);
    await expect(Page()).rejects.toThrow('REDIRECT:');
    session.mockReturnValue({ role: 'Staff' });
    expect((await Page()).type).toBe(AdminAccessDeniedView);
    expect((await DetailPage({ params: Promise.resolve({ id: '1' }) })).type).toBe(AdminAccessDeniedView);
  });
  it('renders the management screen only for Administrator', async () => {
    session.mockReturnValue({ role: 'Administrator' });
    expect((await Page()).type).toBe(ContractTemplatesScreen);
  });
});
