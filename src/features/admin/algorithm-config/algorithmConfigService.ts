import { AuthStorage } from '@/features/auth/session/authSession';
import { API_BASE } from '@/lib/authApi';
import { CONFIG_MESSAGES, isAlgorithmConfig, type AlgorithmConfig, type AlgorithmParameters } from './algorithmConfig';
export class AlgorithmConfigError extends Error {
  constructor(public readonly status: number, public readonly errorCode?: string) {
    super(status === 400 || status === 422 ? CONFIG_MESSAGES.invalid : status === 403 ? CONFIG_MESSAGES.forbidden : CONFIG_MESSAGES.unavailable);
  }
}
async function request(method: 'GET' | 'PUT', values?: AlgorithmParameters): Promise<AlgorithmConfig> {
  const token = AuthStorage.getAccessToken();
  if (!token) throw new AlgorithmConfigError(401);
  let response: Response;
  try {
    response = await fetch(`${API_BASE.replace(/\/$/, '')}/admin/system-configs/algorithm-parameters`, {
      method, cache: 'no-store', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: values ? JSON.stringify({ bufferTimeMinutes: values.bufferTimeMinutes, defaultTravelSpeedKmh: values.defaultTravelSpeedKmh, reroutingSearchRadiusKm: values.reroutingSearchRadiusKm, weatherAlertThresholdSeverity: values.weatherAlertThresholdSeverity }) : undefined,
    });
  } catch { throw new AlgorithmConfigError(0); }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) AuthStorage.clear();
    const code = body && typeof body === 'object' && 'errorCode' in body && typeof body.errorCode === 'string' ? body.errorCode : undefined;
    throw new AlgorithmConfigError(response.status, code);
  }
  if (!isAlgorithmConfig(body)) throw new AlgorithmConfigError(0);
  return body;
}
export function getAlgorithmParameters() { return request('GET'); }
export function updateAlgorithmParameters(values: AlgorithmParameters) { return request('PUT', values); }

