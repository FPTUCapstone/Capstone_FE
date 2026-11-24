import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn(), application: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: mocks.replace }) }));
vi.mock('@/lib/authApi', () => ({ webRefresh: mocks.refresh }));
vi.mock('@/components/layout/PartnerShell', () => ({ PartnerShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock('./operatorApplicationApi', async (original) => ({ ...await original<object>(), getOperatorApplication: mocks.application }));
import { OperatorApplicationStatusPage } from './OperatorApplicationStatusPage';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.application.mockResolvedValue({ userId: 42, userStatus: 'PendingContractSignature', approvalStatus: 'Approved', companyName: 'Partner', documents: [], resubmissionCount: 0 });
});
it('refreshes authoritative onboarding before navigating from an already open review page', async () => {
  mocks.refresh.mockResolvedValue({ onboardingState: 'AwaitingSignature' });
  render(<OperatorApplicationStatusPage />);
  fireEvent.click(await screen.findByRole('button', { name: 'Xem và ký hợp đồng' }));
  await waitFor(() => expect(mocks.refresh).toHaveBeenCalledOnce());
  expect(mocks.replace).toHaveBeenCalledWith('/partner/contract');
});
