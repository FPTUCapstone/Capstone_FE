'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { BannerBlock } from './components/BannerBlock';
import { DestinationsBlock } from './components/DestinationsBlock';
import { FeaturedToursBlock } from './components/FeaturedToursBlock';
import { HeroBlock } from './components/HeroBlock';
import { UploadStatusContext } from './components/ImageField';
import { PreviewPanel } from './components/PreviewPanel';
import { PublishDialog } from './components/PublishDialog';
import { VersionPanel } from './components/VersionPanel';
import {
  emptyContent,
  validateContent,
  type ContentErrors,
  type LandingContent,
  type LandingContentState,
  type TourOption,
} from './landingContent';
import {
  getApprovedTours,
  getLandingContent,
  LandingContentError,
  publishDraft,
  restoreVersion,
  saveDraft,
} from './landingContentService';
import { landingContentEn } from './resources/en';

type LoadStatus = 'loading' | 'ready' | 'pending' | 'forbidden' | 'error';
type Message = {
  kind: 'success' | 'error';
  text: string;
  action?: { label: string; run: () => void };
};

const LOGIN_URL = '/admin/login?returnUrl=%2Fadmin%2Flanding-content';

export function LandingContentScreen() {
  const copy = landingContentEn;
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [loaded, setLoaded] = useState<LandingContentState | null>(null);
  const [draft, setDraft] = useState<LandingContent>(emptyContent());
  const [saved, setSaved] = useState<LandingContent>(emptyContent());
  const [hasDraft, setHasDraft] = useState(false);
  const [baseVersion, setBaseVersion] = useState<number | null>(null);
  const [tours, setTours] = useState<TourOption[] | null>(null);
  const [toursFailed, setToursFailed] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [serverErrors, setServerErrors] = useState<ContentErrors>({});
  const [busy, setBusy] = useState(false);
  const [uploads, setUploads] = useState(0);
  const [message, setMessage] = useState<Message | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const inFlight = useRef(false);

  const { replace } = useRouter();
  const [reloadKey, setReloadKey] = useState(0);

  // Loads on mount and again whenever reloadKey changes. State is only set from the promise callbacks.
  useEffect(() => {
    let cancelled = false;
    getLandingContent()
      .then((data) => {
        if (cancelled) return;
        const content = data.draft?.content ?? data.published.content;
        setLoaded(data);
        setDraft(content);
        setSaved(content);
        setHasDraft(data.draft !== null);
        setBaseVersion(data.draft?.baseVersion ?? data.published.versionNumber);
        setShowErrors(false);
        setServerErrors({});
        setStatus('ready');
        getApprovedTours().then(
          (list) => {
            if (cancelled) return;
            setTours(list);
            setToursFailed(false);
          },
          () => {
            if (!cancelled) setToursFailed(true);
          },
        );
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const code = error instanceof LandingContentError ? error.status : 0;
        if (code === 401) {
          replace(LOGIN_URL);
          return;
        }
        setLoaded(null);
        setDraft(emptyContent());
        setSaved(emptyContent());
        setHasDraft(false);
        setBaseVersion(null);
        if (code === 403) setStatus('forbidden');
        else if (code === 404 || code === 503) setStatus('pending');
        else setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey, replace]);

  function reload() {
    setStatus('loading');
    setMessage(null);
    setReloadKey((key) => key + 1);
  }

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
  const trackUpload = (delta: 1 | -1) => setUploads((count) => count + delta);
  const locked = busy || uploads > 0;
  const canSave = ready && dirty && valid && !locked && baseVersion !== null;
  const canPublish = ready && hasDraft && !dirty && !locked && baseVersion !== null;
  const editorDisabled = !ready || locked;

  function edit(next: LandingContent) {
    setDraft(next);
    setShowErrors(true);
    setServerErrors({});
    setMessage(null);
  }

  /** Maps a failed request to the screen state; a 401 sends the user to sign in instead. */
  function reportFailure(error: unknown, retry?: () => void) {
    const failure = error instanceof LandingContentError ? error : null;
    const code = failure ? failure.status : 0;
    if (code === 401) {
      replace(LOGIN_URL);
      return;
    }
    if (code === 422) {
      if (failure?.fieldErrors) setServerErrors(failure.fieldErrors);
      else setMessage({ kind: 'error', text: copy.errors.validation });
      setShowErrors(true);
    } else if (code === 403) {
      setMessage({ kind: 'error', text: copy.errors.forbidden });
    } else if (code === 409) {
      setMessage({
        kind: 'error',
        text: copy.errors.conflict,
        action: { label: copy.screen.reload, run: reload },
      });
    } else {
      setMessage({
        kind: 'error',
        text: copy.errors.unavailable,
        action: retry ? { label: copy.screen.retry, run: retry } : undefined,
      });
    }
  }

  /** Runs one write at a time; the in-flight guard makes a double click send a single request. */
  async function runExclusive(work: () => Promise<void>) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setMessage(null);
    try {
      await work();
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  async function handleSave() {
    if (!canSave || baseVersion === null) return;
    await runExclusive(async () => {
      try {
        const result = await saveDraft(baseVersion, draft);
        setDraft(result.content);
        setSaved(result.content);
        setHasDraft(true);
        setBaseVersion(result.baseVersion);
        setServerErrors({});
        setMessage({ kind: 'success', text: copy.success.draftSaved });
      } catch (error) {
        reportFailure(error);
      }
    });
  }

  function handlePublishClick() {
    if (!canPublish) return;
    setShowErrors(true);
    if (!valid) return;
    setConfirmOpen(true);
  }

  async function handlePublishConfirmed() {
    if (baseVersion === null) return;
    const version = baseVersion;
    await runExclusive(async () => {
      try {
        const published = await publishDraft(version);
        setConfirmOpen(false);
        setLoaded((current) =>
          current
            ? {
                published,
                draft: null,
                history: [
                  {
                    versionId: current.published.versionId,
                    versionNumber: current.published.versionNumber,
                    publishedByName: current.published.publishedByName,
                    publishedAtUtc: current.published.publishedAtUtc,
                  },
                  ...current.history,
                ],
              }
            : current,
        );
        setDraft(published.content);
        setSaved(published.content);
        setHasDraft(false);
        setBaseVersion(published.versionNumber);
        setServerErrors({});
        setMessage({ kind: 'success', text: copy.success.published });
      } catch (error) {
        setConfirmOpen(false);
        reportFailure(error, () => void handlePublishConfirmed());
      }
    });
  }

  async function handleRestore(versionId: string) {
    await runExclusive(async () => {
      try {
        // The contract returns the restored version as the stored draft, so it is saved state, like after a save.
        const result = await restoreVersion(versionId);
        setDraft(result.content);
        setSaved(result.content);
        setHasDraft(true);
        setBaseVersion(result.baseVersion);
        setShowErrors(true);
        setServerErrors({});
      } catch (error) {
        reportFailure(error);
      }
    });
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
    <UploadStatusContext.Provider value={trackUpload}>
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
              onClick={reload}
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
                onRestore={(versionId) => void handleRestore(versionId)}
                disabled={locked}
              />
            )}

            {message && (
              <div
                role={message.kind === 'success' ? 'status' : 'alert'}
                className={
                  message.kind === 'success'
                    ? 'rounded-2xl border border-[#abefc6] bg-[#ecfdf3] p-4 text-sm font-semibold text-[#067647]'
                    : 'rounded-2xl border border-[#fda29b] bg-[#fef3f2] p-4 text-sm font-semibold text-[#b42318]'
                }
              >
                <p>{message.text}</p>
                {message.action && (
                  <button
                    type="button"
                    onClick={message.action.run}
                    className="mt-2 rounded-lg border border-current px-3 py-1.5 text-xs font-bold"
                  >
                    {message.action.label}
                  </button>
                )}
              </div>
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
            {toursFailed && <p className="text-sm font-semibold text-[#b42318]">{copy.editor.tours.loadFailed}</p>}
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
              <button
                type="button"
                disabled={!ready}
                onClick={() => setShowPreview((open) => !open)}
                className={buttonClass}
              >
                {showPreview ? copy.editor.actions.hidePreview : copy.editor.actions.preview}
              </button>
              <button type="button" disabled={!canPublish} onClick={handlePublishClick} className={buttonClass}>
                {copy.editor.actions.publish}
              </button>
              <button type="button" disabled={!ready || locked} onClick={handleCancel} className={buttonClass}>
                {copy.editor.actions.cancel}
              </button>
            </div>
          </>
        )}
      </section>

      <PublishDialog
        open={confirmOpen}
        busy={busy}
        onConfirm={() => void handlePublishConfirmed()}
        onCancel={() => setConfirmOpen(false)}
      />
    </main>
    </UploadStatusContext.Provider>
  );
}
