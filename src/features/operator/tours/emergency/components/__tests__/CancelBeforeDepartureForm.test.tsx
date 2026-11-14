import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CancelBeforeDepartureForm } from '../CancelBeforeDepartureForm';
import * as api from '../../operatorEmergencyApi';
import type { EmergencyTourImpactResponse } from '../../types';

const mockImpact: EmergencyTourImpactResponse = {
  tourId: 100,
  scheduleId: 50,
  scheduleStatus: 'Scheduled',
  action: 'CancelBeforeDeparture',
  impactVersion: 'imp-v1',
  paidBookingCount: 10,
  unpaidBookingCount: 1,
  totalPassengerCount: 20,
  activeSessionCount: 0,
  unusedTicketCount: 20,
  hasUnverifiedSessions: false,
};

describe('CancelBeforeDepartureForm', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders form inputs for reason, details, and optional evidence', () => {
    render(<CancelBeforeDepartureForm impact={mockImpact} onSuccess={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByLabelText(/Lý do hủy khẩn cấp/i)).toBeDefined();
    expect(screen.getByLabelText(/Lý do hiển thị cho du khách/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Xác nhận hủy trước khởi hành/i })).toBeDefined();
  });

  it('validates required fields, re-verifies fresh impact and submits with idempotency key', async () => {
    vi.spyOn(api, 'getEmergencyImpact').mockResolvedValueOnce(mockImpact);
    const cancelSpy = vi.spyOn(api, 'cancelBeforeDeparture').mockResolvedValueOnce({
      operationId: 123,
      tourScheduleId: 50,
      action: 'CancelBeforeDeparture',
      scheduleStatus: 'Cancelled',
      affectedBookingCount: 10,
      committedAtUtc: '2026-11-03T10:05:00Z',
    });
    const onSuccess = vi.fn();

    render(<CancelBeforeDepartureForm impact={mockImpact} onSuccess={onSuccess} onCancel={vi.fn()} />);

    // Fill details
    const detailsInput = screen.getByLabelText(/Lý do hiển thị cho du khách/i);
    fireEvent.change(detailsInput, { target: { value: 'Bão số 9 cấm biển theo chỉ thị UBND' } });

    const submitBtn = screen.getByRole('button', { name: /Xác nhận hủy trước khởi hành/i });
    fireEvent.click(submitBtn);

    // Confirmation dialog appears after verifying fresh impact
    await waitFor(() => {
      expect(screen.getByText(/Bạn có chắc chắn muốn hủy lịch khởi hành này\?/i)).toBeDefined();
    });
    expect(screen.getByText(/Mỗi booking đã thanh toán sẽ được hoàn 100% số tiền đã trả/)).toBeDefined();

    const confirmModalBtn = screen.getByRole('button', { name: /Đồng ý hủy/i });
    fireEvent.click(confirmModalBtn);

    await waitFor(() => {
      expect(cancelSpy).toHaveBeenCalledWith(
        100,
        50,
        expect.objectContaining({
          impactVersion: 'imp-v1',
          reason: 'WeatherEmergency',
          reasonDetails: 'Bão số 9 cấm biển theo chỉ thị UBND',
        }),
        expect.any(String) // idempotency key (UUID)
      );
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('defers authority evidence so an AuthorityDirective cancellation is not refused', async () => {
    vi.spyOn(api, 'getEmergencyImpact').mockResolvedValueOnce(mockImpact);
    const cancelSpy = vi.spyOn(api, 'cancelBeforeDeparture').mockResolvedValueOnce({
      operationId: 123,
      tourScheduleId: 50,
      action: 'CancelBeforeDeparture',
      scheduleStatus: 'Cancelled',
      affectedBookingCount: 10,
      committedAtUtc: '2026-11-03T10:05:00Z',
    });

    render(<CancelBeforeDepartureForm impact={mockImpact} onSuccess={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/Lý do hủy khẩn cấp/i), { target: { value: 'AuthorityDirective' } });
    fireEvent.change(screen.getByLabelText(/Lý do hiển thị cho du khách/i), { target: { value: 'Lệnh cấm đường' } });
    fireEvent.click(screen.getByRole('button', { name: /Xác nhận hủy trước khởi hành/i }));
    fireEvent.click(await screen.findByRole('button', { name: /Đồng ý hủy/i }));

    await waitFor(() => {
      expect(cancelSpy).toHaveBeenCalledWith(
        100,
        50,
        expect.objectContaining({ reason: 'AuthorityDirective', addEvidenceLater: true }),
        expect.any(String)
      );
    });
  });

  it('opens confirmation on retry once the refreshed impact is unchanged', async () => {
    const changed = { ...mockImpact, impactVersion: 'imp-v2-changed', paidBookingCount: 12 };
    vi.spyOn(api, 'getEmergencyImpact').mockResolvedValueOnce(changed).mockResolvedValueOnce(changed);

    render(<CancelBeforeDepartureForm impact={mockImpact} onSuccess={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/Lý do hiển thị cho du khách/i), { target: { value: 'Bão số 9' } });
    const submitBtn = screen.getByRole('button', { name: /Xác nhận hủy trước khởi hành/i });
    fireEvent.click(submitBtn);
    await screen.findByText(/Dữ liệu tác động vừa được cập nhật trên hệ thống/i);

    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Bạn có chắc chắn muốn hủy lịch khởi hành này\?/i)).toBeDefined();
  });

  it('blocks confirmation dialog if impactVersion changed on server before confirm', async () => {
    vi.spyOn(api, 'getEmergencyImpact').mockResolvedValueOnce({
      ...mockImpact,
      impactVersion: 'imp-v2-changed',
      paidBookingCount: 12,
    });

    render(<CancelBeforeDepartureForm impact={mockImpact} onSuccess={vi.fn()} onCancel={vi.fn()} />);

    const detailsInput = screen.getByLabelText(/Lý do hiển thị cho du khách/i);
    fireEvent.change(detailsInput, { target: { value: 'Bão số 9' } });

    const submitBtn = screen.getByRole('button', { name: /Xác nhận hủy trước khởi hành/i });
    fireEvent.click(submitBtn);

    // Expect warning message and dialog NOT opened
    await waitFor(() => {
      expect(screen.getByText(/Dữ liệu tác động vừa được cập nhật trên hệ thống/i)).toBeDefined();
      expect(screen.queryByText(/Bạn có chắc chắn muốn hủy lịch khởi hành này\?/i)).toBeNull();
    });
  });

  it('generates a new idempotency key when payload is modified after a failure', async () => {
    vi.spyOn(api, 'getEmergencyImpact').mockResolvedValue(mockImpact);
    const cancelSpy = vi
      .spyOn(api, 'cancelBeforeDeparture')
      .mockRejectedValueOnce(new api.OperatorEmergencyApiError('Server error', 500))
      .mockResolvedValueOnce({
        operationId: 124,
        tourScheduleId: 50,
        action: 'CancelBeforeDeparture',
        scheduleStatus: 'Cancelled',
        affectedBookingCount: 10,
        committedAtUtc: '2026-11-03T10:06:00Z',
      });

    render(<CancelBeforeDepartureForm impact={mockImpact} onSuccess={vi.fn()} onCancel={vi.fn()} />);

    const detailsInput = screen.getByLabelText(/Lý do hiển thị cho du khách/i);
    fireEvent.change(detailsInput, { target: { value: 'Bão số 9' } });

    // 1st submit attempt
    fireEvent.click(screen.getByRole('button', { name: /Xác nhận hủy trước khởi hành/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Đồng ý hủy/i })).toBeDefined());
    fireEvent.click(screen.getByRole('button', { name: /Đồng ý hủy/i }));

    await waitFor(() => {
      expect(screen.getByText(/Server error/i)).toBeDefined();
    });
    const firstKey = cancelSpy.mock.calls[0][3];

    // Change payload: details changed
    fireEvent.change(detailsInput, { target: { value: 'Bão số 9 tăng cấp 11 cấm biển tuyệt đối' } });

    // 2nd submit attempt with new payload
    fireEvent.click(screen.getByRole('button', { name: /Xác nhận hủy trước khởi hành/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Đồng ý hủy/i })).toBeDefined());
    fireEvent.click(screen.getByRole('button', { name: /Đồng ý hủy/i }));

    await waitFor(() => {
      expect(cancelSpy).toHaveBeenCalledTimes(2);
    });
    const secondKey = cancelSpy.mock.calls[1][3];
    expect(secondKey).not.toBe(firstKey);
  });

  describe('evidence link', () => {
    const cancelled = {
      operationId: 125,
      tourScheduleId: 50,
      action: 'CancelBeforeDeparture',
      scheduleStatus: 'Cancelled',
      affectedBookingCount: 10,
      committedAtUtc: '2026-11-03T10:07:00Z',
    };
    const typeLink = (value: string) =>
      fireEvent.change(screen.getByPlaceholderText('https://...'), { target: { value } });
    const typeDetails = () =>
      fireEvent.change(screen.getByRole('textbox', { name: /Lý do hiển thị cho du khách/i }), {
        target: { value: 'Storm warning' },
      });
    const submit = () =>
      fireEvent.click(screen.getByRole('button', { name: /Xác nhận hủy trước khởi hành/i }));
    const confirm = async () =>
      fireEvent.click(await screen.findByRole('button', { name: /Đồng ý hủy/i }));
    const renderForm = () =>
      render(<CancelBeforeDepartureForm impact={mockImpact} onSuccess={vi.fn()} onCancel={vi.fn()} />);

    it('sends an HTTPS link as evidenceUrl, not as evidenceReference', async () => {
      vi.spyOn(api, 'getEmergencyImpact').mockResolvedValue(mockImpact);
      const cancelSpy = vi.spyOn(api, 'cancelBeforeDeparture').mockResolvedValueOnce(cancelled);
      renderForm();

      typeDetails();
      typeLink('https://danang.gov.vn/directive.pdf');
      submit();
      await confirm();

      await waitFor(() => expect(cancelSpy).toHaveBeenCalledTimes(1));
      expect(cancelSpy.mock.calls[0][2]).toMatchObject({
        evidenceUrl: 'https://danang.gov.vn/directive.pdf',
        evidenceReference: null,
      });
    });

    it('trims the link before sending it', async () => {
      vi.spyOn(api, 'getEmergencyImpact').mockResolvedValue(mockImpact);
      const cancelSpy = vi.spyOn(api, 'cancelBeforeDeparture').mockResolvedValueOnce(cancelled);
      renderForm();

      typeDetails();
      typeLink('  https://danang.gov.vn/directive.pdf  ');
      submit();
      await confirm();

      await waitFor(() => expect(cancelSpy).toHaveBeenCalledTimes(1));
      expect(cancelSpy.mock.calls[0][2].evidenceUrl).toBe('https://danang.gov.vn/directive.pdf');
    });

    it('accepts an empty link', async () => {
      vi.spyOn(api, 'getEmergencyImpact').mockResolvedValue(mockImpact);
      const cancelSpy = vi.spyOn(api, 'cancelBeforeDeparture').mockResolvedValueOnce(cancelled);
      renderForm();

      typeDetails();
      submit();
      await confirm();

      await waitFor(() => expect(cancelSpy).toHaveBeenCalledTimes(1));
      expect(cancelSpy.mock.calls[0][2].evidenceUrl).toBeNull();
    });

    it.each([
      ['plain HTTP', 'http://danang.gov.vn/directive.pdf'],
      ['malformed text', 'not a link'],
      ['relative path', '/files/directive.pdf'],
      ['script protocol', 'javascript:alert(1)'],
      ['data protocol', 'data:text/plain,hello'],
      ['other protocol', 'ftp://danang.gov.vn/directive.pdf'],
      ['embedded credentials', 'https://user:secret@danang.gov.vn/directive.pdf'],
    ])('blocks %s next to the field without calling the API', async (_name, link) => {
      const impactSpy = vi.spyOn(api, 'getEmergencyImpact').mockResolvedValue(mockImpact);
      const cancelSpy = vi.spyOn(api, 'cancelBeforeDeparture').mockResolvedValue(cancelled);
      renderForm();

      typeDetails();
      typeLink(link);
      submit();

      const input = screen.getByPlaceholderText('https://...');
      await waitFor(() => expect(input.getAttribute('aria-invalid')).toBe('true'));
      const describedBy = input.getAttribute('aria-describedby') ?? '';
      expect(document.getElementById(describedBy.split(' ')[0])?.textContent).toMatch(/HTTPS/);
      expect(impactSpy).not.toHaveBeenCalled();
      expect(cancelSpy).not.toHaveBeenCalled();
    });

    it('keeps the same idempotency key when an unchanged request is retried', async () => {
      vi.spyOn(api, 'getEmergencyImpact').mockResolvedValue(mockImpact);
      const cancelSpy = vi
        .spyOn(api, 'cancelBeforeDeparture')
        .mockRejectedValueOnce(new api.OperatorEmergencyApiError('Server error', 500))
        .mockResolvedValueOnce(cancelled);
      renderForm();

      typeDetails();
      typeLink('https://danang.gov.vn/directive.pdf');
      submit();
      await confirm();
      await screen.findByText(/Server error/i);
      submit();
      await confirm();

      await waitFor(() => expect(cancelSpy).toHaveBeenCalledTimes(2));
      expect(cancelSpy.mock.calls[1][3]).toBe(cancelSpy.mock.calls[0][3]);
    });

    it('uses a new idempotency key after the link changes', async () => {
      vi.spyOn(api, 'getEmergencyImpact').mockResolvedValue(mockImpact);
      const cancelSpy = vi
        .spyOn(api, 'cancelBeforeDeparture')
        .mockRejectedValueOnce(new api.OperatorEmergencyApiError('Server error', 500))
        .mockResolvedValueOnce(cancelled);
      renderForm();

      typeDetails();
      typeLink('https://danang.gov.vn/directive.pdf');
      submit();
      await confirm();
      await screen.findByText(/Server error/i);
      typeLink('https://danang.gov.vn/directive-2.pdf');
      submit();
      await confirm();

      await waitFor(() => expect(cancelSpy).toHaveBeenCalledTimes(2));
      expect(cancelSpy.mock.calls[1][3]).not.toBe(cancelSpy.mock.calls[0][3]);
    });

    const typeField = (label: RegExp, value: string) =>
      fireEvent.change(screen.getByLabelText(label), { target: { value } });
    const chooseReason = (value: string) =>
      fireEvent.change(screen.getByLabelText(/Lý do hủy khẩn cấp/i), { target: { value } });
    const sendAndReadPayload = async () => {
      vi.spyOn(api, 'getEmergencyImpact').mockResolvedValue(mockImpact);
      const cancelSpy = vi.spyOn(api, 'cancelBeforeDeparture').mockResolvedValueOnce(cancelled);
      submit();
      await confirm();
      await waitFor(() => expect(cancelSpy).toHaveBeenCalledTimes(1));
      return cancelSpy.mock.calls[0][2];
    };

    it('sends each evidence value in its own field, trimmed', async () => {
      renderForm();
      typeDetails();
      typeLink(' https://danang.gov.vn/directive.pdf ');
      typeField(/Cơ quan ban hành/i, ' Da Nang People Committee ');
      typeField(/Số văn bản/i, ' 08/CD-PCTT ');

      expect(await sendAndReadPayload()).toMatchObject({
        evidenceUrl: 'https://danang.gov.vn/directive.pdf',
        authorityReference: 'Da Nang People Committee',
        evidenceReference: '08/CD-PCTT',
      });
    });

    it('sends empty evidence values as null', async () => {
      renderForm();
      typeDetails();
      typeField(/Cơ quan ban hành/i, '   ');
      typeField(/Số văn bản/i, '   ');

      expect(await sendAndReadPayload()).toMatchObject({
        evidenceUrl: null,
        authorityReference: null,
        evidenceReference: null,
      });
    });

    it('accepts a 200-character authority and counts it', async () => {
      renderForm();
      expect(screen.getByText('0 / 200')).toBeDefined();
      typeDetails();
      typeField(/Cơ quan ban hành/i, 'a'.repeat(200));
      expect(screen.getByText('200 / 200')).toBeDefined();

      expect((await sendAndReadPayload()).authorityReference).toBe('a'.repeat(200));
    });

    it('stops the authority at 200 characters and the document number at 500', () => {
      renderForm();
      expect((screen.getByLabelText(/Cơ quan ban hành/i) as HTMLInputElement).maxLength).toBe(200);
      expect((screen.getByLabelText(/Số văn bản/i) as HTMLInputElement).maxLength).toBe(500);
    });

    it('uses a new idempotency key after the authority or document number changes', async () => {
      vi.spyOn(api, 'getEmergencyImpact').mockResolvedValue(mockImpact);
      const cancelSpy = vi
        .spyOn(api, 'cancelBeforeDeparture')
        .mockRejectedValueOnce(new api.OperatorEmergencyApiError('Server error', 500))
        .mockRejectedValueOnce(new api.OperatorEmergencyApiError('Server error', 500))
        .mockResolvedValueOnce(cancelled);
      renderForm();
      typeDetails();

      submit();
      await confirm();
      await screen.findByText(/Server error/i);
      typeField(/Cơ quan ban hành/i, 'Da Nang People Committee');
      submit();
      await confirm();
      await waitFor(() => expect(cancelSpy).toHaveBeenCalledTimes(2));
      await screen.findByText(/Server error/i);
      typeField(/Số văn bản/i, '08/CD-PCTT');
      submit();
      await confirm();

      await waitFor(() => expect(cancelSpy).toHaveBeenCalledTimes(3));
      const keys = cancelSpy.mock.calls.map((call) => call[3]);
      expect(new Set(keys).size).toBe(3);
    });

    it.each([
      ['the issuing authority', /Cơ quan ban hành/i],
      ['the document number', /Số văn bản/i],
    ])('does not defer an authority directive that has %s', async (_name, label) => {
      renderForm();
      chooseReason('AuthorityDirective');
      typeDetails();
      typeField(label, 'Directive 08');

      expect((await sendAndReadPayload()).addEvidenceLater).toBe(false);
    });

    it('still defers an authority directive that only has a link', async () => {
      renderForm();
      chooseReason('AuthorityDirective');
      typeDetails();
      typeLink('https://danang.gov.vn/directive.pdf');

      expect(await sendAndReadPayload()).toMatchObject({
        evidenceUrl: 'https://danang.gov.vn/directive.pdf',
        addEvidenceLater: true,
      });
    });

    it('does not defer evidence for other reasons', async () => {
      renderForm();
      typeDetails();

      expect((await sendAndReadPayload()).addEvidenceLater).toBe(false);
    });

    it('tells the Operator that Travelers will read the reason', () => {
      renderForm();

      const reason = screen.getByLabelText(/Lý do hiển thị cho du khách/i);
      expect(document.getElementById(reason.getAttribute('aria-describedby') ?? '')?.textContent).toBe(
        'Du khách bị ảnh hưởng sẽ đọc nội dung này. Không ghi chú nội bộ hoặc thông tin riêng tư.'
      );
    });

    it('shows the decision fields first and keeps evidence collapsed', () => {
      renderForm();

      expect(screen.getByRole('combobox', { name: /Lý do hủy khẩn cấp/i })).toBeDefined();
      expect(screen.getByRole('textbox', { name: /Lý do hiển thị cho du khách/i })).toBeDefined();
      expect(screen.getByRole('textbox', { name: /Đầu mối liên hệ/i })).toBeDefined();

      const toggle = screen.getByRole('button', { name: 'Thêm bằng chứng (không bắt buộc)' });
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      expect(screen.queryByRole('textbox', { name: /Liên kết bằng chứng HTTPS/i })).toBeNull();
      expect(screen.queryByRole('textbox', { name: /Cơ quan ban hành/i })).toBeNull();
      expect(screen.queryByRole('textbox', { name: /Số văn bản/i })).toBeNull();
    });

    it('opens and closes the evidence section without losing what was entered', () => {
      renderForm();
      const toggle = screen.getByRole('button', { name: 'Thêm bằng chứng (không bắt buộc)' });

      fireEvent.click(toggle);
      expect(toggle.getAttribute('aria-expanded')).toBe('true');
      expect(document.getElementById(toggle.getAttribute('aria-controls') ?? '')).not.toBeNull();
      fireEvent.change(screen.getByRole('textbox', { name: /Cơ quan ban hành/i }), {
        target: { value: 'Da Nang People Committee' },
      });

      fireEvent.click(toggle);
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      expect(screen.queryByRole('textbox', { name: /Cơ quan ban hành/i })).toBeNull();

      fireEvent.click(toggle);
      expect(screen.getByDisplayValue('Da Nang People Committee')).toBeDefined();
    });

    it('opens evidence for an authority directive and explains it can be added later', () => {
      renderForm();
      expect(screen.queryByText(/bổ sung sau khi/i)).toBeNull();

      chooseReason('AuthorityDirective');

      expect(
        screen.getByRole('button', { name: 'Thêm bằng chứng (không bắt buộc)' }).getAttribute('aria-expanded')
      ).toBe('true');
      expect(screen.getByRole('textbox', { name: /Cơ quan ban hành/i })).toBeDefined();
      expect(screen.getByText(/bổ sung sau khi/i)).toBeDefined();
    });

    it('shows a link error even when the evidence section was collapsed', async () => {
      renderForm();
      const toggle = screen.getByRole('button', { name: 'Thêm bằng chứng (không bắt buộc)' });
      typeDetails();
      fireEvent.click(toggle);
      typeLink('http://danang.gov.vn/directive.pdf');
      fireEvent.click(toggle);

      submit();

      await waitFor(() => expect(toggle.getAttribute('aria-expanded')).toBe('true'));
      expect(screen.getByRole('alert').textContent).toMatch(/HTTPS/);
    });

    it('does not send twice while a decision is being sent', async () => {
      vi.spyOn(api, 'getEmergencyImpact').mockResolvedValue(mockImpact);
      const cancelSpy = vi
        .spyOn(api, 'cancelBeforeDeparture')
        .mockReturnValue(new Promise(() => undefined));
      renderForm();

      typeDetails();
      submit();
      await confirm();

      const sending = await screen.findByRole('button', { name: /Đang xử lý/i });
      expect((sending as HTMLButtonElement).disabled).toBe(true);
      fireEvent.click(sending);
      expect(cancelSpy).toHaveBeenCalledTimes(1);
    });
  });
  it('limits the emergency contact to what the Backend stores', () => {
    render(<CancelBeforeDepartureForm impact={mockImpact} onSuccess={vi.fn()} onCancel={vi.fn()} />);

    const contact = screen.getByLabelText(/Đầu mối liên hệ/i) as HTMLInputElement;
    expect(contact.maxLength).toBe(100);
    fireEvent.change(contact, { target: { value: '0905123456' } });
    expect(screen.getByText('10 / 100')).toBeDefined();
  });

});
