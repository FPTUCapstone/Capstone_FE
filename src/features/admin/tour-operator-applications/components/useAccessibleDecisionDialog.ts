import { useEffect, useLayoutEffect, useRef } from 'react';

const focusableSelector =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useAccessibleDecisionDialog(isOpen: boolean, onClose: () => void, locked: boolean) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement;
    dialogRef.current?.querySelector<HTMLElement>(focusableSelector)?.focus();

    return () => {
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !locked) {
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const controls = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
      );
      if (controls.length === 0) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, locked, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  return dialogRef;
}
