import { afterEach, expect, it, vi } from 'vitest';
import { focusValidationError } from './focusValidationError';

afterEach(() => { document.body.replaceChildren(); vi.unstubAllGlobals(); });

it('reveals the first invalid field in document order and focuses without a second scroll', () => {
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { callback(0); return 1; });
  const root = document.createElement('form');
  root.innerHTML = '<input id="first" aria-invalid="true"><input id="second" aria-invalid="true">';
  document.body.append(root);
  const first = root.querySelector<HTMLInputElement>('#first')!;
  first.scrollIntoView = vi.fn();
  focusValidationError(root, ['#second', '#first']);
  expect(document.activeElement).toBe(first);
  expect(first.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
});

it('focuses an editable control inside an invalid field group', () => {
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { callback(0); return 1; });
  const root = document.createElement('form');
  root.innerHTML = '<fieldset data-validation-error="true"><input></fieldset>';
  document.body.append(root);
  focusValidationError(root);
  expect(document.activeElement).toBe(root.querySelector('input'));
});
