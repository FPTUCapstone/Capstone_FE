'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/routes';

interface AdminHeaderProps {
  onSave?: () => void;
  onCancel?: () => void;
  onSignOut?: () => void;
  submitting?: boolean;
  saveDisabled?: boolean;
}

export function AdminHeader({ onSave, onCancel, onSignOut, submitting, saveDisabled }: AdminHeaderProps) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      {/* Mobile Top Bar (Figma Node 122:741) */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#102a43] text-white px-4 h-16 flex items-center justify-between shadow-md border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-200 hover:bg-white/10 active:scale-95 transition"
            aria-label="Back"
          >
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-white tracking-tight">New POI</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-700/70 text-slate-300 border border-slate-600">
                Draft
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Catalogue / Points of Interest</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-200 hover:bg-white/10"
          aria-label="Menu"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>
      </header>

      {/* Mobile Drawer (Navigation Overlay) */}
      {drawerOpen ? (
        <div className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex">
          <div className="w-72 h-full bg-[#102a43] text-white p-5 flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#006b5f] text-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">explore</span>
                  </div>
                  <div>
                    <span className="font-bold tracking-tight text-white block text-sm">TripMate</span>
                    <span className="text-[10px] text-[#6df5e1] font-semibold tracking-wider uppercase">ADMIN CONSOLE</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                  aria-label="Close menu"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              <nav className="space-y-1 text-sm font-medium">
                <Link
                  href={ROUTES.admin.dashboard}
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-white/5"
                >
                  <span className="material-symbols-outlined text-slate-400 text-[20px]">dashboard</span>
                  Dashboard
                </Link>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-white/5 cursor-pointer">
                  <span className="material-symbols-outlined text-slate-400 text-[20px]">people</span>
                  Users
                </div>
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3">Catalogue</span>
                  <Link
                    href={ROUTES.admin.createPoi}
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 mt-1 rounded-xl bg-[#006b5f] text-white font-semibold shadow-xs"
                  >
                    <span className="material-symbols-outlined text-white text-[20px]">location_on</span>
                    Points of Interest
                  </Link>
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-white/5 cursor-pointer">
                    <span className="material-symbols-outlined text-slate-400 text-[20px]">map</span>
                    Tours
                  </div>
                </div>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-white/5 cursor-pointer">
                  <span className="material-symbols-outlined text-slate-400 text-[20px]">settings</span>
                  System
                </div>
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-700/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#00152a] text-white flex items-center justify-center text-xs font-bold">
                  AD
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Administrator</p>
                  <p className="text-[10px] text-slate-400">Active Session</p>
                </div>
              </div>
              {onSignOut ? (
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    onSignOut();
                  }}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
                  aria-label="Sign out"
                >
                  <span className="material-symbols-outlined text-[20px]">logout</span>
                </button>
              ) : null}
            </div>
          </div>
          <div className="flex-1" onClick={() => setDrawerOpen(false)} />
        </div>
      ) : null}

      {/* Desktop Header (Figma Node 122:2) */}
      <header className="hidden lg:flex fixed top-0 left-64 right-0 h-16 bg-white/90 backdrop-blur-xl shadow-xs z-40 items-center justify-between px-8 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <nav aria-label="Top Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Link href={ROUTES.admin.dashboard} className="hover:text-slate-900 transition-colors">
              Catalogue
            </Link>
            <span>/</span>
            <span className="hover:text-slate-900 transition-colors">Points of Interest</span>
            <span>/</span>
            <span className="text-slate-900 font-semibold">New POI</span>
          </nav>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            Draft
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saveDisabled || submitting}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#006b5f] text-white hover:bg-[#006b5f]/90 transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            <span>{submitting ? 'Saving...' : 'Save POI'}</span>
          </button>
          <div className="w-px h-6 bg-slate-200 mx-1"></div>
          <div className="w-8 h-8 rounded-full bg-[#00152a] flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-[18px]">person</span>
          </div>
        </div>
      </header>
    </>
  );
}
