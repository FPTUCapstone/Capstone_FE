import React from 'react';
import { adminUserAccountsEn } from '../resources/en';

export function UserAccountSafetyTimeline() {
  const timelineCopy = adminUserAccountsEn.directory.timeline;
  const advisoryCopy = adminUserAccountsEn.directory.advisory;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Operational Safety Log Nodes */}
      <div className="space-y-4 rounded-xl bg-white p-6 shadow-xs border border-[#e2e8f0] lg:col-span-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px] text-[#006b5f]">
              route
            </span>
            <h2 className="text-lg font-bold text-[#00152a]">
              {timelineCopy.title}
            </h2>
          </div>
          <span className="rounded-full bg-[#9cefdf]/40 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-[#0b6f63]">
            {timelineCopy.badge}
          </span>
        </div>

        <div className="relative space-y-6 pl-6 before:absolute before:bottom-2 before:left-2 before:top-2 before:w-[2px] before:bg-[#eceef1]">
          {/* Node 1 */}
          <div className="relative">
            <div className="absolute -left-[23px] top-1 h-3.5 w-3.5 rounded-full bg-white ring-4 ring-[#ba1a1a]" />
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
              <span className="text-sm font-semibold text-[#00152a]">
                {timelineCopy.node1Title}
              </span>
              <span className="text-xs text-[#64748b]">{timelineCopy.node1Time}</span>
            </div>
            <p className="mt-0.5 text-xs text-[#43474d]">{timelineCopy.node1Desc}</p>
          </div>

          {/* Node 2 */}
          <div className="relative">
            <div className="absolute -left-[23px] top-1 h-3.5 w-3.5 rounded-full bg-white ring-4 ring-[#006b5f]" />
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
              <span className="text-sm font-semibold text-[#00152a]">
                {timelineCopy.node2Title}
              </span>
              <span className="text-xs text-[#64748b]">{timelineCopy.node2Time}</span>
            </div>
            <p className="mt-0.5 text-xs text-[#43474d]">{timelineCopy.node2Desc}</p>
          </div>
        </div>
      </div>

      {/* Security Advisory Card */}
      <div className="flex flex-col justify-between space-y-4 rounded-xl bg-[#f2f4f7] p-6 shadow-xs border border-[#e2e8f0]">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-base font-bold text-[#00152a]">
            <span className="material-symbols-outlined text-[#006b5f]">shield</span>
            <span>{advisoryCopy.title}</span>
          </div>
          <p className="text-xs leading-relaxed text-[#43474d]">
            {advisoryCopy.description}
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-lg bg-white p-3.5 border border-[#e2e8f0]">
          <span className="material-symbols-outlined text-[24px] text-[#00152a]">
            verified
          </span>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-[#00152a]">
              {advisoryCopy.isoBadgeTitle}
            </span>
            <span className="text-[11px] text-[#64748b]">
              {advisoryCopy.isoBadgeSubtitle}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
