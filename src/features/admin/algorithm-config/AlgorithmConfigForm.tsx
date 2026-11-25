'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { PageHeader } from '@/components/layout/PageHeader';
import { ActionButton } from '@/components/ui/ActionButton';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { fieldClassName, TextField } from '@/components/ui/FormControls';
import {
  CONFIG_MESSAGES,
  WEATHER_SEVERITIES,
  validateParameters,
  type AlgorithmConfig,
  type AlgorithmParameters,
} from './algorithmConfig';
import {
  AlgorithmConfigError,
  getAlgorithmParameters,
  updateAlgorithmParameters,
} from './algorithmConfigService';

const ROUTE = '/admin/settings/algorithm-parameters';
type EditableValues = Record<keyof AlgorithmParameters, string>;
type ViewState = 'loading' | 'ready' | 'load-error' | 'forbidden';

function toEditable(config: AlgorithmConfig): EditableValues {
  return {
    bufferTimeMinutes: String(config.bufferTimeMinutes),
    defaultTravelSpeedKmh: String(config.defaultTravelSpeedKmh),
    reroutingSearchRadiusKm: String(config.reroutingSearchRadiusKm),
    weatherAlertThresholdSeverity: config.weatherAlertThresholdSeverity,
  };
}

export function AlgorithmConfigForm() {
  const router = useRouter();
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [savedConfig, setSavedConfig] = useState<AlgorithmConfig | null>(null);
  const [values, setValues] = useState<EditableValues | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof AlgorithmParameters, string>>>({});
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;
    getAlgorithmParameters()
      .then((config) => {
        if (!isMounted) return;
        setSavedConfig(config);
        setValues(toEditable(config));
        setErrors({});
        setViewState('ready');
      })
      .catch((error) => {
        if (!isMounted) return;
        if (error instanceof AlgorithmConfigError && error.status === 401) {
          router.replace(`/admin/login?returnUrl=${encodeURIComponent(ROUTE)}`);
          return;
        }
        if (error instanceof AlgorithmConfigError && error.status === 403) {
          setViewState('forbidden');
          return;
        }
        setLoadErrorMessage(error instanceof AlgorithmConfigError ? (error.serverMessage ?? null) : null);
        setViewState('load-error');
      });
    return () => {
      isMounted = false;
    };
  }, [refreshKey, router]);

  const handleRetry = () => {
    setLoadErrorMessage(null);
    setViewState('loading');
    setRefreshKey((k) => k + 1);
  };

  const setValue = (key: keyof EditableValues, value: string) => {
    setValues((current) => current ? { ...current, [key]: value } : current);
    setErrors((current) => ({ ...current, [key]: undefined }));
    setFeedback(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!values || saving) return;
    const candidate: AlgorithmParameters = {
      bufferTimeMinutes: Number(values.bufferTimeMinutes),
      defaultTravelSpeedKmh: Number(values.defaultTravelSpeedKmh),
      reroutingSearchRadiusKm: Number(values.reroutingSearchRadiusKm),
      weatherAlertThresholdSeverity: values.weatherAlertThresholdSeverity,
    };
    const nextErrors = validateParameters(candidate);
    if (!values.bufferTimeMinutes.trim()) nextErrors.bufferTimeMinutes = CONFIG_MESSAGES.invalid;
    if (!values.defaultTravelSpeedKmh.trim()) nextErrors.defaultTravelSpeedKmh = CONFIG_MESSAGES.invalid;
    if (!values.reroutingSearchRadiusKm.trim()) nextErrors.reroutingSearchRadiusKm = CONFIG_MESSAGES.invalid;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    setFeedback(null);
    try {
      const updated = await updateAlgorithmParameters(candidate);
      setSavedConfig(updated);
      setValues(toEditable(updated));
      setFeedback({ tone: 'success', message: CONFIG_MESSAGES.success });
    } catch (error) {
      if (error instanceof AlgorithmConfigError && error.status === 401) {
        router.replace(`/admin/login?returnUrl=${encodeURIComponent(ROUTE)}`);
        return;
      }
      if (error instanceof AlgorithmConfigError && error.status === 403) {
        setViewState('forbidden');
        return;
      }
      setFeedback({
        tone: 'error',
        message: error instanceof AlgorithmConfigError
          ? (error.serverMessage ?? ([400, 422].includes(error.status) ? CONFIG_MESSAGES.invalid : CONFIG_MESSAGES.unavailable))
          : CONFIG_MESSAGES.unavailable,
      });
    } finally {
      setSaving(false);
    }
  };

  if (viewState === 'forbidden') {
    return (
      <div className="mx-auto max-w-4xl p-4 md:p-8">
        <FeedbackAlert tone="error" title="Permission Denied">
          {CONFIG_MESSAGES.forbidden}
        </FeedbackAlert>
      </div>
    );
  }
  if (viewState === 'loading') {
    return (
      <div className="mx-auto max-w-4xl p-8 text-center text-sm text-[#5B6E69]" role="status">
        Loading algorithm parameters…
      </div>
    );
  }
  if (viewState === 'load-error' || !values) {
    return (
      <div className="mx-auto max-w-4xl p-4 md:p-8">
        <FeedbackAlert tone="error" title="Unable to Load Algorithm Parameters">
          <div className="flex flex-wrap items-center gap-3">
            <span>{loadErrorMessage ?? CONFIG_MESSAGES.unavailable}</span>
            <ActionButton type="button" variant="outline" onClick={handleRetry}>
              Retry
            </ActionButton>
          </div>
        </FeedbackAlert>
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl p-4 md:p-6">
      <PageHeader
        className="mb-6"
        eyebrow="Administrator Settings"
        title="Algorithm Parameters"
        description="Store the four approved algorithm configuration values. This screen manages saved configuration only: the scheduling, rerouting, and weather services do not consume these values yet, so changes do not affect algorithm behavior until that integration is delivered."
      />

      <form onSubmit={handleSubmit} className="rounded-2xl border border-[#DCE2DD] bg-white p-5 shadow-xs md:p-6" noValidate>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <TextField aria-label="Buffer Time Between Stops (minutes)" label="Buffer Time Between Stops (minutes)" type="number" min={5} max={60} step={1} value={values.bufferTimeMinutes} disabled={saving} error={errors.bufferTimeMinutes} help="Allowed range: 5–60 minutes." onChange={(event) => setValue('bufferTimeMinutes', event.target.value)} />
          <TextField aria-label="Default Motorbike Travel Speed (km/h)" label="Default Motorbike Travel Speed (km/h)" type="number" min={10} max={120} step="any" value={values.defaultTravelSpeedKmh} disabled={saving} error={errors.defaultTravelSpeedKmh} help="Allowed range: 10–120 km/h." onChange={(event) => setValue('defaultTravelSpeedKmh', event.target.value)} />
          <TextField aria-label="Rerouting Search Radius (km)" label="Rerouting Search Radius (km)" type="number" min={1} max={50} step="any" value={values.reroutingSearchRadiusKm} disabled={saving} error={errors.reroutingSearchRadiusKm} help="Allowed range: 1–50 km." onChange={(event) => setValue('reroutingSearchRadiusKm', event.target.value)} />
          <div className="mb-1.5">
            <label htmlFor="weather-threshold-select" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Weather Alert Threshold
            </label>
            <div className="relative mt-1.5">
              <select
                id="weather-threshold-select"
                aria-label="Weather Alert Threshold"
                aria-invalid={Boolean(errors.weatherAlertThresholdSeverity)}
                aria-describedby={errors.weatherAlertThresholdSeverity ? 'weather-error' : 'weather-help'}
                className={`${fieldClassName} cursor-pointer ${errors.weatherAlertThresholdSeverity ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500/30' : ''}`}
                value={values.weatherAlertThresholdSeverity}
                disabled={saving}
                onChange={(event) => setValue('weatherAlertThresholdSeverity', event.target.value)}
              >
                {WEATHER_SEVERITIES.map((severity) => <option key={severity}>{severity}</option>)}
              </select>
            </div>
            <span id="weather-help" className="mt-1.5 flex items-center gap-1 text-[11px] leading-snug text-brand-textSecondary">
              <span className="material-symbols-outlined text-[14px] text-brand-teal" aria-hidden="true">info</span>
              Minimum severity that triggers weather handling.
            </span>
            {errors.weatherAlertThresholdSeverity ? (
              <span id="weather-error" role="alert" className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-red-600">
                <span aria-hidden="true">⚠</span> {errors.weatherAlertThresholdSeverity}
              </span>
            ) : null}
          </div>
        </div>

        {savedConfig?.updatedAtLocal ? <p className="mt-5 text-xs text-[#5B6E69]">Last updated (UTC+7): <span className="font-semibold text-[#5B6E69]">{savedConfig.updatedAtLocal}</span></p> : null}
        {feedback ? <div className="mt-5"><FeedbackAlert tone={feedback.tone}>{feedback.message}</FeedbackAlert></div> : null}

        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-[#DCE2DD] pt-5 sm:flex-row sm:justify-end">
          <ActionButton type="button" variant="outline" disabled={saving} onClick={() => { if (savedConfig) setValues(toEditable(savedConfig)); setErrors({}); setFeedback(null); }}>Cancel Changes</ActionButton>
          <ActionButton type="submit" loading={saving}>Save Configuration</ActionButton>
        </div>
      </form>
    </main>
  );
}
