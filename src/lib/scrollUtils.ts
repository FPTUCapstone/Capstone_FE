/**
 * Scrolls smoothly to the first invalid form field based on error keys and a key-to-element-id map.
 */
export function scrollToFirstError(
  errorKeys: string[],
  fieldMap?: Record<string, string>,
  delayMs = 50
): void {
  if (typeof window === 'undefined' || !errorKeys || errorKeys.length === 0) return;

  const targetKeys = errorKeys.filter(Boolean);
  if (targetKeys.length === 0) return;

  setTimeout(() => {
    for (const key of targetKeys) {
      const elementId = fieldMap?.[key] || key;
      const element = document.getElementById(elementId);
      if (element) {
        if (typeof element.scrollIntoView === 'function') {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        if ('focus' in element && typeof element.focus === 'function') {
          try {
            element.focus({ preventScroll: true });
          } catch {
            element.focus();
          }
        }
        break;
      }
    }
  }, delayMs);
}
