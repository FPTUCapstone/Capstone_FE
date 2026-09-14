import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useVerificationEmailCooldown } from './useVerificationEmailCooldown';

describe('useVerificationEmailCooldown', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts down and releases the cooldown using the production hook', () => {
    vi.useFakeTimers();
    const { result, unmount } = renderHook(() => useVerificationEmailCooldown(2));

    act(() => result.current.startCooldown());
    expect(result.current.secondsLeft).toBe(2);
    expect(result.current.isOnCooldown).toBe(true);

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.secondsLeft).toBe(1);

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.secondsLeft).toBe(0);
    expect(result.current.isOnCooldown).toBe(false);

    unmount();
  });
});
