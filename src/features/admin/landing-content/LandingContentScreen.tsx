'use client';

import { useCallback, useEffect, useState } from 'react';

import { VersionPanel } from './components/VersionPanel';
import type { LandingContentState } from './landingContent';
import { getLandingContent, LandingContentError } from './landingContentService';
import { landingContentEn } from './resources/en';

type ScreenState =
  | { status: 'loading' }
  | { status: 'ready'; data: LandingContentState }
  | { status: 'pending' }
  | { status: 'forbidden' }
  | { status: 'error' };

const LOGIN_URL = '/admin/login?returnUrl=%2Fadmin%2Flanding-content';

export function LandingContentScreen() {
  const copy = landingContentEn;
  const [state, setState] = useState<ScreenState>({ status: 'loading' });

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      setState({ status: 'ready', data: await getLandingContent() });
    } catch (error) {
      const status = error instanceof LandingContentError ? error.status : 0;
      if (status === 401) {
        window.location.assign(LOGIN_URL);
        return;
      }
      if (status === 403) setState({ status: 'forbidden' });
      else if (status === 404 || status === 503) setState({ status: 'pending' });
      else setState({ status: 'error' });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-4 py-8 text-[#191c1e] sm:px-6 md:px-8 md:py-10">
      <section className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-2xl border border-[#314863] bg-[#00152a] p-6 text-white shadow-md sm:p-8">
          <p className="text-xs font-bold tracking-wider text-[#71f8e4] uppercase">{copy.screen.eyebrow}</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{copy.screen.title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#d1e4ff]">{copy.screen.description}</p>
        </header>

        {state.status === 'loading' && (
          <p role="status" className="rounded-2xl border border-[#d0d7de] bg-white p-5 text-sm text-[#475467]">
            {copy.screen.loading}
          </p>
        )}

        {state.status === 'pending' && (
          <section className="rounded-2xl border border-[#cfe2f3] bg-[#eef6ff] p-5 sm:p-6">
            <span className="inline-flex rounded-full bg-[#d7f7f1] px-3 py-1 text-xs font-bold text-[#005048]">
              {copy.screen.pendingBadge}
            </span>
            <h2 className="mt-2 text-base font-bold text-[#1d2939]">{copy.screen.pendingTitle}</h2>
            <p className="mt-1 text-sm leading-relaxed text-[#344054]">{copy.errors.unavailable}</p>
          </section>
        )}

        {state.status === 'forbidden' && (
          <p role="alert" className="rounded-2xl border border-[#fda29b] bg-[#fef3f2] p-5 text-sm text-[#b42318]">
            {copy.errors.forbidden}
          </p>
        )}

        {state.status === 'error' && (
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

        {state.status === 'ready' && (
          <VersionPanel
            published={state.data.published}
            history={state.data.history}
            onRestore={() => {}}
            disabled={false}
          />
        )}
      </section>
    </main>
  );
}
