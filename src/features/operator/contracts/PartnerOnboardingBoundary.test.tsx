import { render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
const { session, pathname, replace } = vi.hoisted(() => ({ session: vi.fn(), pathname: vi.fn(), replace: vi.fn() }));
vi.mock('@/features/auth/session/useWebSession', () => ({ useWebSession: session }));
vi.mock('next/navigation', () => ({ usePathname: pathname, useRouter: () => ({ replace }) }));
import { PartnerOnboardingBoundary } from './PartnerOnboardingBoundary';
beforeEach(() => { vi.clearAllMocks(); pathname.mockReturnValue('/partner/tours'); });
it('blocks every partner business page while waiting for a signature, including old routes without an individual guard', () => {
  session.mockReturnValue({ status: 'authenticated', context: { role: 'TourOperator', onboardingState: 'AwaitingSignature' } });
  render(<PartnerOnboardingBoundary><p>Business</p></PartnerOnboardingBoundary>);
  expect(screen.queryByText('Business')).toBeNull(); expect(replace).toHaveBeenCalledWith('/partner/contract');
});
it('allows the signing page and keeps legacy operator behavior unchanged', () => {
  session.mockReturnValue({ status: 'authenticated', context: { role: 'TourOperator', onboardingState: 'AwaitingSignature' } });
  pathname.mockReturnValue('/partner/contract'); const view = render(<PartnerOnboardingBoundary><p>Contract</p></PartnerOnboardingBoundary>);
  expect(screen.getByText('Contract')).toBeTruthy(); expect(replace).not.toHaveBeenCalled();
  session.mockReturnValue({ status: 'authenticated', context: { role: 'TourOperator' } }); pathname.mockReturnValue('/partner/tours');
  view.rerender(<PartnerOnboardingBoundary><p>Business</p></PartnerOnboardingBoundary>);
  expect(screen.getByText('Business')).toBeTruthy();
});
it('never flashes business content during session restoration', () => {
  session.mockReturnValue({ status: 'restoring', context: null });
  render(<PartnerOnboardingBoundary><p>Business</p></PartnerOnboardingBoundary>);
  expect(screen.queryByText('Business')).toBeNull(); expect(replace).not.toHaveBeenCalled();
});
