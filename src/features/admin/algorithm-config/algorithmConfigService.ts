import { CONFIG_MESSAGES, isAlgorithmConfig, type AlgorithmConfig, type AlgorithmParameters } from './algorithmConfig';

export class AlgorithmConfigError extends Error {
  constructor(public readonly status: number, public readonly errorCode?: string) {
    super(status === 400 || status === 422 ? CONFIG_MESSAGES.invalid : status === 403 ? CONFIG_MESSAGES.forbidden : CONFIG_MESSAGES.unavailable);
  }
}

// Same-origin server proxy. The access token stays in the HttpOnly admin
// session cookie; the browser sends credentials and never handles a token.
const PROXY_ROUTE = '/api/admin/system-configs/algorithm-parameters';

async function request(method: 'GET' | 'PUT', values?: AlgorithmParameters): Promise<AlgorithmConfig> {
  let response: Response;
  try {
    response = await fetch(PROXY_ROUTE, {
      method, cache: 'no-store', credentials: 'same-origin',
      headers: values ? { 'Content-Type': 'application/json' } : undefined,
      body: values ? JSON.stringify({ bufferTimeMinutes: values.bufferTimeMinutes, defaultTravelSpeedKmh: values.defaultTravelSpeedKmh, reroutingSearchRadiusKm: values.reroutingSearchRadiusKm, weatherAlertThresholdSeverity: values.weatherAlertThresholdSeverity }) : undefined,
    });
  } catch { throw new AlgorithmConfigError(0); }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const code = body && typeof body === 'object' && 'errorCode' in body && typeof body.errorCode === 'string' ? body.errorCode : undefined;
    throw new AlgorithmConfigError(response.status, code);
  }
  if (!isAlgorithmConfig(body)) throw new AlgorithmConfigError(0);
  return body;
}

export function getAlgorithmParameters() { return request('GET'); }
export function updateAlgorithmParameters(values: AlgorithmParameters) { return request('PUT', values); }
