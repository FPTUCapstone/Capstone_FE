import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Safe mock for HTMLMediaElement in JSDOM environments
if (typeof window !== 'undefined' && window.HTMLMediaElement) {
  window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  window.HTMLMediaElement.prototype.pause = vi.fn();
}

afterEach(() => {
  cleanup();
});
