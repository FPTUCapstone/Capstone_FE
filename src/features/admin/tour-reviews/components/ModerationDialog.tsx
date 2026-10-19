'use client';

import type { ReactNode } from 'react';

import { useAccessibleDecisionDialog } from '@/features/admin/tour-operator-applications/components/useAccessibleDecisionDialog';

interface ModerationDialogProps {
  readonly open: boolean;
  readonly titleId: string;
  readonly title: string;
  readonly descriptionId: string;
  readonly description: string;
  readonly onClose: () => void;
  readonly children: ReactNode;
}

/** Modal shell with focus trap, focus restore and Escape-to-close (CR-05 confirmations). */
export function ModerationDialog({
  open,
  titleId,
  title,
  descriptionId,
  description,
  onClose,
  children,
}: ModerationDialogProps) {
  const dialogRef = useAccessibleDecisionDialog(open, onClose, false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#00152a]/60 p-4 sm:items-center">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
      >
        <h2 id={titleId} className="text-lg font-extrabold text-[#00152a]">
          {title}
        </h2>
        <p id={descriptionId} className="mt-2 text-sm text-[#43474d]">
          {description}
        </p>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
