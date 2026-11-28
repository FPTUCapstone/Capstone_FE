import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import React from 'react';
import { CommissionReconciliationView } from '../components/w106/CommissionReconciliationView';
import { ToastProvider } from '../components/common/Toast';
import { StaffReconciliationService } from '../services/staffReconciliationService';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe('Screen W106: Commission Reconciliation (Staff Workspace, UC-83)', () => {
  beforeEach(() => {
    StaffReconciliationService.resetState();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const renderComponent = (preview = true) =>
    render(
      <ToastProvider>
        <CommissionReconciliationView preview={preview} />
      </ToastProvider>
    );

  it('renders reconciliation table with mandatory columns and filters in Vietnamese', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Đối soát hoa hồng đối tác/i })).toBeDefined();
    });

    // Check Staff boundary badge (no technical metadata)
    expect(screen.getByText(/Nhân viên Đối soát Tài chính/i)).toBeDefined();

    // Check Filter Bar
    expect(screen.getByText('Đối tác dịch vụ')).toBeDefined();
    expect(screen.getByText('Kỳ quyết toán')).toBeDefined();
    expect(screen.getByText('Trạng thái thanh toán')).toBeDefined();
    expect(screen.getByLabelText(/Tìm mã giao dịch ngân hàng/i)).toBeDefined();

    // Check Table Headers
    expect(screen.getByText('Đối tác / Cơ sở dịch vụ')).toBeDefined();
    expect(screen.getByText('Kỳ')).toBeDefined();
    expect(screen.getByText('Hoa hồng phải nộp')).toBeDefined();
    expect(screen.getByText('Hạn thanh toán')).toBeDefined();
    expect(screen.getByText('Trạng thái')).toBeDefined();
    expect(screen.getByText('Mã giao dịch ngân hàng')).toBeDefined();
    expect(screen.getByText('Thời gian thông báo')).toBeDefined();
    expect(screen.getByText('Thao tác')).toBeDefined();

    // Default filter is PaymentReported -> stmt-001 should be present
    expect(screen.getByText('Hội An Riverside Heritage Resort')).toBeDefined();
    expect(screen.getByText('VCB-20261205-982341')).toBeDefined();
    expect(screen.getByRole('button', { name: /Xác nhận thu tiền/i })).toBeDefined();
  });

  it('executes receipt confirmation workflow via modal and updates to Paid with MSG209', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Xác nhận thu tiền/i })).toBeDefined();
    });

    // Click Record Receipt button
    fireEvent.click(screen.getByRole('button', { name: /Xác nhận thu tiền/i }));

    // Verify Confirmation Modal
    expect(screen.getByText(/Xác nhận Đã thu tiền Hoa hồng/i)).toBeDefined();
    expect(
      screen.getByText(/đã nhận đủ 4\.440\.000 ₫/i)
    ).toBeDefined();
    expect(
      screen.getByText(/Thao tác này sẽ lưu vết giao dịch tài chính chính thức/i)
    ).toBeDefined();

    // Confirm receipt
    const confirmBtn = screen.getByRole<HTMLButtonElement>('button', { name: /Xác nhận & Cập nhật Đã thanh toán/i });
    const amount = screen.getByRole<HTMLInputElement>('textbox', { name: /Số tiền thực nhận/i });
    expect(amount.value).toBe('');
    expect(confirmBtn.disabled).toBe(true);
    fireEvent.change(amount, { target: { value: '4440000' } });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      // MSG209 toast
      expect(
        screen.getByText(/Đã xác nhận thu tiền\. Bảng kê hoa hồng được cập nhật sang trạng thái Đã thanh toán\./i)
      ).toBeDefined();

      // Action button replaced by Reconciled badge
      expect(screen.getByText(/Đã đối soát/i)).toBeDefined();
    });
  });

  it('requires the verified bank reference to reconcile an overdue statement without a report', async () => {
    const statement = {
      statementId: 42, statementCode: 'OVERDUE-42', providerName: 'Verified Provider',
      dueDate: '2026-09-15', status: 'Overdue', commissionAmount: 1250000,
    };
    const fetchRequest = vi.fn()
      .mockResolvedValueOnce(Response.json({ success: true, data: { items: [statement] } }))
      .mockResolvedValueOnce(Response.json({ errorCode: 'CommissionStatement.BankReferenceAlreadyUsed' }, { status: 409 }))
      .mockResolvedValueOnce(Response.json({
        success: true,
        data: { ...statement, status: 'Paid', bankTransferReference: 'BANK-422', verifiedBankTransferReference: 'BANK-422', confirmedAtUtc: '2026-11-26T10:00:00Z' },
      }));
    vi.stubGlobal('fetch', fetchRequest);
    renderComponent(false);

    const row = (await screen.findByText('OVERDUE-42')).closest('tr')!;
    fireEvent.click(within(row).getByRole('button', { name: /Xác nhận thu tiền/i }));
    const confirmation = within(screen.getByRole('alertdialog'));
    const submit = confirmation.getByRole('button', { name: /Xác nhận & Cập nhật Đã thanh toán/i }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    expect(fetchRequest).toHaveBeenCalledTimes(1);
    const reference = confirmation.getByRole('textbox', { name: /Mã giao dịch trên sao kê/i }) as HTMLInputElement;
    expect(reference.maxLength).toBe(100);
    fireEvent.change(reference, { target: { value: '   ' } });
    expect(submit.disabled).toBe(true);
    fireEvent.change(reference, { target: { value: ' BANK-421 ' } });
    const amount = confirmation.getByRole<HTMLInputElement>('textbox', { name: /Số tiền thực nhận/i });
    fireEvent.change(amount, { target: { value: '1000000' } });
    expect(submit.disabled).toBe(true);
    expect(confirmation.getByText(/phải khớp với hoa hồng/i)).toBeTruthy();
    fireEvent.change(amount, { target: { value: '1250000' } });
    fireEvent.click(submit);
    await waitFor(() => expect(submit.disabled).toBe(false));
    expect(reference.value).toBe(' BANK-421 ');
    expect(amount.value).toBe('1250000');
    expect(confirmation.getByText(/đã được dùng/i)).toBeTruthy();
    expect(within(row).queryByText('Đã đối soát')).toBeNull();

    fireEvent.change(reference, { target: { value: 'BANK-422' } });
    fireEvent.click(submit);
    await waitFor(() => expect(within(row).getByText('Đã đối soát')).toBeTruthy());
    expect(within(row).getByText('BANK-422')).toBeTruthy();
    expect(fetchRequest.mock.calls[1][0]).toBe('/api/admin/commercial-settlements/reconciliation/42/reconcile');
    expect(JSON.parse(fetchRequest.mock.calls[1][1].body)).toEqual({ bankTransferReference: 'BANK-421', receivedAmountVnd: 1250000 });
    expect(JSON.parse(fetchRequest.mock.calls[2][1].body)).toEqual({ bankTransferReference: 'BANK-422', receivedAmountVnd: 1250000 });
  });

  it('lets Staff correct a reported reference and displays the reported and verified values', async () => {
    const statement = {
      statementId: 21, statementCode: 'REPORTED-21', providerName: 'Verified Provider',
      status: 'PaymentReported', commissionAmount: 700000,
      bankTransferReference: 'CLAIM-21', reportedBankTransferReference: 'CLAIM-21',
    };
    const fetchRequest = vi.fn()
      .mockResolvedValueOnce(Response.json({ success: true, data: { items: [statement] } }))
      .mockResolvedValueOnce(Response.json({ success: true, data: {
        ...statement, status: 'Paid', bankTransferReference: 'BANK-21',
        verifiedBankTransferReference: 'BANK-21', confirmedAtUtc: '2026-11-26T10:00:00Z',
      } }));
    vi.stubGlobal('fetch', fetchRequest);
    renderComponent(false);

    const row = (await screen.findByText('REPORTED-21')).closest('tr')!;
    fireEvent.click(within(row).getByRole('button', { name: /Xác nhận thu tiền/i }));
    const confirmation = within(screen.getByRole('alertdialog'));
    const reference = confirmation.getByRole<HTMLInputElement>('textbox', { name: /Mã giao dịch trên sao kê/i });
    expect(reference.value).toBe('CLAIM-21');
    fireEvent.change(reference, { target: { value: 'BANK-21' } });
    fireEvent.change(confirmation.getByRole('textbox', { name: /Số tiền thực nhận/i }), { target: { value: '700000' } });
    fireEvent.click(confirmation.getByRole('button', { name: /Xác nhận & Cập nhật Đã thanh toán/i }));

    await within(row).findByText('BANK-21');
    expect(within(row).getByText(/Đối tác đã khai.*CLAIM-21/i)).toBeTruthy();
    expect(JSON.parse(fetchRequest.mock.calls[1][1].body)).toEqual({ bankTransferReference: 'BANK-21', receivedAmountVnd: 700000 });
  });

  it('labels a zero balance as no payment due and does not offer a receipt', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ success: true, data: { items: [{
      statementId: 9, statementCode: 'ZERO-9', providerName: 'Verified Provider',
      status: 'Overdue', commissionAmount: 0,
    }] } })));
    renderComponent(false);

    const row = (await screen.findByText('ZERO-9')).closest('tr')!;
    expect(within(row).getByText(/Không cần thanh toán/i)).toBeTruthy();
    expect(within(row).queryByRole('button', { name: /Xác nhận thu tiền/i })).toBeNull();
  });

  it('does not display demonstration statements when the production API is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ errorCode: 'MSG127' }, { status: 503 })));
    renderComponent(false);
    await waitFor(() => expect(screen.queryByText(/Đang tải/i)).toBeNull());
    expect(screen.queryByText('VCB-20261205-982341')).toBeNull();
    expect(screen.queryByRole('button', { name: /Xác nhận thu tiền/i })).toBeNull();
  });

  it('keeps the overdue filter while Staff opens later pages of real statements', async () => {
    const fetchRequest = vi.fn().mockImplementation((url: string) => {
      const params = new URL(url, 'https://tripmate.test').searchParams;
      const secondPage = params.get('pageNumber') === '2';
      const status = params.get('status');
      return Promise.resolve(Response.json({
        success: true,
        data: {
          items: [{
            statementId: secondPage ? 21 : 1,
            statementCode: secondPage ? 'OVERDUE-21' : 'STATEMENT-01',
            providerName: 'Verified Provider',
            commissionAmount: 100000,
            status,
          }],
          totalCount: status === 'Overdue' ? 21 : 1,
        },
      }));
    });
    vi.stubGlobal('fetch', fetchRequest);
    renderComponent(false);

    await screen.findByText('STATEMENT-01');
    fireEvent.click(screen.getByRole('combobox', { name: 'Trạng thái thanh toán' }));
    fireEvent.click(screen.getByRole('option', { name: /Quá hạn/i }));
    fireEvent.click(screen.getByRole('button', { name: /Tìm kiếm/i }));
    fireEvent.click(await screen.findByRole('button', { name: 'Sau' }));

    await screen.findByText('OVERDUE-21');
    const [lastUrl] = fetchRequest.mock.lastCall!;
    const lastQuery = new URL(lastUrl, 'https://tripmate.test').searchParams;
    expect(lastQuery.get('pageNumber')).toBe('2');
    expect(lastQuery.get('status')).toBe('Overdue');
    expect(screen.getByRole('button', { name: /Xác nhận thu tiền/i })).toBeDefined();
  });
});
