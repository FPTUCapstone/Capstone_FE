'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/routes';
import type { CreatePoiRequest, PoiCatalogue, PoiFormData, PoiResponse, ValidationErrors } from './types/poi';
import { createEmptyPoiForm, mapPoiErrors, toCreatePoiRequest, validatePoiForm } from './services/poi-contract';
import { createPoi, loadCatalogue, PoiApiError } from './services/poi-api';
import { AdminSidebar } from './components/AdminSidebar';
import { AdminHeader } from './components/AdminHeader';
import { BasicInfoSection } from './components/BasicInfoSection';
import { LocationSection } from './components/LocationSection';
import { VisitAttributesSection } from './components/VisitAttributesSection';
import { TagsSection } from './components/TagsSection';
import { OpeningHoursSection } from './components/OpeningHoursSection';
import { CreationSummaryCard } from './components/CreationSummaryCard';
import { PoiSummaryReadinessCard } from './components/PoiSummaryReadinessCard';
import { OperationsCard } from './components/OperationsCard';
import { TelemetryCard } from './components/TelemetryCard';
import { StickyActionBarMobile } from './components/StickyActionBarMobile';

export function CreatePoiPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<PoiFormData>(createEmptyPoiForm);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [catalogue, setCatalogue] = useState<PoiCatalogue | null>(null);
  const [catalogueError, setCatalogueError] = useState<PoiApiError | null>(null);
  const [catalogueLoading, setCatalogueLoading] = useState(true);
  const [reloadCount, setReloadCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const inFlight = useRef(false);
  const [failure, setFailure] = useState<PoiApiError | null>(null);
  const [created, setCreated] = useState<PoiResponse | null>(null);
  const [duplicate, setDuplicate] = useState<{ id: number; request: CreatePoiRequest } | null>(null);
  const feedback = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    loadCatalogue(controller.signal).then(data => {
      if (!controller.signal.aborted) { setCatalogue(data); setCatalogueError(null); }
    }).catch(error => {
      if (!controller.signal.aborted) { setCatalogue(null); setCatalogueError(error instanceof PoiApiError ? error : new PoiApiError(0, 'The catalogue could not be loaded.')); }
    }).finally(() => { if (!controller.signal.aborted) setCatalogueLoading(false); });
    return () => controller.abort();
  }, [reloadCount]);

  useEffect(() => {
    if (failure || created) feedback.current?.focus();
  }, [failure, created]);

  const reloadCatalogue = () => { setCatalogueLoading(true); setReloadCount(value => value + 1); };
  const handleFieldChange = (field: keyof PoiFormData, value: unknown) => {
    if (inFlight.current) return;
    setFormData(previous => ({ ...previous, [field]: value }));
    setErrors(previous => Object.fromEntries(Object.entries(previous).filter(([key]) => key !== field && !key.startsWith(`${field}.`))));
    setDuplicate(null); setFailure(null); setCreated(null);
  };
  const handleReset = () => {
    if (inFlight.current) return;
    setFormData(createEmptyPoiForm()); setErrors({}); setFailure(null); setDuplicate(null); setCreated(null);
  };
  const authError = [catalogueError, failure].find(error => error?.status === 401 || error?.status === 403);
  const busy = submitting || signingOut;
  const saveDisabled = busy || catalogueLoading || !catalogue?.categories.length || Boolean(authError) || Boolean(created);

  const sendRequest = async (request: CreatePoiRequest) => {
    if (inFlight.current) return;
    inFlight.current = true; setSubmitting(true); setErrors({}); setFailure(null); setDuplicate(null);
    try { setCreated(await createPoi(request)); }
    catch (error) {
      const apiError = error instanceof PoiApiError ? error : new PoiApiError(0, 'The save could not be confirmed. Check the catalogue before trying again.');
      setFailure(apiError);
      setErrors(mapPoiErrors(apiError.errors, formData));
      if (apiError.status === 409 && apiError.errorCode === 'Poi.PossibleDuplicate' && apiError.existingPoiId) setDuplicate({ id: apiError.existingPoiId, request });
    } finally { inFlight.current = false; setSubmitting(false); }
  };
  const handleSubmit = (event?: React.FormEvent) => {
    event?.preventDefault();
    if (saveDisabled || inFlight.current) return;
    const validation = validatePoiForm(formData);
    if (!catalogue?.categories.some(category => category.id === Number(formData.category_id))) validation.category_id = 'Select an available catalogue category.';
    if (formData.tags.some(id => !catalogue?.tags.some(tag => tag.id === id))) validation.tags = 'Remove unavailable tags and select from the current catalogue.';
    setErrors(validation);
    if (Object.keys(validation).length) { feedback.current?.focus(); return; }
    void sendRequest(toCreatePoiRequest(formData));
  };
  const signOut = async () => {
    if (inFlight.current) return;
    inFlight.current = true; setSigningOut(true);
    try {
      const response = await fetch('/api/admin/session', { method: 'DELETE', signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error('Sign-out failed');
      router.replace(ROUTES.admin.login); router.refresh();
    } catch {
      inFlight.current = false; setSigningOut(false);
      setFailure(new PoiApiError(0, 'Sign-out could not be completed. Please try again.'));
    }
  };
  const preview = Object.keys(validatePoiForm(formData)).length === 0 ? toCreatePoiRequest(formData) : null;

  return (
    <div className="flex min-h-screen bg-[#F3F4F6] text-slate-900 font-sans">
      <div className="hidden lg:block lg:w-64 lg:shrink-0"><AdminSidebar onSignOut={signOut} disabled={busy} /></div>
      <div className="flex-1 flex flex-col min-w-0 pt-16 pb-24 lg:pb-12">
        <AdminHeader onSave={handleSubmit} onCancel={handleReset} onSignOut={signOut} submitting={busy} saveDisabled={saveDisabled} />
        <main className="flex-1 px-4 sm:px-6 py-4 sm:py-6 max-w-7xl w-full mx-auto">
          <div className="mb-6 hidden lg:flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div><h1 className="text-2xl font-black tracking-tight">Create Point of Interest</h1><p className="text-xs text-slate-500 mt-1">Register a location and its visit attributes in the TripMate catalogue.</p></div>
            <button type="button" disabled={busy} onClick={signOut} className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm">{signingOut ? 'Signing out...' : 'Sign out'}</button>
          </div>
          <div className="mb-4 flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-600" role="status">
            <span>{catalogueLoading ? 'Loading catalogue...' : catalogueError ? catalogueError.message : catalogue?.categories.length ? 'Catalogue loaded.' : 'No POI categories are available. An administrator must add a category before you can create a POI.'}</span>
            <button type="button" disabled={catalogueLoading || busy} onClick={reloadCatalogue} className="h-8 sm:min-h-11 rounded-lg border border-slate-300 px-2.5 text-xs disabled:opacity-50">Reload catalogue</button>
          </div>
          <div ref={feedback} tabIndex={-1} className="outline-none">
            {authError ? <p role="alert" className="mb-4 rounded-xl bg-amber-50 p-4 text-sm">{authError.message} <Link href={ROUTES.admin.login} className="font-semibold underline">Sign in</Link></p> : null}
            {failure && !authError ? <div role="alert" className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm">
              <p>{failure.message}</p>
              {duplicate ? <div className="mt-3"><p>Existing POI ID: #{duplicate.id}. Create another POI with the same name and location?</p><div className="flex flex-wrap gap-3 mt-2">
                <button type="button" disabled={busy} onClick={() => void sendRequest({ ...duplicate.request, confirmDuplicate: true })} className="min-h-11 rounded-lg bg-[#006b5f] px-4 text-white">Confirm duplicate and create</button>
                <button type="button" onClick={() => { setDuplicate(null); setFailure(null); }} className="min-h-11 rounded-lg border border-slate-400 px-4">Review form</button>
              </div></div> : null}
            </div> : null}
            {Object.keys(errors).length ? <div role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-800"><p className="font-semibold">Please review the form:</p><ul className="list-disc pl-5">{Object.entries(errors).map(([key, message]) => <li key={key}>{message}</li>)}</ul></div> : null}
            {created ? <div role="status" className="mb-4 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm"><p className="font-semibold">Point of Interest Created! ID: #{created.id}</p><p>{created.name} has been saved. Status: {created.status}.</p><button type="button" onClick={handleReset} className="mt-3 min-h-11 rounded-lg bg-[#006b5f] px-4 text-white">Create Another POI</button></div> : null}
          </div>
          <form onSubmit={handleSubmit} noValidate aria-busy={submitting}>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="space-y-4 sm:space-y-6 lg:col-span-8">
                <BasicInfoSection formData={formData} categories={catalogue?.categories ?? []} errors={errors} onChange={handleFieldChange} disabled={busy || catalogueLoading} />
                <LocationSection formData={formData} errors={errors} onChange={handleFieldChange} disabled={busy} />
                <VisitAttributesSection formData={formData} errors={errors} onChange={handleFieldChange} disabled={busy} />
                <TagsSection formData={formData} tags={catalogue?.tags ?? []} errors={errors} onChange={handleFieldChange} disabled={busy || catalogueLoading} />
                <OpeningHoursSection formData={formData} errors={errors} onChange={handleFieldChange} disabled={busy} />
                {/* Section 6 (Mobile View): Creation Summary */}
                <div className="lg:hidden">
                  <CreationSummaryCard />
                </div>
              </div>
              <div className="hidden lg:block space-y-6 lg:col-span-4"><div className="space-y-6 lg:sticky lg:top-20">
                <PoiSummaryReadinessCard formData={formData} />
                <OperationsCard onSave={handleSubmit} onCancel={handleReset} submitting={busy} saveDisabled={saveDisabled} />
                <TelemetryCard payload={preview} />
              </div></div>
            </div>
          </form>
        </main>
        <StickyActionBarMobile onSubmit={handleSubmit} onReset={handleReset} submitting={busy} disabled={saveDisabled} errorCount={Object.keys(errors).length} />
      </div>
    </div>
  );
}
