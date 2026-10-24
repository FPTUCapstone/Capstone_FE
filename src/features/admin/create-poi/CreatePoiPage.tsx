'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';
import type { CreatePoiRequest, PoiCatalogue, PoiFormData, PoiResponse, ValidationErrors } from './types/poi';
import { createEmptyPoiForm, mapPoiErrors, toCreatePoiRequest, validatePoiForm } from './services/poi-contract';
import { createPoi, loadCatalogue, PoiApiError } from './services/poi-api';
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
  const [formData, setFormData] = useState<PoiFormData>(createEmptyPoiForm);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [catalogue, setCatalogue] = useState<PoiCatalogue | null>(null);
  const [catalogueError, setCatalogueError] = useState<PoiApiError | null>(null);
  const [catalogueLoading, setCatalogueLoading] = useState(true);
  const [reloadCount, setReloadCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<PoiApiError | null>(null);
  const [created, setCreated] = useState<PoiResponse | null>(null);
  const [duplicate, setDuplicate] = useState<{ id: number; request: CreatePoiRequest } | null>(null);
  const inFlight = useRef(false);
  const feedback = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    loadCatalogue(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setCatalogue(data);
          setCatalogueError(null);
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setCatalogue(null);
          setCatalogueError(
            error instanceof PoiApiError
              ? error
              : new PoiApiError(0, 'The catalogue could not be loaded.'),
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCatalogueLoading(false);
      });
    return () => controller.abort();
  }, [reloadCount]);

  useEffect(() => {
    if (failure || created) feedback.current?.focus();
  }, [failure, created]);

  const reloadCatalogue = () => {
    setCatalogueLoading(true);
    setReloadCount((value) => value + 1);
  };

  const handleFieldChange = (field: keyof PoiFormData, value: unknown) => {
    if (inFlight.current) return;
    setFormData((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) =>
      Object.fromEntries(
        Object.entries(previous).filter(
          ([key]) => key !== field && !key.startsWith(`${field}.`),
        ),
      ),
    );
    setDuplicate(null);
    setFailure(null);
    setCreated(null);
  };

  const handleReset = () => {
    if (inFlight.current) return;
    setFormData(createEmptyPoiForm());
    setErrors({});
    setFailure(null);
    setDuplicate(null);
    setCreated(null);
  };

  const authError = [catalogueError, failure].find(
    (error) => error?.status === 401 || error?.status === 403,
  );
  const busy = submitting;
  const saveDisabled =
    busy ||
    catalogueLoading ||
    !catalogue?.categories.length ||
    Boolean(authError) ||
    Boolean(created);

  const sendRequest = async (request: CreatePoiRequest) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    setErrors({});
    setFailure(null);
    setDuplicate(null);
    try {
      setCreated(await createPoi(request));
    } catch (error) {
      const apiError =
        error instanceof PoiApiError
          ? error
          : new PoiApiError(
              0,
              'The save could not be confirmed. Check the catalogue before trying again.',
            );
      setFailure(apiError);
      setErrors(mapPoiErrors(apiError.errors, formData));
      if (
        apiError.status === 409 &&
        apiError.errorCode === 'Poi.PossibleDuplicate' &&
        apiError.existingPoiId
      ) {
        setDuplicate({ id: apiError.existingPoiId, request });
      }
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  const handleSubmit = (event?: React.FormEvent) => {
    event?.preventDefault();
    if (saveDisabled || inFlight.current) return;
    const validation = validatePoiForm(formData);
    if (!catalogue?.categories.some((category) => category.id === Number(formData.category_id))) {
      validation.category_id = 'Select an available catalogue category.';
    }
    if (formData.tags.some((id) => !catalogue?.tags.some((tag) => tag.id === id))) {
      validation.tags = 'Remove unavailable tags and select from the current catalogue.';
    }
    setErrors(validation);
    if (Object.keys(validation).length) {
      feedback.current?.focus();
      return;
    }
    void sendRequest(toCreatePoiRequest(formData));
  };

  const preview = Object.keys(validatePoiForm(formData)).length === 0 ? toCreatePoiRequest(formData) : null;

  return (
    <div className="pb-16 text-[#1C2923]">
      <div className="mx-auto max-w-7xl">
        {/* Workspace Header - Forest Charcoal Authority */}
        <header className="mb-6 rounded-2xl border border-[#2A3B33] bg-[#1C2923] p-6 text-[#F7F6F2] shadow-sm md:p-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#758B74] bg-[#273830] px-3 py-1 text-xs font-bold tracking-wider text-[#E8EFE9] uppercase">
                <span className="material-symbols-outlined text-[14px]">add_location_alt</span>
                <span>Spatial Operations — UC-52</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Create Point of Interest
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#A3B3AB]">
                Register a tourist attraction, coordinates, and operating schedule in the TripMate catalogue.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={ROUTES.admin.pois}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#758B74] bg-[#273830] px-3.5 py-2 text-xs font-bold text-[#E8EFE9] hover:bg-[#2F443A] transition"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Back to Catalog</span>
              </Link>
              <button
                type="button"
                disabled={busy}
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#D8D5CC] bg-white px-3.5 py-2 text-xs font-bold text-[#1C2923] hover:bg-[#F7F6F2] transition disabled:opacity-50"
              >
                <span>Discard</span>
              </button>
              <button
                type="button"
                disabled={saveDisabled || busy}
                onClick={() => handleSubmit()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#245747] border border-[#758B74] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#1B4337] focus-visible:outline-2 focus-visible:outline-[#758B74] disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">save</span>
                <span>{busy ? 'Saving POI...' : 'Save POI'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Catalogue Status Bar */}
        <div
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E6E4DD] bg-white px-4 py-3 text-xs text-[#53665D]"
          role="status"
        >
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                catalogueLoading
                  ? 'bg-amber-400 animate-pulse'
                  : catalogueError
                  ? 'bg-red-500'
                  : 'bg-emerald-500'
              }`}
              aria-hidden="true"
            />
            <span>
              {catalogueLoading
                ? 'Loading catalogue options...'
                : catalogueError
                ? catalogueError.message
                : catalogue?.categories.length
                ? `Catalogue loaded: ${catalogue.categories.length} categories, ${catalogue.tags.length} tags available.`
                : 'No POI categories are available. An administrator must configure categories first.'}
            </span>
          </div>
          <button
            type="button"
            disabled={catalogueLoading || busy}
            onClick={reloadCatalogue}
            className="inline-flex items-center gap-1 rounded-lg border border-[#D8D5CC] bg-[#F7F6F2] px-2.5 py-1 text-xs font-semibold text-[#1C2923] hover:bg-[#EDECE8] transition disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[14px]">refresh</span>
            <span>Reload</span>
          </button>
        </div>

        {/* Feedback / Alert Banners */}
        <div ref={feedback} tabIndex={-1} className="outline-none">
          {authError ? (
            <div role="alert" className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
              <p>
                {authError.message}{' '}
                <Link href={ROUTES.admin.login} className="font-semibold underline">
                  Sign in
                </Link>
              </p>
            </div>
          ) : null}

          {failure && !authError ? (
            <div role="alert" className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold">{failure.message}</p>
              {duplicate ? (
                <div className="mt-3">
                  <p>Existing POI ID: #{duplicate.id}. Create another POI with the same name and location?</p>
                  <div className="mt-2 flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void sendRequest({ ...duplicate.request, confirmDuplicate: true })}
                      className="min-h-11 rounded-xl bg-[#245747] px-4 text-xs font-bold text-white shadow-xs hover:bg-[#1B4337] transition"
                    >
                      Confirm duplicate and create
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDuplicate(null);
                        setFailure(null);
                      }}
                      className="min-h-11 rounded-xl border border-[#D8D5CC] bg-white px-4 text-xs font-semibold text-[#1C2923] hover:bg-[#F7F6F2] transition"
                    >
                      Review form
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {Object.keys(errors).length ? (
            <div role="alert" className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p className="font-semibold">Please review the following fields:</p>
              <ul className="mt-1 list-disc pl-5 space-y-0.5">
                {Object.entries(errors).map(([key, message]) => (
                  <li key={key}>{message}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {created ? (
            <div role="status" className="mb-4 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">
              <p className="font-semibold">Point of Interest Created Successfully! ID: #{created.id}</p>
              <p className="mt-1 text-xs text-emerald-800">
                {created.name} has been registered with status: {created.status}.
              </p>
              <button
                type="button"
                onClick={handleReset}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#245747] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#1B4337] transition"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Create Another POI</span>
              </button>
            </div>
          ) : null}
        </div>

        {/* POI Form Structure */}
        <form onSubmit={handleSubmit} noValidate aria-busy={submitting}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Main Form Column (8 cols) */}
            <div className="space-y-6 lg:col-span-8">
              <BasicInfoSection
                formData={formData}
                categories={catalogue?.categories ?? []}
                errors={errors}
                onChange={handleFieldChange}
                disabled={busy || catalogueLoading}
              />
              <LocationSection
                formData={formData}
                errors={errors}
                onChange={handleFieldChange}
                disabled={busy}
              />
              <VisitAttributesSection
                formData={formData}
                errors={errors}
                onChange={handleFieldChange}
                disabled={busy}
              />
              <TagsSection
                formData={formData}
                tags={catalogue?.tags ?? []}
                errors={errors}
                onChange={handleFieldChange}
                disabled={busy || catalogueLoading}
              />
              <OpeningHoursSection
                formData={formData}
                errors={errors}
                onChange={handleFieldChange}
                disabled={busy}
              />

              {/* Mobile Only: Summary Card */}
              <div className="lg:hidden">
                <CreationSummaryCard />
              </div>
            </div>

            {/* Desktop Sticky Rail (4 cols) */}
            <div className="hidden lg:block space-y-6 lg:col-span-4">
              <div className="space-y-6 lg:sticky lg:top-24">
                <PoiSummaryReadinessCard formData={formData} />
                <OperationsCard
                  onSave={handleSubmit}
                  onCancel={handleReset}
                  submitting={busy}
                  saveDisabled={saveDisabled}
                />
                <TelemetryCard payload={preview} />
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Sticky Action Bar for Mobile Viewports */}
      <StickyActionBarMobile
        onSubmit={handleSubmit}
        onReset={handleReset}
        submitting={busy}
        disabled={saveDisabled}
        errorCount={Object.keys(errors).length}
      />
    </div>
  );
}
