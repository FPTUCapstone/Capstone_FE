'use client';
import { useEffect, useRef } from 'react';

export function useChatDialog(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; }, [onClose]);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const previous = document.activeElement as HTMLElement | null;
    const selector = 'button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex="0"]';
    const focusable = () => Array.from(root.querySelectorAll<HTMLElement>(selector));
    (root.querySelector<HTMLElement>('input:not([disabled]),textarea:not([disabled])') ?? focusable()[0])?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); close.current(); }
      if (event.key !== 'Tab') return;
      const nodes = focusable(); const first = nodes[0]; const last = nodes.at(-1);
      if (!first || !last) { event.preventDefault(); return; }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    const outside = (event: Event) => { if (event.target === root) close.current(); };
    root.addEventListener('pointerdown', outside); document.addEventListener('keydown', key);
    return () => { root.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', key); previous?.focus(); };
  }, []);
  return ref;
}
