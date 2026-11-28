'use client';

import React, { useState } from 'react';
import { CommissionStatementsView } from '@/features/hotel-service-provider/components/w105/CommissionStatementsView';
import { CommissionReconciliationView } from '@/features/hotel-service-provider/components/w106/CommissionReconciliationView';
import { ToastProvider } from '@/features/hotel-service-provider/components/common/Toast';
import { ProviderStatementService } from '@/features/hotel-service-provider/services/providerStatementService';
import { StaffReconciliationService } from '@/features/hotel-service-provider/services/staffReconciliationService';

export default function CommissionPreviewPage() {
  const [activeTab, setActiveTab] = useState<'w105' | 'w106'>('w105');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleResetData = () => {
    ProviderStatementService.resetState();
    StaffReconciliationService.resetState();
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#1C2928] p-4 sm:p-6 lg:p-8">
      {/* Dev Header & Switcher Bar */}
      <div className="max-w-7xl mx-auto mb-6 bg-white border border-[#DCE2DD] rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-[#174B4A] text-white rounded">
              Interactive Test Console
            </span>
            <span className="text-xs text-[#5B6E69] font-mono">TM-226 (UC-81-83)</span>
          </div>
          <h1 className="text-lg font-bold text-[#1C2928] mt-1">
            Kiểm thử giao diện trực tiếp: Bảng kê hoa hồng & Đối soát ngân hàng
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex p-1 bg-[#F7F5EF] border border-[#DCE2DD] rounded-xl text-xs font-semibold">
            <button
              type="button"
              id="tab-btn-w105"
              onClick={() => setActiveTab('w105')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'w105'
                  ? 'bg-[#174B4A] text-white shadow-xs'
                  : 'text-[#5B6E69] hover:text-[#1C2928]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">receipt_long</span>
              <span>W105: Đối tác (Screen 105)</span>
            </button>
            <button
              type="button"
              id="tab-btn-w106"
              onClick={() => setActiveTab('w106')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'w106'
                  ? 'bg-[#174B4A] text-white shadow-xs'
                  : 'text-[#5B6E69] hover:text-[#1C2928]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">verified</span>
              <span>W106: Nhân viên đối soát (Screen 106)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetData}
            title="Đặt lại dữ liệu ban đầu"
            className="p-2 border border-[#DCE2DD] hover:bg-[#F7F5EF] rounded-xl text-[#5B6E69] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] block">refresh</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Frame */}
      <div className="max-w-7xl mx-auto">
        <ToastProvider>
          <div key={refreshKey} className="transition-all duration-200">
            {activeTab === 'w105' ? (
              <div className="bg-[#FAF9F5] border border-[#E8ECE9] rounded-2xl p-6 shadow-sm">
                <CommissionStatementsView />
              </div>
            ) : (
              <div className="bg-[#FAF9F5] border border-[#E8ECE9] rounded-2xl p-6 shadow-sm">
                <CommissionReconciliationView preview />
              </div>
            )}
          </div>
        </ToastProvider>
      </div>
    </div>
  );
}
