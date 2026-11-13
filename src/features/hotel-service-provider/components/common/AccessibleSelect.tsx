'use client';

import React, { useState, useRef, useEffect, useId } from 'react';

export interface SelectOption<T = string> {
  value: T;
  label: string;
  icon?: string;
  badge?: string;
  disabled?: boolean;
}

interface AccessibleSelectProps<T = string> {
  options: SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  ariaLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  required?: boolean;
  error?: string;
}

export function AccessibleSelect<T extends string = string>({
  options,
  value,
  onChange,
  label,
  ariaLabel,
  placeholder = 'Select option...',
  disabled = false,
  className = '',
  buttonClassName = '',
  required = false,
  error,
}: AccessibleSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  const uniqueId = useId();
  const labelId = `select-label-${uniqueId}`;
  const listboxId = `select-listbox-${uniqueId}`;

  const selectedOption = options.find((opt) => opt.value === value);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const openDropdown = () => {
    const idx = options.findIndex((opt) => opt.value === value);
    setHighlightedIndex(idx >= 0 ? idx : 0);
    setIsOpen(true);
  };

  // Scroll active option into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listboxRef.current) {
      const activeEl = listboxRef.current.children[highlightedIndex] as HTMLElement;
      if (activeEl && typeof activeEl.scrollIntoView === 'function') {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [isOpen, highlightedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ': {
        e.preventDefault();
        if (isOpen) {
          if (highlightedIndex >= 0 && highlightedIndex < options.length) {
            const target = options[highlightedIndex];
            if (!target.disabled) {
              onChange(target.value);
              setIsOpen(false);
              triggerRef.current?.focus();
            }
          }
        } else {
          setIsOpen(true);
        }
        break;
      }
      case 'ArrowDown': {
        e.preventDefault();
        if (!isOpen) {
          const idx = options.findIndex((opt) => opt.value === value);
          setHighlightedIndex(idx >= 0 ? idx : 0);
          setIsOpen(true);
        } else {
          setHighlightedIndex((prev) => {
            let next = prev + 1;
            while (next < options.length && options[next].disabled) {
              next++;
            }
            return next < options.length ? next : prev;
          });
        }
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        if (!isOpen) {
          const idx = options.findIndex((opt) => opt.value === value);
          setHighlightedIndex(idx >= 0 ? idx : options.length - 1);
          setIsOpen(true);
        } else {
          setHighlightedIndex((prev) => {
            let next = prev - 1;
            while (next >= 0 && options[next].disabled) {
              next--;
            }
            return next >= 0 ? next : prev;
          });
        }
        break;
      }
      case 'Home': {
        if (isOpen) {
          e.preventDefault();
          const firstNonDisabled = options.findIndex((opt) => !opt.disabled);
          if (firstNonDisabled >= 0) setHighlightedIndex(firstNonDisabled);
        }
        break;
      }
      case 'End': {
        if (isOpen) {
          e.preventDefault();
          for (let i = options.length - 1; i >= 0; i--) {
            if (!options[i].disabled) {
              setHighlightedIndex(i);
              break;
            }
          }
        }
        break;
      }
      case 'Escape': {
        if (isOpen) {
          e.preventDefault();
          setIsOpen(false);
          triggerRef.current?.focus();
        }
        break;
      }
      case 'Tab': {
        if (isOpen) {
          setIsOpen(false);
        }
        break;
      }
    }
  };

  const highlightedOptionId =
    isOpen && highlightedIndex >= 0 ? `opt-${uniqueId}-${highlightedIndex}` : undefined;

  return (
    <div className={`relative flex flex-col ${className}`} ref={containerRef}>
      {label && (
        <label
          id={labelId}
          className="mb-1 text-xs font-semibold text-[#1C2928] flex items-center gap-1"
        >
          <span>{label}</span>
          {required && <span className="text-[#DC2626] font-bold" aria-hidden="true">*</span>}
        </label>
      )}

      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-activedescendant={highlightedOptionId}
        aria-labelledby={label ? labelId : undefined}
        aria-label={!label ? ariaLabel || placeholder : undefined}
        aria-required={required}
        aria-invalid={Boolean(error)}
        disabled={disabled}
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
          } else {
            openDropdown();
          }
        }}
        onKeyDown={handleKeyDown}
        className={`flex items-center justify-between w-full h-10 px-3 py-2 text-sm bg-white border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#174B4A] focus:border-[#174B4A] ${
          error ? 'border-[#DC2626]' : 'border-[#DCE2DD] hover:border-[#174B4A]'
        } ${disabled ? 'bg-[#F1F5F9] text-[#8E9E9B] cursor-not-allowed' : 'text-[#1C2928] cursor-pointer'} ${buttonClassName}`}
      >
        <span className="truncate flex items-center gap-2">
          {selectedOption?.icon && (
            <span className="material-symbols-outlined text-[16px] text-[#5B6E69]" aria-hidden="true">
              {selectedOption.icon}
            </span>
          )}
          <span className={selectedOption ? 'font-medium' : 'text-[#8E9E9B]'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>
        <span
          className={`material-symbols-outlined text-[18px] text-[#5B6E69] transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        >
          expand_more
        </span>
      </button>

      {/* Accessible Listbox Dropdown */}
      {isOpen && (
        <ul
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={label ? labelId : undefined}
          aria-label={!label ? ariaLabel || placeholder : undefined}
          className="absolute z-50 w-full mt-1.5 max-h-60 overflow-y-auto bg-white border border-[#DCE2DD] rounded-lg shadow-lg py-1 focus:outline-none text-sm text-[#1C2928]"
        >
          {options.length === 0 ? (
            <li className="px-3 py-2 text-xs text-[#8E9E9B] italic" role="none">
              No options available
            </li>
          ) : (
            options.map((option, index) => {
              const isSelected = option.value === value;
              const isHighlighted = index === highlightedIndex;
              const optId = `opt-${uniqueId}-${index}`;

              return (
                <li
                  key={String(option.value)}
                  id={optId}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={option.disabled}
                  onClick={() => {
                    if (!option.disabled) {
                      onChange(option.value);
                      setIsOpen(false);
                      triggerRef.current?.focus();
                    }
                  }}
                  onMouseEnter={() => {
                    if (!option.disabled) setHighlightedIndex(index);
                  }}
                  className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-colors ${
                    option.disabled
                      ? 'opacity-40 cursor-not-allowed bg-transparent'
                      : isHighlighted
                      ? 'bg-[#E8F7F4] text-[#174B4A]'
                      : isSelected
                      ? 'bg-[#F7F5EF] text-[#174B4A] font-medium'
                      : 'hover:bg-[#F7F5EF]'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    {option.icon && (
                      <span className="material-symbols-outlined text-[16px] text-[#5B6E69]" aria-hidden="true">
                        {option.icon}
                      </span>
                    )}
                    <span>{option.label}</span>
                  </span>
                  {isSelected && (
                    <span className="material-symbols-outlined text-[16px] text-[#174B4A] shrink-0" aria-hidden="true">
                      check
                    </span>
                  )}
                </li>
              );
            })
          )}
        </ul>
      )}

      {error && (
        <span className="mt-1 text-xs text-[#DC2626]" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
