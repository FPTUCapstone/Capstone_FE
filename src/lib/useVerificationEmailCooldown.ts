'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * 60-second verification email resend cooldown hook.
 *
 * Returns:
 * - `secondsLeft`: remaining seconds (0 = can request new verification email)
 * - `isOnCooldown`: true while countdown is active
 * - `startCooldown()`: call this immediately after requesting a new verification email
 */
export function useVerificationEmailCooldown(cooldownSeconds = 60) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startCooldown = useCallback(() => {
    clearTimer();
    setSecondsLeft(cooldownSeconds);
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTimer, cooldownSeconds]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  return {
    secondsLeft,
    isOnCooldown: secondsLeft > 0,
    startCooldown,
  };
}
