import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  PoiManagementItem,
  PoiDeactivationReferences,
  DeactivatePoiResponse,
} from '../../types/poi-management';
import { poiManagementEn } from '../../resources/en';
import { DeactivatePoiDialog } from '../DeactivatePoiDialog';

const { loadPoiDeactivationReferencesMock, deactivatePoiMock } = vi.hoisted(() => ({
  loadPoiDeactivationReferencesMock: vi.fn(),
  deactivatePoiMock: vi.fn(),
}));

vi.mock('../../services/poi-management-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/poi-management-api')>();
  return {
    ...actual,
    loadPoiDeactivationReferences: loadPoiDeactivationReferencesMock,
    deactivatePoi: deactivatePoiMock,
  };
});

import { PoiManagementApiError } from '../../services/poi-management-api';

const samplePoi: PoiManagementItem = {
  id: '9007199254740993',
  name: 'Marble Mountains',
  categoryId: 7,
  categoryName: 'Attraction',
  address: 'Da Nang',
  latitude: 16.003,
  longitude: 108.264,
  status: 'Active',
  openingHours: [],
};

const sampleReferencesWithImpact: PoiDeactivationReferences = {
  poiId: 9007199254740993,
  poiName: 'Marble Mountains',
  status: 'Active',
  activeItinerariesCount: 2,
  activeRoutesCount: 3,
  openCommercialBookingsCount: 1,
  hasActiveReferences: true,
  referenceSnapshotToken: 'token_abc123',
  messageCode: 'MSG194',
  message: poiManagementEn.msg194,
};

const sampleReferencesClean: PoiDeactivationReferences = {
  poiId: 9007199254740993,
  poiName: 'Marble Mountains',
  status: 'Active',
  activeItinerariesCount: 0,
  activeRoutesCount: 0,
  openCommercialBookingsCount: 0,
  hasActiveReferences: false,
  referenceSnapshotToken: 'token_clean000',
  messageCode: null,
  message: null,
};

describe('DeactivatePoiDialog (TM-100 / SRS §3.9.3.3 / Fig. 83)', () => {
  const onClose = vi.fn();
  const onSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <DeactivatePoiDialog
        isOpen={false}
        poi={samplePoi}
        onClose={onClose}
        onSuccess={onSuccess}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('fetches references on open and displays loading state then counts', async () => {
    loadPoiDeactivationReferencesMock.mockResolvedValueOnce(sampleReferencesWithImpact);

    render(
      <DeactivatePoiDialog
        isOpen={true}
        poi={samplePoi}
        onClose={onClose}
        onSuccess={onSuccess}
      />,
    );

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText(/Marble Mountains/)).toBeTruthy();

    await waitFor(() => {
      expect(loadPoiDeactivationReferencesMock).toHaveBeenCalledWith('9007199254740993');
    });

    // Verify reference counts displayed
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.getByText(poiManagementEn.activeItinerariesLabel)).toBeTruthy();
    expect(screen.getByText(poiManagementEn.activeRoutesLabel)).toBeTruthy();
    expect(screen.getByText(poiManagementEn.openBookingsLabel)).toBeTruthy();

    // Verify MSG194 impact notice is shown
    expect(screen.getByText(poiManagementEn.msg194)).toBeTruthy();
  });

  it('shows clean references message when counts are zero', async () => {
    loadPoiDeactivationReferencesMock.mockResolvedValueOnce(sampleReferencesClean);

    render(
      <DeactivatePoiDialog
        isOpen={true}
        poi={samplePoi}
        onClose={onClose}
        onSuccess={onSuccess}
      />,
    );

    await waitFor(() => {
      expect(loadPoiDeactivationReferencesMock).toHaveBeenCalled();
    });

    expect(screen.getByText(poiManagementEn.noReferencesNotice)).toBeTruthy();
    expect(screen.queryByText(poiManagementEn.msg194)).toBeNull();
  });

  it('requires reason before deactivation can be submitted', async () => {
    loadPoiDeactivationReferencesMock.mockResolvedValueOnce(sampleReferencesClean);

    render(
      <DeactivatePoiDialog
        isOpen={true}
        poi={samplePoi}
        onClose={onClose}
        onSuccess={onSuccess}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: poiManagementEn.confirmDeactivate })).toBeTruthy();
    });

    const confirmBtn = screen.getByRole('button', { name: poiManagementEn.confirmDeactivate });
    expect((confirmBtn as HTMLButtonElement).disabled).toBe(true);

    const textarea = screen.getByPlaceholderText(poiManagementEn.reasonPlaceholder);
    fireEvent.change(textarea, { target: { value: '   ' } });
    expect((confirmBtn as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(textarea, { target: { value: 'Temporary maintenance until next month' } });
    expect((confirmBtn as HTMLButtonElement).disabled).toBe(false);
  });

  it('calls deactivatePoi and calls onSuccess with MSG193 on success', async () => {
    loadPoiDeactivationReferencesMock.mockResolvedValueOnce(sampleReferencesWithImpact);
    const mockSuccessResponse: DeactivatePoiResponse = {
      poiId: 9007199254740993,
      status: 'Inactive',
      deactivatedAtUtc: '2026-11-19T01:00:00Z',
      deactivatedConnectingRoutesCount: 3,
      messageCode: 'MSG193',
      message: poiManagementEn.msg193,
    };
    deactivatePoiMock.mockResolvedValueOnce(mockSuccessResponse);

    render(
      <DeactivatePoiDialog
        isOpen={true}
        poi={samplePoi}
        onClose={onClose}
        onSuccess={onSuccess}
      />,
    );

    await waitFor(() => {
      expect(loadPoiDeactivationReferencesMock).toHaveBeenCalled();
    });

    const textarea = screen.getByPlaceholderText(poiManagementEn.reasonPlaceholder);
    fireEvent.change(textarea, { target: { value: 'Site reconstruction' } });

    const confirmBtn = screen.getByRole('button', { name: poiManagementEn.confirmDeactivate });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(deactivatePoiMock).toHaveBeenCalledWith({
        poiId: 9007199254740993,
        reason: 'Site reconstruction',
        referenceSnapshotToken: 'token_abc123',
      });
    });

    expect(onSuccess).toHaveBeenCalledWith(poiManagementEn.msg193);
    expect(onClose).toHaveBeenCalled();
  });

  it('handles 409 Conflict (concurrency 6.a2) by refreshing references and alerting user', async () => {
    loadPoiDeactivationReferencesMock.mockResolvedValueOnce(sampleReferencesClean);

    const conflictError = new PoiManagementApiError(
      409,
      'POI_MANAGEMENT_INVALID_QUERY',
    );
    deactivatePoiMock.mockRejectedValueOnce(conflictError);

    // Second fetch returns updated references
    const updatedReferences: PoiDeactivationReferences = {
      poiId: 9007199254740993,
      poiName: 'Marble Mountains',
      status: 'Active',
      activeItinerariesCount: 5,
      activeRoutesCount: 1,
      openCommercialBookingsCount: 0,
      hasActiveReferences: true,
      referenceSnapshotToken: 'token_updated_999',
      messageCode: 'MSG194',
      message: poiManagementEn.msg194,
    };
    loadPoiDeactivationReferencesMock.mockResolvedValueOnce(updatedReferences);

    render(
      <DeactivatePoiDialog
        isOpen={true}
        poi={samplePoi}
        onClose={onClose}
        onSuccess={onSuccess}
      />,
    );

    await waitFor(() => {
      expect(loadPoiDeactivationReferencesMock).toHaveBeenCalledTimes(1);
    });

    const textarea = screen.getByPlaceholderText(poiManagementEn.reasonPlaceholder);
    fireEvent.change(textarea, { target: { value: 'Site reconstruction' } });

    const confirmBtn = screen.getByRole('button', { name: poiManagementEn.confirmDeactivate });
    fireEvent.click(confirmBtn);

    // Dialog should catch 409, show conflict alert, and refetch references
    await waitFor(() => {
      expect(loadPoiDeactivationReferencesMock).toHaveBeenCalledTimes(2);
    });

    expect(screen.getByText(poiManagementEn.concurrencyNotice)).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('handles 403 Forbidden with MSG126', async () => {
    loadPoiDeactivationReferencesMock.mockResolvedValueOnce(sampleReferencesClean);
    const forbiddenError = new PoiManagementApiError(403, 'POI_MANAGEMENT_ACCESS_REQUIRED');
    deactivatePoiMock.mockRejectedValueOnce(forbiddenError);

    render(
      <DeactivatePoiDialog
        isOpen={true}
        poi={samplePoi}
        onClose={onClose}
        onSuccess={onSuccess}
      />,
    );

    await waitFor(() => {
      expect(loadPoiDeactivationReferencesMock).toHaveBeenCalled();
    });

    const textarea = screen.getByPlaceholderText(poiManagementEn.reasonPlaceholder);
    fireEvent.change(textarea, { target: { value: 'Site reconstruction' } });

    const confirmBtn = screen.getByRole('button', { name: poiManagementEn.confirmDeactivate });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.getByText(poiManagementEn.msg126)).toBeTruthy();
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('closes when Cancel button is clicked', async () => {
    loadPoiDeactivationReferencesMock.mockResolvedValueOnce(sampleReferencesClean);

    render(
      <DeactivatePoiDialog
        isOpen={true}
        poi={samplePoi}
        onClose={onClose}
        onSuccess={onSuccess}
      />,
    );

    const cancelBtn = screen.getByRole('button', { name: poiManagementEn.cancel });
    fireEvent.click(cancelBtn);

    expect(onClose).toHaveBeenCalled();
    expect(deactivatePoiMock).not.toHaveBeenCalled();
  });
});
