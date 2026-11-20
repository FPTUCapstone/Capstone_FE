'use client';

import { useEffect, useState } from 'react';

import { ModerationApiError } from './services/tourModerationApi';

export type ModerationFailure = 'unauthorized' | 'forbidden' | 'notFound' | 'conflict' | 'invalid' | 'unavailable';

export type ModerationResource<T> =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly data: T }
  | { readonly status: 'failed'; readonly failure: ModerationFailure };

export function classifyFailure(error: unknown): ModerationFailure {
  if (!(error instanceof ModerationApiError)) return 'unavailable';
  if (error.status === 401) return 'unauthorized';
  if (error.status === 403) return 'forbidden';
  if (error.status === 404) return 'notFound';
  if (error.status === 409) return 'conflict';
  if (error.status === 400 || error.status === 422) return 'invalid';
  return 'unavailable';
}

type Settled<T> = { readonly key: string; readonly outcome: Exclude<ModerationResource<T>, { status: 'idle' | 'loading' }> };

/**
 * Loads a backend resource for the given inputs. `enabled=false` (demo mode) never touches the network.
 * A result only counts while its inputs still match, so navigating between pages shows "loading" instead of stale rows,
 * and nothing is set synchronously inside the effect.
 */
export function useModerationResource<T>(
  load: (signal: AbortSignal) => Promise<T>,
  inputs: readonly unknown[],
  enabled: boolean,
): { resource: ModerationResource<T>; retry: () => void } {
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<Settled<T> | null>(null);
  const key = JSON.stringify([...inputs, attempt]);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    load(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setSettled({ key, outcome: { status: 'ready', data } });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setSettled({ key, outcome: { status: 'failed', failure: classifyFailure(error) } });
      });
    return () => controller.abort();
    // `load` is intentionally keyed by `inputs`; including it would refetch on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  const resource: ModerationResource<T> = !enabled
    ? { status: 'idle' }
    : settled && settled.key === key
      ? settled.outcome
      : { status: 'loading' };

  return { resource, retry: () => setAttempt((value) => value + 1) };
}