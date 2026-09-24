import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AlgorithmConfigForm } from './AlgorithmConfigForm';
import { CONFIG_MESSAGES } from './algorithmConfig';
import * as service from './algorithmConfigService';

const { router } = vi.hoisted(() => ({
  router: { replace: vi.fn() },
}));

vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('./algorithmConfigService', async (importOriginal) => ({
  ...await importOriginal<typeof service>(),
  getAlgorithmParameters: vi.fn(),
  updateAlgorithmParameters: vi.fn(),
}));

const loaded = {
  bufferTimeMinutes: 15,
  defaultTravelSpeedKmh: 30,
  reroutingSearchRadiusKm: 5,
  weatherAlertThresholdSeverity: 'Severe',
  updatedAtUtc: '2026-09-21T02:00:00Z',
  updatedAtLocal: '21/09/2026 09:00:00',
};

describe('AlgorithmConfigForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(service.getAlgorithmParameters).mockResolvedValue(loaded);
  });

  it('loads and displays the four approved values', async () => {
    render(<AlgorithmConfigForm />);
    expect(await screen.findByDisplayValue('15')).toBeDefined();
    expect(screen.getByDisplayValue('30')).toBeDefined();
    expect(screen.getByDisplayValue('5')).toBeDefined();
    expect(screen.getByDisplayValue('Severe')).toBeDefined();
    expect(screen.getByText('21/09/2026 09:00:00')).toBeDefined();
  });

  it('blocks invalid values locally and marks the offending field', async () => {
    render(<AlgorithmConfigForm />);
    const buffer = await screen.findByLabelText('Buffer Time Between Stops (minutes)');
    fireEvent.change(buffer, { target: { value: '4' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Configuration' }));
    expect(service.updateAlgorithmParameters).not.toHaveBeenCalled();
    expect(buffer.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getAllByText(CONFIG_MESSAGES.invalid).length).toBeGreaterThan(0);
  });

  it('saves only valid values and shows MSG117', async () => {
    vi.mocked(service.updateAlgorithmParameters).mockResolvedValue({ ...loaded, bufferTimeMinutes: 20 });
    render(<AlgorithmConfigForm />);
    fireEvent.change(await screen.findByLabelText('Buffer Time Between Stops (minutes)'), { target: { value: '20' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Configuration' }));
    await waitFor(() => expect(service.updateAlgorithmParameters).toHaveBeenCalledWith({
      bufferTimeMinutes: 20,
      defaultTravelSpeedKmh: 30,
      reroutingSearchRadiusKm: 5,
      weatherAlertThresholdSeverity: 'Severe',
    }));
    expect(await screen.findByText(CONFIG_MESSAGES.success)).toBeDefined();
  });

  it('preserves edited input after a failed save and cancel restores the last loaded value', async () => {
    vi.mocked(service.updateAlgorithmParameters).mockRejectedValue(new service.AlgorithmConfigError(500));
    render(<AlgorithmConfigForm />);
    const speed = await screen.findByLabelText('Default Motorbike Travel Speed (km/h)');
    fireEvent.change(speed, { target: { value: '45' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Configuration' }));
    expect(await screen.findByText(CONFIG_MESSAGES.unavailable)).toBeDefined();
    expect((speed as HTMLInputElement).value).toBe('45');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel Changes' }));
    expect((speed as HTMLInputElement).value).toBe('30');
  });

  it('offers retry after load failure', async () => {
    vi.mocked(service.getAlgorithmParameters)
      .mockRejectedValueOnce(new service.AlgorithmConfigError(500))
      .mockResolvedValueOnce(loaded);
    render(<AlgorithmConfigForm />);
    fireEvent.click(await screen.findByRole('button', { name: 'Retry' }));
    expect(await screen.findByDisplayValue('15')).toBeDefined();
    expect(service.getAlgorithmParameters).toHaveBeenCalledTimes(2);
  });

  it('redirects to login when the API rejects an expired session (401)', async () => {
    vi.mocked(service.getAlgorithmParameters).mockRejectedValue(new service.AlgorithmConfigError(401));
    render(<AlgorithmConfigForm />);
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/admin/login?returnUrl=%2Fadmin%2Fsettings%2Falgorithm-parameters'));
  });

  it('shows MSG126 when the API denies permission (403)', async () => {
    vi.mocked(service.getAlgorithmParameters).mockRejectedValue(new service.AlgorithmConfigError(403, 'admin.algorithm_config_forbidden'));
    render(<AlgorithmConfigForm />);
    expect(await screen.findByText(CONFIG_MESSAGES.forbidden)).toBeDefined();
  });
});

