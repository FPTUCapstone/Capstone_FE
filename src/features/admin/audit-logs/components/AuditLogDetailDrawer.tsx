'use client';

import React, { useState, useEffect } from 'react';
import { AuditLogDetailDto } from '../types/auditLogAdmin';
import { getAuditLogDetail, AuditLogServiceError } from '../services/auditLogAdminService';

interface AuditLogDetailDrawerProps {
  logId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AuditLogDetailDrawer({ logId, isOpen, onClose }: AuditLogDetailDrawerProps) {
  const [detail, setDetail] = useState<AuditLogDetailDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedBefore, setCopiedBefore] = useState<boolean>(false);
  const [copiedAfter, setCopiedAfter] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || logId === null) {
      setDetail(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    getAuditLogDetail(logId)
      .then((data) => {
        if (isMounted) {
          setDetail(data);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          if (err instanceof AuditLogServiceError && (err.statusCode === 404 || err.errorCode === 'admin.audit_log_not_found')) {
            setError('System audit log entry not found. (MSG129)');
          } else if (err instanceof Error) {
            setError(err.message || 'Failed to load audit log details.');
          } else {
            setError('Failed to load audit log details.');
          }
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, logId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatJson = (dataStr: string | null) => {
    if (!dataStr) return null;
    try {
      const parsed = JSON.parse(dataStr);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return dataStr;
    }
  };

  const handleCopy = (text: string, type: 'before' | 'after') => {
    navigator.clipboard.writeText(text);
    if (type === 'before') {
      setCopiedBefore(true);
      setTimeout(() => setCopiedBefore(false), 2000);
    } else {
      setCopiedAfter(true);
      setTimeout(() => setCopiedAfter(false), 2000);
    }
  };

  const getRoleBadgeClass = (role: string | null) => {
    switch (role) {
      case 'Administrator':
        return 'bg-purple-900/40 text-purple-300 border-purple-700/50';
      case 'TourOperator':
        return 'bg-blue-900/40 text-blue-300 border-blue-700/50';
      case 'Traveler':
        return 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
      {/* Backdrop overlay click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-2xl border-l border-[#314863] bg-[#00152a] text-[#d1e4ff] shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#314863] bg-[#102a43]/90 px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-2xl text-[#71f8e4]">
                read_more
              </span>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  Audit Log Details
                  {logId && (
                    <span className="rounded bg-[#314863] px-2 py-0.5 font-mono text-xs text-[#71f8e4]">
                      #{logId}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-[#9edbd2]">UC-69 Detailed Event Audit Trail</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-[#314863] hover:text-white transition-colors"
              title="Close (ESC)"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                <span className="material-symbols-outlined text-4xl animate-spin text-[#71f8e4]">
                  progress_activity
                </span>
                <p className="text-sm font-medium">Fetching log entry details...</p>
              </div>
            ) : error ? (
              <div className="rounded-xl border border-red-800/60 bg-red-950/40 p-5 text-red-200 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-red-400">
                  <span className="material-symbols-outlined text-xl">error</span>
                  <span>Unable to Load Log Details</span>
                </div>
                <p className="text-sm text-red-300">{error}</p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-3 rounded-lg border border-red-700 bg-red-900/40 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-800"
                >
                  Close Drawer
                </button>
              </div>
            ) : detail ? (
              <>
                {/* Event Overview Card */}
                <div className="rounded-xl border border-[#314863] bg-[#102a43]/50 p-4 space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#9edbd2]">
                    Event Info
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block mb-1">Action Type</span>
                      <span className="inline-block rounded border border-[#71f8e4]/30 bg-[#71f8e4]/10 px-2.5 py-1 font-semibold text-[#71f8e4]">
                        {detail.actionType}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">IP Address</span>
                      <span className="font-mono text-slate-200">
                        {detail.ipAddress || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">Timestamp (UTC+7)</span>
                      <span className="font-mono text-slate-200 font-semibold">
                        {detail.createdAtLocal}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">Timestamp (UTC)</span>
                      <span className="font-mono text-slate-400">
                        {new Date(detail.createdAtUtc).toISOString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actor Card */}
                <div className="rounded-xl border border-[#314863] bg-[#102a43]/50 p-4 space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#9edbd2]">
                    Actor Details
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block mb-1">Actor Name</span>
                      {detail.actorUserId === null ? (
                        <span className="inline-flex items-center gap-1 rounded border border-slate-600 bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-300">
                          <span className="material-symbols-outlined text-xs">settings</span>
                          System
                        </span>
                      ) : (
                        <span className="font-semibold text-slate-200 text-sm">
                          {detail.actorFullName}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">Role</span>
                      {detail.actorRole ? (
                        <span className={`inline-block rounded border px-2 py-0.5 text-xs font-medium ${getRoleBadgeClass(detail.actorRole)}`}>
                          {detail.actorRole}
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">Email</span>
                      <span className="text-slate-300">
                        {detail.actorEmail || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">User ID</span>
                      <span className="font-mono text-slate-300">
                        {detail.actorUserId ?? 'System Action'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Affected Entity Card */}
                <div className="rounded-xl border border-[#314863] bg-[#102a43]/50 p-4 space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#9edbd2]">
                    Target Object
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block mb-1">Affected Entity</span>
                      <span className="font-medium text-slate-200">
                        {detail.affectedEntity}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">Entity ID</span>
                      <span className="font-mono text-slate-300 font-semibold">
                        {detail.affectedEntityId ?? 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Before & After State Changes */}
                <div className="space-y-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#9edbd2] flex items-center justify-between">
                    <span>State Audit Data</span>
                  </div>

                  {/* Before Data */}
                  <div className="rounded-xl border border-[#314863] bg-[#00152a] overflow-hidden">
                    <div className="flex items-center justify-between border-b border-[#314863] bg-[#102a43]/70 px-4 py-2.5 text-xs">
                      <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base">history</span>
                        Before Data State
                      </span>
                      {detail.beforeData && (
                        <button
                          type="button"
                          onClick={() => handleCopy(formatJson(detail.beforeData) || '', 'before')}
                          className="flex items-center gap-1 rounded bg-[#314863]/60 px-2 py-1 text-[11px] text-[#71f8e4] hover:bg-[#314863] transition-colors"
                        >
                          <span className="material-symbols-outlined text-xs">
                            {copiedBefore ? 'check' : 'content_copy'}
                          </span>
                          {copiedBefore ? 'Copied' : 'Copy'}
                        </button>
                      )}
                    </div>
                    <div className="p-4">
                      {detail.beforeData ? (
                        <pre className="overflow-x-auto font-mono text-xs text-amber-200/90 whitespace-pre-wrap break-all bg-black/40 p-3 rounded-lg border border-amber-900/30">
                          {formatJson(detail.beforeData)}
                        </pre>
                      ) : (
                        <p className="text-xs italic text-slate-500 py-1">(No prior state record)</p>
                      )}
                    </div>
                  </div>

                  {/* After Data */}
                  <div className="rounded-xl border border-[#314863] bg-[#00152a] overflow-hidden">
                    <div className="flex items-center justify-between border-b border-[#314863] bg-[#102a43]/70 px-4 py-2.5 text-xs">
                      <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base">update</span>
                        After Data State
                      </span>
                      {detail.afterData && (
                        <button
                          type="button"
                          onClick={() => handleCopy(formatJson(detail.afterData) || '', 'after')}
                          className="flex items-center gap-1 rounded bg-[#314863]/60 px-2 py-1 text-[11px] text-[#71f8e4] hover:bg-[#314863] transition-colors"
                        >
                          <span className="material-symbols-outlined text-xs">
                            {copiedAfter ? 'check' : 'content_copy'}
                          </span>
                          {copiedAfter ? 'Copied' : 'Copy'}
                        </button>
                      )}
                    </div>
                    <div className="p-4">
                      {detail.afterData ? (
                        <pre className="overflow-x-auto font-mono text-xs text-emerald-200/90 whitespace-pre-wrap break-all bg-black/40 p-3 rounded-lg border border-emerald-900/30">
                          {formatJson(detail.afterData)}
                        </pre>
                      ) : (
                        <p className="text-xs italic text-slate-500 py-1">(No post state record)</p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>

          {/* Footer */}
          <div className="border-t border-[#314863] bg-[#102a43]/90 px-6 py-3.5 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#314863] bg-[#00152a] px-4 py-2 text-xs font-semibold text-slate-200 hover:border-[#71f8e4] hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
