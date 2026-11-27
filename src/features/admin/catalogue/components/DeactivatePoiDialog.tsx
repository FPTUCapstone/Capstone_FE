'use client';

import { useEffect, useRef, useState } from 'react';
import { poiManagementEn } from '../resources/en';
import {
  deactivatePoi,
  loadPoiDeactivationReferences,
  PoiManagementApiError,
} from '../services/poi-management-api';
import type {
  PoiDeactivationReferences,
  PoiManagementItem,
} from '../types/poi-management';

interface DeactivatePoiDialogProps {
  poi: PoiManagementItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function DeactivatePoiDialog({
  poi,
  isOpen,
  onClose,
  onSuccess,
}: DeactivatePoiDialogProps) {
  if (!isOpen || !poi) return null;

  return (
    <DeactivatePoiDialogModal
      poi={poi}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

interface DeactivatePoiDialogModalProps {
  poi: PoiManagementItem;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

function DeactivatePoiDialogModal({
  poi,
  onClose,
  onSuccess,
}: DeactivatePoiDialogModalProps) {
  const [references, setReferences] = useState<PoiDeactivationReferences | null>(null);
  const [loadingReferences, setLoadingReferences] = useState(true);
  const [reason, setReason] = useState('');
  const attempt = useRef<{ key: string; reason: string; token: string } | null>(null);
  const reasonError = reason.trim() ? null : poiManagementEn.msg123;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [concurrencyNotice, setConcurrencyNotice] = useState(false);

  useEffect(() => {
    let isMounted = true;

    loadPoiDeactivationReferences(poi.id)
      .then((data) => {
        if (isMounted) {
          setReferences(data);
          setLoadingReferences(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setLoadingReferences(false);
          setSubmitError(
            err instanceof PoiManagementApiError && err.backendCode === 'POI.AlreadyInactive'
              ? poiManagementEn.alreadyInactive
              : err instanceof PoiManagementApiError && err.status === 403
                ? poiManagementEn.msg126
                : poiManagementEn.unavailable,
          );
        }
      });

    return () => {
      isMounted = false;
    };
  }, [poi.id]);

  const handleConfirm = async () => {
    const trimmedReason = reason.trim();
    const token = references?.referenceSnapshotToken;
    if (!trimmedReason || !token || isSubmitting || loadingReferences) return;

    if (attempt.current?.reason !== trimmedReason || attempt.current.token !== token) {
      attempt.current = { key: crypto.randomUUID(), reason: trimmedReason, token };
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setConcurrencyNotice(false);

    try {
      const result = await deactivatePoi({
        poiId: poi.id,
        reason: trimmedReason,
        referenceSnapshotToken: token,
        idempotencyKey: attempt.current.key,
      });
      setIsSubmitting(false);
      onSuccess(result.message || poiManagementEn.msg193);
      onClose();
    } catch (err: unknown) {
      setIsSubmitting(false);
      if (err instanceof PoiManagementApiError && err.backendCode === 'POI.AlreadyInactive') {
        onSuccess(poiManagementEn.alreadyInactive);
        onClose();
        return;
      }

      if (err instanceof PoiManagementApiError && err.backendCode === 'POI.ReferenceMismatch') {
        setReferences(null);
        setLoadingReferences(true);
        try {
          const fresh = await loadPoiDeactivationReferences(poi.id);
          setReferences(fresh);
          setConcurrencyNotice(true);
        } catch (refreshError) {
          if (refreshError instanceof PoiManagementApiError && refreshError.backendCode === 'POI.AlreadyInactive') {
            onSuccess(poiManagementEn.alreadyInactive);
            onClose();
          } else {
            setSubmitError(poiManagementEn.unavailable);
          }
        } finally {
          setLoadingReferences(false);
        }
        return;
      }

      if (err instanceof PoiManagementApiError && err.status === 403) {
        setSubmitError(poiManagementEn.msg126);
        return;
      }

      setSubmitError(poiManagementEn.msg127);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="deactivate-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
    >
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-[#DCE2DD] text-[#1C2928]">
        {/* Header */}
        <div className="border-b border-[#DCE2DD] bg-[#F7F5EF] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <span aria-hidden="true" className="material-symbols-outlined text-2xl">
                warning
              </span>
            </div>
            <div>
              <h2
                id="deactivate-dialog-title"
                className="text-lg font-bold text-[#1C2928]"
              >
                {poiManagementEn.deactivateTitle}
              </h2>
              <p className="text-xs text-[#5B6E69]">
                POI #{poi.id} — {poi.name}
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="max-h-[75vh] overflow-y-auto px-6 py-5 space-y-5 text-sm">
          {/* Outcome notice */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 leading-relaxed">
            <div className="flex items-start gap-2">
              <span aria-hidden="true" className="material-symbols-outlined text-base text-amber-700 shrink-0 mt-0.5">
                info
              </span>
              <span>{poiManagementEn.deactivateOutcomeNotice}</span>
            </div>
          </div>

          {/* Concurrency notification banner (6.a2) */}
          {concurrencyNotice && (
            <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-xs text-red-900">
              <div className="flex items-start gap-2 font-medium">
                <span aria-hidden="true" className="material-symbols-outlined text-base text-red-600 shrink-0 mt-0.5">
                  sync_problem
                </span>
                <span>{poiManagementEn.concurrencyNotice}</span>
              </div>
            </div>
          )}

          {/* References Section */}
          <div className="rounded-xl border border-[#DCE2DD] bg-[#FAFAF8] p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5B6E69]">
              {poiManagementEn.referencesHeader}
            </h3>

            {loadingReferences ? (
              <div className="flex items-center gap-2 py-3 text-xs text-[#5B6E69]">
                <span aria-hidden="true" className="material-symbols-outlined animate-spin text-base">
                  progress_activity
                </span>
                <span>{poiManagementEn.loadingReferences}</span>
              </div>
            ) : references ? (
              <>
                {references.hasActiveReferences ? (
                  <div role="note" className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-semibold text-red-800">
                    <span aria-hidden="true" className="material-symbols-outlined text-sm text-red-600">
                      link
                    </span>
                    <span>{poiManagementEn.msg194}</span>
                  </div>
                ) : (
                  <p className="text-xs text-[#5B6E69] italic">
                    {poiManagementEn.noReferencesNotice}
                  </p>
                )}

                <div className="grid grid-cols-3 gap-3 pt-1 text-center">
                  <div className="rounded-lg bg-white border border-[#DCE2DD] p-2.5">
                    <div className="text-base font-bold text-[#1C2928]">
                      {references.activeItinerariesCount}
                    </div>
                    <div className="text-[11px] text-[#5B6E69]">
                      {poiManagementEn.activeItinerariesLabel}
                    </div>
                  </div>

                  <div className="rounded-lg bg-white border border-[#DCE2DD] p-2.5">
                    <div className="text-base font-bold text-[#1C2928]">
                      {references.activeRoutesCount}
                    </div>
                    <div className="text-[11px] text-[#5B6E69]">
                      {poiManagementEn.activeRoutesLabel}
                    </div>
                  </div>

                  <div className="rounded-lg bg-white border border-[#DCE2DD] p-2.5">
                    <div className="text-base font-bold text-[#1C2928]">
                      {references.openCommercialBookingsCount}
                    </div>
                    <div className="text-[11px] text-[#5B6E69]">
                      {poiManagementEn.openBookingsLabel}
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>

          {/* Reason Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="deactivate-reason-input"
                className="text-xs font-bold text-[#1C2928]"
              >
                {poiManagementEn.reasonLabel} <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-[#5B6E69]">
                {reason.length}/500
              </span>
            </div>

            <textarea
              id="deactivate-reason-input"
              rows={3}
              value={reason}
              maxLength={500}
              placeholder={poiManagementEn.reasonPlaceholder}
              onChange={(e) => setReason(e.target.value)}
              required
              aria-describedby={reasonError ? "deactivate-reason-error" : undefined}
              disabled={isSubmitting}
              className={`w-full rounded-xl border p-3 text-xs text-[#1C2928] placeholder-[#5B6E69]/60 transition focus:outline-none focus:ring-2 ${
                reasonError
                  ? 'border-red-400 focus:ring-red-400'
                  : 'border-[#DCE2DD] focus:ring-[#174B4A]'
              }`}
            />

            {reasonError && (
              <p id="deactivate-reason-error" className="text-xs font-medium text-red-600">
                {reasonError}
              </p>
            )}
          </div>

          {submitError && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {submitError}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-[#DCE2DD] bg-[#F7F5EF] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-[#DCE2DD] bg-white px-4 py-2.5 text-xs font-semibold text-[#1C2928] transition hover:bg-[#F0EEE6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#174B4A]/30"
          >
            {poiManagementEn.cancel}
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting || loadingReferences || !references?.referenceSnapshotToken || !!reasonError}
            className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
          >
            {isSubmitting ? (
              <>
                <span aria-hidden="true" className="material-symbols-outlined animate-spin text-sm">
                  progress_activity
                </span>
                <span>{poiManagementEn.deactivating}</span>
              </>
            ) : (
              <span>{poiManagementEn.confirmDeactivate}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
