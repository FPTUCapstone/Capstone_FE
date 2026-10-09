import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { AuthStorage } from '../session/authSession';
import { OperatorApplicationError } from '@/features/operator/application/operatorApplicationApi';

// The Partner pages now mount the CR-11 route guard, which uses the App Router.
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }));
const applicationApi = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@/features/operator/application/operatorApplicationApi', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/features/operator/application/operatorApplicationApi')>(),
  getOperatorApplication: applicationApi.get,
}));

import PartnerApplicationPage from '../../../../app/partner/application/page';
import PartnerPage from '../../../../app/partner/page';
const context = (applicationStatus: string | null) => ({ userId:1,email:'operator@example.com',fullName:'',role:'TourOperator',status:'Active',applicationStatus,accessToken:'access',accessTokenExpiresAtUtc:new Date(Date.now()+60000).toISOString() });
beforeEach(() => { AuthStorage.clear(); applicationApi.get.mockReset(); });
it.each(['PendingApproval','Rejected'])('displays actual BE application %s', async (status) => {
 applicationApi.get.mockResolvedValue({ userId: 1, userStatus: status, approvalStatus: status, companyName: 'TripMate Partner', businessLicenseNo: '79-0123/2026/TCDL-GPLHQT', taxCode: '0101234567', businessAddress: null, contactPerson: 'Operator', contactPhone: null, rejectionReason: status === 'Rejected' ? 'Fix document' : null, reviewedAtUtc: null, resubmissionCount: 0, documents: [] });
 AuthStorage.accept(context(status), false); render(<PartnerApplicationPage />); await waitFor(() => expect(screen.getAllByText(status).length).toBeGreaterThan(0));
});
it('keeps missing profile unresolved and authenticated', async () => {
 applicationApi.get.mockRejectedValue(new OperatorApplicationError(404));
 AuthStorage.accept(context(null), false); render(<PartnerApplicationPage />); await waitFor(() => expect(screen.getByText('Tour Operator application not found.')).toBeDefined()); expect(AuthStorage.getContext()).not.toBeNull(); expect(screen.queryByText('PendingApproval')).toBeNull();
});
it.each(['PendingApproval','Rejected',null])('does not show approved area for %s', (status) => {
 AuthStorage.accept(context(status), false); render(<PartnerPage />); expect(screen.queryByText(/Khu/)).toBeNull();
});
it('shows approved placeholder only with authoritative approved context', () => {
 AuthStorage.accept(context('Approved'), false); render(<PartnerPage />); expect(screen.getByText(/Khu/)).toBeDefined();
});
