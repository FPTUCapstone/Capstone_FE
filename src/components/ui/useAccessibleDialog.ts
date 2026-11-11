'use client';

import { type RefObject, useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface UseAccessibleDialogOptions {
  isOpen: boolean;
  onClose: () => void;
  locked?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
}

/**
 * Gives app-owned dialogs a consistent Escape, focus-trap and focus-restore contract.
 * Overlay components still decide whether a backdrop click is appropriate for their action.
 */
export function useAccessibleDialog({
  isOpen,
  onClose,
  locked = false,
  initialFocusRef,
}: UseAccessibleDialogOptions) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    (initialFocusRef?.current ?? dialog?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR))?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !locked) {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab' || !dialog) return;
      const controls = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (controls.length === 0) {
        event.preventDefault();
        return;
      }

      const first = controls[0];
      const last = controls[controls.length - 1];
      const active = document.activeElement;
      const outside = !dialog.contains(active);
      if (event.shiftKey && (active === first || outside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || outside)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (opener?.isConnected) opener.focus();
    };
  }, [initialFocusRef, isOpen, locked]);

  return dialogRef;
}
