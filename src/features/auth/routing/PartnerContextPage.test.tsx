import { render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { AuthStorage } from '../session/authSession';

// The Partner pages now mount the CR-11 route guard, which uses the App Router.
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }));

import PartnerApplicationPage from '../../../../app/partner/application/page';
import PartnerPage from '../../../../app/partner/page';
const context = (applicationStatus: string | null) => ({ userId:1,email:'operator@example.com',fullName:'',role:'TourOperator',status:'Active',applicationStatus,accessToken:'access',accessTokenExpiresAtUtc:new Date(Date.now()+60000).toISOString() });
beforeEach(() => AuthStorage.clear());
it.each(['PendingApproval','Rejected'])('displays actual BE application %s', (status) => {
 AuthStorage.accept(context(status), false); render(<PartnerApplicationPage />); expect(screen.getByText(status)).toBeDefined();
});
it('keeps missing profile unresolved and authenticated', () => {
 AuthStorage.accept(context(null), false); render(<PartnerApplicationPage />); expect(screen.getByText(/Partner\./)).toBeDefined(); expect(AuthStorage.getContext()).not.toBeNull(); expect(screen.queryByText('PendingApproval')).toBeNull();
});
it.each(['PendingApproval','Rejected',null])('does not show approved area for %s', (status) => {
 AuthStorage.accept(context(status), false); render(<PartnerPage />); expect(screen.queryByText(/Khu/)).toBeNull();
});
it('shows approved placeholder only with authoritative approved context', () => {
 AuthStorage.accept(context('Approved'), false); render(<PartnerPage />); expect(screen.getByText(/Khu/)).toBeDefined();
});
