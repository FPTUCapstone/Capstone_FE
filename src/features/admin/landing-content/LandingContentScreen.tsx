'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { BannerBlock } from './components/BannerBlock';
import { DestinationsBlock } from './components/DestinationsBlock';
import { FeaturedToursBlock } from './components/FeaturedToursBlock';
import { HeroBlock } from './components/HeroBlock';
import { PreviewPanel } from './components/PreviewPanel';
import { VersionPanel } from './components/VersionPanel';
import {
  emptyContent,
  validateContent,
  type ContentErrors,
  type LandingContent,
  type LandingContentState,
  type TourOption,
} from './landingContent';
import { getApprovedTours, getLandingContent, LandingContentError, saveDraft } from './landingContentService';
import { landingContentEn } from './resources/en';

type LoadStatus = 'loading' | 'ready' | 'pending' | 'forbidden' | 'error';
type Message = { kind: 'success' | 'error'; text: string };

const LOGIN_URL = '/admin/login?returnUrl=%2Fadmin%2Flanding-content';

export function LandingContentScreen() {
  const copy = landingContentEn;
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [loaded, setLoaded] = useState<LandingContentState | null>(null);
  const [draft, setDraft] = useState<LandingContent>(emptyContent());
  const [saved, setSaved] = useState<LandingContent>(emptyContent());
  const [baseVersion, setBaseVersion] = useState<number | null>(null);
  const [tours, setTours] = useState<TourOption[] | null>(null);
  const [toursFailed, setToursFailed] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [serverErrors, setServerErrors] = useState<ContentErrors>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    setStatus('loading');
    setMessage(null);
    try {
      const data = await getLandingContent();
      const content = data.draft?.content ?? data.published.content;
      setLoaded(data);
      setDraft(content);
      setSaved(content);
      setBaseVersion(data.draft?.baseVersion ?? data.published.versionNumber);
      setShowErrors(false);
      setServerErrors({});
      setStatus('ready');
      getApprovedTours().then(
        (list) => {
          setTours(list);
          setToursFailed(false);
        },
        () => setToursFailed(true),
      );
    } catch (error) {
      const code = error instanceof LandingContentError ? error.status : 0;
      if (code === 401) {
        window.location.assign(LOGIN_URL);
        return;
      }
      setLoaded(null);
      setDraft(emptyContent());
      setSaved(emptyContent());
      setBaseVersion(null);
      if (code === 403) setStatus('forbidden');
      else if (code === 404 || code === 503) setStatus('pending');
      else setStatus('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const tourErrors: ContentErrors = {};
  if (tours) {
    for (const id of draft.featuredTourIds) {
      if (!tours.some((tour) => tour.tourId === id)) tourErrors[`featuredTourIds.${id}`] = 'tourUnavailable';
    }
  }
  const validation: ContentErrors = { ...validateContent(draft), ...tourErrors };
  const valid = Object.keys(validation).length === 0;
  const errors: ContentErrors = showErrors ? { ...validation, ...serverErrors } : serverErrors;
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const ready = status === 'ready';
  const canSave = ready && dirty && valid && !busy && baseVersion !== null;
  const editorDisabled = !ready || busy;

  function edit(next: LandingContent) {
    setDraft(next);
    setShowErrors(true);
    setServerErrors({});
    setMessage(null);
  }

  async function handleSave() {
    if (!canSave || baseVersion === null || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setMessage(null);
    try {
      const result = await saveDraft(baseVersion, draft);
      setDraft(result.content);
      setSaved(result.content);
      setBaseVersion(result.baseVersion);
      setServerErrors({});
      setMessage({ kind: 'success', text: copy.success.draftSaved });
    } catch (error) {
      const code = error instanceof LandingContentError ? error.status : 0;
      if (code === 401) {
        window.location.assign(LOGIN_URL);
        return;
      }
      if (code === 422 && error instanceof LandingContentError && error.fieldErrors) {
        setServerErrors(error.fieldErrors);
        setShowErrors(true);
      } else if (code === 403) setMessage({ kind: 'error', text: copy.errors.forbidden });
      else if (code === 409) setMessage({ kind: 'error', text: copy.errors.conflict });
      else setMessage({ kind: 'error', text: copy.errors.unavailable });
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  function handleCancel() {
    setDraft(saved);
    setShowErrors(false);
    setServerErrors({});
    setMessage(null);
  }

  const buttonClass =
    'rounded-xl border border-[#d0d7de] bg-white px-4 py-2 text-sm font-bold text-[#00152a] hover:bg-[#f2f4f7] disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-4 py-8 text-[#191c1e] sm:px-6 md:px-8 md:py-10">
      <section className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-2xl border border-[#314863] bg-[#00152a] p-6 text-white shadow-md sm:p-8">
          <p className="text-xs font-bold tracking-wider text-[#71f8e4] uppercase">{copy.screen.eyebrow}</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{copy.screen.title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#d1e4ff]">{copy.screen.description}</p>
        </header>

        {status === 'loading' && (
          <p role="status" className="rounded-2xl border border-[#d0d7de] bg-white p-5 text-sm text-[#475467]">
            {copy.screen.loading}
          </p>
        )}

        {status === 'pending' && (
          <section className="rounded-2xl border border-[#cfe2f3] bg-[#eef6ff] p-5 sm:p-6">
            <span className="inline-flex rounded-full bg-[#d7f7f1] px-3 py-1 text-xs font-bold text-[#005048]">
              {copy.screen.pendingBadge}
            </span>
            <h2 className="mt-2 text-base font-bold text-[#1d2939]">{copy.screen.pendingTitle}</h2>
            <p className="mt-1 text-sm leading-relaxed text-[#344054]">{copy.errors.unavailable}</p>
          </section>
        )}

        {status === 'forbidden' && (
          <p role="alert" className="rounded-2xl border border-[#fda29b] bg-[#fef3f2] p-5 text-sm text-[#b42318]">
            {copy.errors.forbidden}
          </p>
        )}

        {status === 'error' && (
          <div role="alert" className="rounded-2xl border border-[#fda29b] bg-[#fef3f2] p-5 text-sm text-[#b42318]">
            <p>{copy.errors.unavailable}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-3 rounded-lg border border-[#b42318] px-3 py-1.5 text-xs font-bold"
            >
              {copy.screen.retry}
            </button>
          </div>
        )}

        {(ready || status === 'pending') && (
          <>
            {ready && loaded && (
              <VersionPanel
                published={loaded.published}
                history={loaded.history}
                onRestore={() => {}}
                disabled={busy}
              />
            )}

            {message && (
              <p
                role={message.kind === 'success' ? 'status' : 'alert'}
                className={
                  message.kind === 'success'
                    ? 'rounded-2xl border border-[#abefc6] bg-[#ecfdf3] p-4 text-sm font-semibold text-[#067647]'
                    : 'rounded-2xl border border-[#fda29b] bg-[#fef3f2] p-4 text-sm font-semibold text-[#b42318]'
                }
              >
                {message.text}
              </p>
            )}

            <HeroBlock
              value={draft.hero}
              errors={errors}
              disabled={editorDisabled}
              onChange={(hero) => edit({ ...draft, hero })}
            />
            <DestinationsBlock
              value={draft.destinations}
              errors={errors}
              disabled={editorDisabled}
              onChange={(destinations) => edit({ ...draft, destinations })}
            />
            <FeaturedToursBlock
              value={draft.featuredTourIds}
              tours={tours ?? []}
              errors={errors}
              disabled={editorDisabled}
              onChange={(featuredTourIds) => edit({ ...draft, featuredTourIds })}
            />
            {toursFailed && (
              <p className="text-sm font-semibold text-[#b42318]">{copy.editor.tours.loadFailed}</p>
            )}
            <BannerBlock
              value={draft.banner}
              errors={errors}
              disabled={editorDisabled}
              onChange={(banner) => edit({ ...draft, banner })}
            />

            {showPreview && <PreviewPanel content={draft} />}

            <div className="flex flex-wrap gap-3">
              <button type="button" disabled={!canSave} onClick={() => void handleSave()} className={buttonClass}>
                {copy.editor.actions.saveDraft}
              </button>
              <button type="button" disabled={!ready} onClick={() => setShowPreview((open) => !open)} className={buttonClass}>
                {showPreview ? copy.editor.actions.hidePreview : copy.editor.actions.preview}
              </button>
              <button type="button" disabled={!ready || busy} onClick={handleCancel} className={buttonClass}>
                {copy.editor.actions.cancel}
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
