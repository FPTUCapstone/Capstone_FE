'use client';

import { useEffect, useRef } from 'react';

interface UseModalFocusTrapOptions {
  isOpen: boolean;
  onClose: () => void;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Custom hook for accessible modal dialogs:
 * - Traps focus inside the dialog (Tab / Shift+Tab wrapping)
 * - Sets initial focus to the preferred element or first focusable control
 * - Handles Escape key to close the dialog
 * - Restores focus to the trigger element when the dialog closes
 */
export function useModalFocusTrap<T extends HTMLElement = HTMLDivElement>({
  isOpen,
  onClose,
  initialFocusRef,
  triggerRef,
}: UseModalFocusTrapOptions) {
  const dialogRef = useRef<T>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Save the element that triggered the modal
    if (triggerRef?.current) {
      previouslyFocusedRef.current = triggerRef.current;
    } else if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      previouslyFocusedRef.current = document.activeElement;
    }

    // Set initial focus inside dialog
    const target =
      initialFocusRef?.current ||
      dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    target?.focus();

    return () => {
      // Restore focus to original trigger on close
      const toRestore = previouslyFocusedRef.current;
      if (toRestore && typeof toRestore.focus === 'function') {
        toRestore.focus();
      }
    };
  }, [isOpen, initialFocusRef, triggerRef]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key !== 'Tab') return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const controls = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      );

      if (controls.length === 0) {
        e.preventDefault();
        return;
      }

      const first = controls[0];
      const last = controls[controls.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first || !dialog.contains(document.activeElement)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last || !dialog.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return dialogRef;
}
