/** Run after React renders field errors, then reveal and focus the first invalid control. */
export function focusValidationError(root: HTMLElement | null, selectors?: string[]): void {
  requestAnimationFrame(() => {
    const target = root?.querySelector<HTMLElement>(selectors?.length
      ? selectors.join(', ')
      : '[aria-invalid="true"], [data-validation-error="true"]');
    if (!target) return;
    target.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    const control = target.matches('input, select, textarea, button')
      ? target
      : target.querySelector<HTMLElement>('input:not(:disabled), select:not(:disabled), textarea:not(:disabled), button:not(:disabled)');
    (control ?? target).focus({ preventScroll: true });
  });
}
