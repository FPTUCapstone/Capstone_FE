'use client';

import { KeyboardEvent, ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import { usePopoverDismiss } from './usePopoverDismiss';

export interface PopoverMenuItem {
  key: string;
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  /** For `menuitemradio`: the current choice (focused first when the menu opens). */
  checked?: boolean;
}

interface PopoverMenuProps {
  triggerLabel: string;
  triggerContent: ReactNode;
  triggerClassName: string;
  triggerDisabled?: boolean;
  menuLabel: string;
  itemRole: 'menuitem' | 'menuitemradio';
  items: PopoverMenuItem[];
  align?: 'left' | 'right';
}

/**
 * A small ARIA menu button: focus moves into the menu on open (the checked item first), Arrow Up/Down,
 * Home/End move between enabled items, Escape closes, and focus returns to the trigger after a choice.
 */
export function PopoverMenu({
  triggerLabel,
  triggerContent,
  triggerClassName,
  triggerDisabled = false,
  menuLabel,
  itemRole,
  items,
  align = 'left',
}: PopoverMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const close = useCallback(() => setOpen(false), []);
  usePopoverDismiss(open, close, containerRef);

  const enabledIndexes = items.flatMap((item, index) => (item.disabled ? [] : [index]));

  useEffect(() => {
    if (!open) return;
    const checked = items.findIndex((item) => item.checked && !item.disabled);
    const first = checked >= 0 ? checked : enabledIndexes[0];
    if (first !== undefined) itemRefs.current[first]?.focus();
    // Only when the menu opens: later item changes must not move focus.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const closeToTrigger = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closeToTrigger();
      return;
    }
    if (event.key === 'Tab') {
      setOpen(false);
      return;
    }
    if (enabledIndexes.length === 0) return;
    const current = itemRefs.current.findIndex((element) => element === document.activeElement);
    const position = enabledIndexes.indexOf(current);
    let next: number | null = null;
    if (event.key === 'ArrowDown') next = enabledIndexes[(position + 1) % enabledIndexes.length];
    else if (event.key === 'ArrowUp')
      next = enabledIndexes[(position - 1 + enabledIndexes.length) % enabledIndexes.length];
    else if (event.key === 'Home') next = enabledIndexes[0];
    else if (event.key === 'End') next = enabledIndexes[enabledIndexes.length - 1];
    if (next === null) return;
    event.preventDefault();
    itemRefs.current[next]?.focus();
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={triggerLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={triggerDisabled}
        onClick={() => setOpen((value) => !value)}
        className={triggerClassName}
      >
        {triggerContent}
      </button>
      {open && (
        <div
          role="menu"
          aria-label={menuLabel}
          onKeyDown={onMenuKeyDown}
          className={`absolute top-full z-20 mt-1 min-w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-lg ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {items.map((item, index) => (
            <button
              key={item.key}
              ref={(element) => {
                itemRefs.current[index] = element;
              }}
              type="button"
              role={itemRole}
              aria-checked={itemRole === 'menuitemradio' ? Boolean(item.checked) : undefined}
              tabIndex={-1}
              disabled={item.disabled}
              onClick={() => {
                closeToTrigger();
                item.onSelect();
              }}
              className={`block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold transition hover:bg-slate-50 focus:bg-slate-100 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
                item.checked ? 'text-[#007d6e]' : 'text-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
