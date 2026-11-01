'use client';

import { useEffect, useRef } from 'react';

import { SETTLEMENT_POLL_INTERVAL_MS } from './payoutSettlement';

/**
 * Calls `poll` every `intervalMs` while `enabled`. The next call is scheduled only after the previous one
 * settles, so a slow request is never stacked on top of a newer one. Polling pauses while the tab is hidden and
 * resumes with an immediate call when it is visible again.
 */
export function useSettlementPolling(
  enabled: boolean,
  poll: () => Promise<void>,
  intervalMs: number = SETTLEMENT_POLL_INTERVAL_MS,
): void {
  const pollRef = useRef(poll);
  useEffect(() => {
    pollRef.current = poll;
  });

  useEffect(() => {
    if (!enabled) return;

    let active = true;
    let running = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const clear = () => {
      if (timer !== null) clearTimeout(timer);
      timer = null;
    };
    const run = async () => {
      timer = null;
      running = true;
      try {
        await pollRef.current();
      } finally {
        running = false;
        if (active && !document.hidden) schedule();
      }
    };
    const schedule = () => {
      clear();
      timer = setTimeout(() => { void run(); }, intervalMs);
    };
    const onVisibilityChange = () => {
      if (document.hidden) {
        clear();
      } else if (timer === null && !running) {
        void run();
      }
    };

    if (!document.hidden) schedule();
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      active = false;
      clear();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [enabled, intervalMs]);
}
