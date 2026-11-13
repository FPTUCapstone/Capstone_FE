'use client';

import React, { createContext, useContext, useState, useCallback, useId } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const baseId = useId();

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = `${baseId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastMessage = { id, type, message };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, [baseId]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Render Container */}
      <div
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast) => {
          const typeStyles = {
            success: {
              bg: 'bg-[#E6F7F0] border-[#A7F3D0] text-[#065F46]',
              icon: 'check_circle',
            },
            error: {
              bg: 'bg-[#FDECEF] border-[#FECDD3] text-[#991B1B]',
              icon: 'error',
            },
            info: {
              bg: 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1D4ED8]',
              icon: 'info',
            },
          }[toast.type];

          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-2.5 p-3 rounded-lg border shadow-lg transition-all animate-in slide-in-from-bottom-2 duration-200 text-xs font-medium ${typeStyles.bg}`}
            >
              <span className="material-symbols-outlined text-[18px] shrink-0" aria-hidden="true">
                {typeStyles.icon}
              </span>
              <p className="flex-1 leading-relaxed">{toast.message}</p>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="hover:opacity-75 p-0.5 rounded cursor-pointer shrink-0"
                aria-label="Dismiss message"
              >
                <span className="material-symbols-outlined text-[15px] leading-none">close</span>
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
