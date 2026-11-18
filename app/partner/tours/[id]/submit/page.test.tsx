import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import SubmitTourPage from './page';
import { OperatorTourApiError } from '@/features/operator/tours/services/operatorTourApi';

const mocks = vi.hoisted(() => ({ getTour: vi.fn(), replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useParams: () => ({ id: '42' }), useSearchParams: () => new URLSearchParams(), useRouter: () => ({ replace: mocks.replace }) }));
vi.mock('@/features/operator/common/components/PartnerWorkspaceLayout', () => ({ PartnerWorkspaceLayout: ({ children }: { children: ReactNode }) => <div><nav>Operator workspace</nav>{children}</div> }));
vi.mock('@/features/operator/tours/services/operatorTourService', () => ({ getOperatorTourById: mocks.getTour }));

describe('UC-37 real submission route errors', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it.each([[403, /quyền/i], [404, /Không tìm thấy/i], [0, /kết nối/i]])('shows the specific load failure %s inside the operator workspace and offers retry', async (status, message) => {
    mocks.getTour.mockRejectedValue(new OperatorTourApiError(status as number, undefined, 'upstream internals'));
    render(<SubmitTourPage />);
    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(message as RegExp));
    expect(screen.getByRole('navigation').textContent).toContain('Operator workspace');
    expect(screen.queryByText(/đang chờ cập nhật hệ thống/i)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Thử tải lại/i }));
    await waitFor(() => expect(mocks.getTour).toHaveBeenCalledTimes(2));
  });
  it('sends an expired session to sign-in with the existing submit route as returnUrl', async () => {
    mocks.getTour.mockRejectedValue(new OperatorTourApiError(401, 'AUTH_REQUIRED', 'expired'));
    render(<SubmitTourPage />);
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/sign-in?returnUrl=%2Fpartner%2Ftours%2F42%2Fsubmit'));
  });
});
