import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EmergencyEvidenceEditor } from '../EmergencyEvidenceEditor';
import * as api from '../../operatorEmergencyApi';

const emptyEvidence = {
  operationId: 100,
  evidenceUrl: null,
  authorityReference: null,
  evidenceReference: null,
  evidenceProvenance: 'None',
  evidenceAddedLater: false,
  evidenceVersion: 'version-empty',
};

const existingEvidence = {
  ...emptyEvidence,
  evidenceUrl: 'https://example.com/doc.pdf',
  authorityReference: 'Ban Chỉ huy PCTT',
  evidenceProvenance: 'OperatorProvided',
  evidenceVersion: 'version-existing',
};

const saved = {
  operationId: 100,
  evidenceProvenance: 'OperatorProvided',
  evidenceAddedLater: true,
  updatedAtUtc: '2026-11-03T11:00:00Z',
};

describe('EmergencyEvidenceEditor', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('reads the current evidence and sends its version when saving', async () => {
    vi.spyOn(api, 'getEmergencyEvidence').mockResolvedValue(emptyEvidence);
    const evidenceSpy = vi.spyOn(api, 'addEmergencyEvidence').mockResolvedValueOnce(saved);
    const onSuccess = vi.fn();

    render(<EmergencyEvidenceEditor tourId={200} scheduleId={50} onSuccess={onSuccess} />);

    const submitBtn = await screen.findByRole('button', { name: /Lưu bằng chứng/i });
    await waitFor(() => expect((submitBtn as HTMLButtonElement).disabled).toBe(false));
    fireEvent.change(screen.getByLabelText(/Liên kết văn bản /i), {
      target: { value: 'https://ubnd.danang.gov.vn/cong-dien-khan-123.pdf' },
    });
    fireEvent.change(screen.getByLabelText(/Cơ quan ban hành /i), {
      target: { value: 'UBND TP Đà Nẵng' },
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(evidenceSpy).toHaveBeenCalledWith(
        200,
        50,
        expect.objectContaining({
          evidenceUrl: 'https://ubnd.danang.gov.vn/cong-dien-khan-123.pdf',
          authorityReference: 'UBND TP Đà Nẵng',
          expectedVersion: 'version-empty',
        })
      );
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('keeps fields the Operator did not edit', async () => {
    vi.spyOn(api, 'getEmergencyEvidence').mockResolvedValue(existingEvidence);
    const evidenceSpy = vi.spyOn(api, 'addEmergencyEvidence').mockResolvedValueOnce(saved);

    render(<EmergencyEvidenceEditor tourId={200} scheduleId={50} onSuccess={vi.fn()} />);

    const authInput = (await screen.findByDisplayValue('Ban Chỉ huy PCTT')) as HTMLInputElement;
    fireEvent.change(authInput, { target: { value: 'UBND TP Huế' } });
    fireEvent.click(screen.getByRole('button', { name: /Lưu bằng chứng/i }));

    await waitFor(() => {
      expect(evidenceSpy).toHaveBeenCalledWith(200, 50, {
        evidenceUrl: 'https://example.com/doc.pdf',
        authorityReference: 'UBND TP Huế',
        evidenceReference: null,
        expectedVersion: 'version-existing',
      });
    });
  });

  it('refuses to save until the current evidence has been read', async () => {
    vi.spyOn(api, 'getEmergencyEvidence').mockRejectedValue(new Error('offline'));
    const evidenceSpy = vi.spyOn(api, 'addEmergencyEvidence');

    render(<EmergencyEvidenceEditor tourId={200} scheduleId={50} onSuccess={vi.fn()} />);

    expect(await screen.findByText(/Không thể tải bằng chứng hiện tại/i)).toBeDefined();
    const submitBtn = screen.getByRole('button', { name: /Lưu bằng chứng/i }) as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);
    fireEvent.click(submitBtn);
    expect(evidenceSpy).not.toHaveBeenCalled();
  });

  it('reloads the latest evidence when the Backend reports it changed', async () => {
    const readSpy = vi
      .spyOn(api, 'getEmergencyEvidence')
      .mockResolvedValueOnce(existingEvidence)
      .mockResolvedValueOnce({
        ...existingEvidence,
        authorityReference: 'Cơ quan mới',
        evidenceVersion: 'version-newer',
      });
    vi.spyOn(api, 'addEmergencyEvidence').mockRejectedValueOnce(
      new api.OperatorEmergencyApiError('Stale', 409, 'tour_schedule.emergency_evidence_stale')
    );

    render(<EmergencyEvidenceEditor tourId={200} scheduleId={50} onSuccess={vi.fn()} />);

    await screen.findByDisplayValue('Ban Chỉ huy PCTT');
    fireEvent.click(screen.getByRole('button', { name: /Lưu bằng chứng/i }));

    expect(await screen.findByDisplayValue('Cơ quan mới')).toBeDefined();
    expect(readSpy).toHaveBeenCalledTimes(2);
    expect(screen.getByText(/Bằng chứng vừa được thay đổi/i)).toBeDefined();
  });

  it('rejects non-HTTPS URL with validation error', async () => {
    vi.spyOn(api, 'getEmergencyEvidence').mockResolvedValue(emptyEvidence);

    render(<EmergencyEvidenceEditor tourId={200} scheduleId={50} onSuccess={vi.fn()} />);

    const submitBtn = await screen.findByRole('button', { name: /Lưu bằng chứng/i });
    await waitFor(() => expect((submitBtn as HTMLButtonElement).disabled).toBe(false));
    fireEvent.change(screen.getByLabelText(/Liên kết văn bản /i), {
      target: { value: 'http://insecure-site.com/doc.pdf' },
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Liên kết bằng chứng bắt buộc phải là HTTPS/i)).toBeDefined();
    });
  });

  it('shows when evidence was marked to be added later', async () => {
    vi.spyOn(api, 'getEmergencyEvidence').mockResolvedValue({ ...emptyEvidence, evidenceAddedLater: true });

    render(<EmergencyEvidenceEditor tourId={200} scheduleId={50} onSuccess={vi.fn()} />);

    expect(await screen.findByText(/đánh dấu bổ sung bằng chứng sau/i)).toBeDefined();
  });

  it('shows no reminder when evidence is not owed', async () => {
    vi.spyOn(api, 'getEmergencyEvidence').mockResolvedValue(existingEvidence);

    render(<EmergencyEvidenceEditor tourId={200} scheduleId={50} onSuccess={vi.fn()} />);

    await screen.findByDisplayValue('Ban Chỉ huy PCTT');
    expect(screen.queryByText(/đánh dấu bổ sung bằng chứng sau/i)).toBeNull();
  });

  it('limits the authority to the 200 characters the Backend accepts and counts them', async () => {
    vi.spyOn(api, 'getEmergencyEvidence').mockResolvedValue(emptyEvidence);

    render(<EmergencyEvidenceEditor tourId={200} scheduleId={50} onSuccess={vi.fn()} />);

    const authority = (await screen.findByLabelText(/Cơ quan ban hành /i)) as HTMLInputElement;
    expect(authority.maxLength).toBe(200);
    expect(screen.getByText('0 / 200')).toBeDefined();

    fireEvent.change(authority, { target: { value: 'a'.repeat(148) } });
    expect(screen.getByText('148 / 200')).toBeDefined();
  });

  it('withdraws with the version it read', async () => {
    vi.spyOn(api, 'getEmergencyEvidence').mockResolvedValue(existingEvidence);
    const evidenceSpy = vi.spyOn(api, 'addEmergencyEvidence').mockResolvedValueOnce({
      ...saved,
      evidenceProvenance: 'Withdrawn',
    });
    const onSuccess = vi.fn();

    render(<EmergencyEvidenceEditor tourId={200} scheduleId={50} onSuccess={onSuccess} />);

    expect(await screen.findByText(/Đơn vị điều hành cung cấp/i)).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /Rút lại bằng chứng/i }));

    await waitFor(() => {
      expect(evidenceSpy).toHaveBeenCalledWith(200, 50, {
        withdrawEvidence: true,
        expectedVersion: 'version-existing',
      });
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
