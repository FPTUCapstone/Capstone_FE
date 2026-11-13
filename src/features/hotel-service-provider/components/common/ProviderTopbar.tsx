'use client';

import React from 'react';
import LogoutButton from '@/components/LogoutButton';

interface ProviderTopbarProps {
  onOpenMobileSidebar: () => void;
}

export function ProviderTopbar({ onOpenMobileSidebar }: ProviderTopbarProps) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-14 px-4 sm:px-6 bg-white/95 border-b border-[#DCE2DD] shadow-xs backdrop-blur-md">
      {/* Left: Mobile hamburger & breadcrumb or context */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="p-1.5 rounded-lg text-[#5B6E69] hover:text-[#1C2928] hover:bg-[#F7F5EF] md:hidden cursor-pointer"
          aria-label="Open sidebar menu"
        >
          <span className="material-symbols-outlined text-[20px]">menu</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-[#E8F7F4] text-[#174B4A] border border-[#B2DFDB] rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0E9F6E]" aria-hidden="true" />
            <span className="truncate max-w-[220px] sm:max-w-xs">
              Hội An Riverside Heritage Resort
            </span>
          </span>
          <span className="hidden sm:inline-block text-xs text-[#5B6E69] font-medium">
            (Hotel Operations)
          </span>
        </div>
      </div>

      {/* Right: User identity & actions */}
      <div className="flex items-center gap-3">
        {/* Notification indicator */}
        <button
          type="button"
          className="p-1.5 text-[#5B6E69] hover:text-[#1C2928] hover:bg-[#F7F5EF] rounded-lg transition-colors cursor-pointer relative"
          aria-label="Notifications"
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#B96D4C]" />
        </button>

        <div className="h-5 w-px bg-[#DCE2DD]" aria-hidden="true" />

        {/* User Info */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#174B4A] text-white flex items-center justify-center text-xs font-bold uppercase shrink-0">
            LT
          </div>
          <div className="hidden sm:flex flex-col text-left leading-tight">
            <span className="text-xs font-bold text-[#1C2928]">Trần Thị Lan</span>
            <span className="text-[10px] text-[#5B6E69]">Reception / Partner</span>
          </div>
        </div>

        <LogoutButton />
      </div>
    </header>
  );
}
