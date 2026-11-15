'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ActionButton } from '@/components/ui/ActionButton';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { fieldClassName, TextField } from '@/components/ui/FormControls';
import { createRoute, loadRouteOptions, RouteApiError, routeMessages, transportLabels, validateRoute } from '../services/route-api';
import type { CreateRouteInput, RouteFieldErrors, RouteOptions, RouteTransportMode } from '../services/route-api';
import { rememberRouteCreation } from '../services/route-creation-feedback';
import { RouteMapPreview } from './RouteMapPreview';

export function CreateRouteView() {
  const router = useRouter();
  const [options, setOptions] = useState<RouteOptions | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [draft, setDraft] = useState<CreateRouteInput>({ fromPoiId: null, toPoiId: null, distanceKm: null, estimatedDurationMinutes: null, transportMode: '', routeNote: null });
  const [errors, setErrors] = useState<RouteFieldErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const submitting = useRef(false);
  const mounted = useRef(false);
  const operation = useRef<{ payload: string; key: string } | null>(null);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadRouteOptions(controller.signal).then(value => { if (!controller.signal.aborted) { setOptions(value); setLoadError(null); } }, error => {
      if (!controller.signal.aborted) setLoadError(error instanceof RouteApiError ? error.message : routeMessages.MSG127);
    });
    return () => controller.abort();
  }, [reload]);

  function change<K extends keyof CreateRouteInput>(field: K, value: CreateRouteInput[K]) {
    setDraft(current => ({ ...current, [field]: value }));
    setErrors(current => ({ ...current, [field]: undefined }));
    setSaveError(null);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || !options || options.pois.length < 2 || forbidden) return;
    const input = { ...draft, routeNote: draft.routeNote?.trim() || null };
    const fieldErrors = validateRoute(input);
    const activeIds = new Set(options.pois.map(poi => poi.id));
    if (input.fromPoiId && !activeIds.has(input.fromPoiId)) fieldErrors.fromPoiId = routeMessages.MSG141;
    if (input.toPoiId && !activeIds.has(input.toPoiId)) fieldErrors.toPoiId = routeMessages.MSG141;
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length) { requestAnimationFrame(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()); return; }
    const payload = JSON.stringify(input);
    if (!operation.current || operation.current.payload !== payload) operation.current = { payload, key: crypto.randomUUID() };
    submitting.current = true;
    setBusy(true);
    setSaveError(null);
    try {
      await createRoute(input, operation.current.key);
      if (!mounted.current) return;
      const confirmation = rememberRouteCreation();
      router.push(`/admin/routes?confirmation=${confirmation}`);
      router.refresh();
    } catch (error) {
      if (!mounted.current) return;
      const apiError = error instanceof RouteApiError ? error : new RouteApiError(0, routeMessages.MSG127);
      setSaveError(apiError.message);
      if (apiError.status === 401 || apiError.status === 403) setForbidden(true);
      const serverErrors: RouteFieldErrors = {};
      for (const [field, messages] of Object.entries(apiError.errors)) {
        const key = field.charAt(0).toLowerCase() + field.slice(1);
        if (key in draft && messages[0]) serverErrors[key as keyof CreateRouteInput] = messages[0];
      }
      if (apiError.errorCode === 'MSG141' && !Object.keys(serverErrors).length) serverErrors.toPoiId = routeMessages.MSG141;
      if (apiError.errorCode === 'MSG143' && !Object.keys(serverErrors).length) { serverErrors.distanceKm = routeMessages.MSG143; serverErrors.estimatedDurationMinutes = routeMessages.MSG143; }
      setErrors(serverErrors);
      requestAnimationFrame(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
    } finally { submitting.current = false; if (mounted.current) setBusy(false); }
  }

  const from = options?.pois.find(poi => poi.id === draft.fromPoiId);
  const to = options?.pois.find(poi => poi.id === draft.toPoiId);
  const select = (field: 'fromPoiId' | 'toPoiId', label: string) => (
    <div>
      <label htmlFor={field} className="mb-2 block text-sm font-semibold">{label}</label>
      <select id={field} className={fieldClassName} value={draft[field] ?? ''} onChange={event => change(field, event.target.value ? Number(event.target.value) : null)} aria-invalid={Boolean(errors[field])} aria-describedby={errors[field] ? `${field}-error` : undefined} required>
        <option value="">Select an Active point of interest</option>
        {options?.pois.map(poi => <option key={poi.id} value={poi.id}>{poi.name}</option>)}
      </select>
      {errors[field] && <p id={`${field}-error`} role="alert" className="mt-1 text-sm text-error">{errors[field]}</p>}
    </div>
  );

  return <main className="mx-auto max-w-6xl space-y-6 pb-12 text-text-primary">
    <header className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
      <Link href="/admin/routes" className="text-sm text-text-secondary underline focus-visible:outline-2 focus-visible:outline-offset-4">Back to Routes List</Link>
      <h1 className="mt-3 text-2xl font-bold">Create Route</h1>
      <p className="mt-2 text-sm text-text-secondary">Connect two Active points of interest for itinerary planning and navigation.</p>
    </header>
    {loadError ? <div className="space-y-3"><FeedbackAlert tone="error">{loadError}</FeedbackAlert><ActionButton variant="outline" onClick={() => { setLoadError(null); setReload(value => value + 1); }}>Retry loading</ActionButton></div>
      : !options ? <p role="status">Loading Active points of interest…</p>
      : <>
        {options.pois.length < 2 && <FeedbackAlert tone="info">At least two Active points of interest are needed to create a route.</FeedbackAlert>}
        {saveError && <FeedbackAlert tone="error">{saveError} <Link href="/admin/routes" className="underline">Check Routes List</Link></FeedbackAlert>}
        {forbidden ? <Link href="/admin/login" className="underline">Sign in again</Link> : <form ref={form} aria-label="Create Route" noValidate onSubmit={submit}>
          <fieldset disabled={busy || options.pois.length < 2} className="grid min-w-0 gap-6 lg:grid-cols-[1.1fr_1fr]">
            <div className="space-y-5 rounded-2xl border border-border bg-surface p-6">
              {select('fromPoiId', 'Origin Point of Interest')}
              {select('toPoiId', 'Destination Point of Interest')}
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField id="distanceKm" label="Distance (km)" type="number" min="0.01" max="9999.99" step="0.01" required value={draft.distanceKm ?? ''} onChange={event => change('distanceKm', event.target.value === '' ? null : Number(event.target.value))} error={errors.distanceKm} />
                <TextField id="estimatedDurationMinutes" label="Estimated Travel Time (minutes)" type="number" min="1" max="2147483647" step="1" required value={draft.estimatedDurationMinutes ?? ''} onChange={event => change('estimatedDurationMinutes', event.target.value === '' ? null : Number(event.target.value))} error={errors.estimatedDurationMinutes} />
              </div>
              <div><label htmlFor="transportMode" className="mb-2 block text-sm font-semibold">Transport Mode</label>
                <select id="transportMode" className={fieldClassName} required value={draft.transportMode} onChange={event => change('transportMode', event.target.value as RouteTransportMode | '')} aria-invalid={Boolean(errors.transportMode)} aria-describedby={errors.transportMode ? 'transportMode-error' : undefined}>
                  <option value="">Select transport mode</option>{options.transportModes.map(mode => <option key={mode} value={mode}>{transportLabels[mode]}</option>)}
                </select>{errors.transportMode && <p id="transportMode-error" role="alert" className="mt-1 text-sm text-error">{errors.transportMode}</p>}
              </div>
              <div><label htmlFor="routeNote" className="mb-2 block text-sm font-semibold">Route Note <span className="font-normal text-text-secondary">(optional)</span></label>
                <textarea id="routeNote" rows={4} maxLength={2000} className={fieldClassName} value={draft.routeNote ?? ''} onChange={event => change('routeNote', event.target.value)} aria-invalid={Boolean(errors.routeNote)} aria-describedby={errors.routeNote ? 'routeNote-error' : 'routeNote-help'} />
                <p id="routeNote-help" className="mt-1 text-xs text-text-secondary">Up to 2,000 characters.</p>{errors.routeNote && <p id="routeNote-error" role="alert" className="mt-1 text-sm text-error">{errors.routeNote}</p>}
              </div>
            </div>
            <section className="min-w-0 rounded-2xl border border-border bg-surface p-6" aria-label="Route Map Preview"><h2 className="text-lg font-semibold">Route Map Preview</h2><RouteMapPreview from={from} to={to} mode={draft.transportMode} /></section>
          </fieldset>
          <div className="mt-6 flex flex-wrap justify-end gap-3"><ActionButton type="button" variant="outline" disabled={busy} onClick={() => router.push('/admin/routes')}>Cancel</ActionButton><ActionButton type="submit" variant="admin" loading={busy} disabled={options.pois.length < 2}>{busy ? 'Creating…' : 'Create Route'}</ActionButton></div>
        </form>}
      </>}
  </main>;
}
