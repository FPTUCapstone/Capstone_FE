import React, { useState } from 'react';

/** Legacy visual reference for the Flutter Traveler SOS flow. */

interface SosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SosModal: React.FC<SosModalProps> = ({ isOpen, onClose }) => {
  const [broadcasted, setBroadcasted] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#00152a]/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#330000] border border-[#e96755] rounded-3xl max-w-md w-full p-6 text-white shadow-2xl relative animate-scale-in">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center animate-pulse">
              <span className="material-symbols-outlined text-2xl">emergency</span>
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-white">Hỗ Trợ Khẩn Cấp (SOS)</h3>
              <p className="text-xs text-[#ffdad4]">Hệ thống TripMate Sentinel đang phát tín hiệu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="bg-[#5a0000] border border-[#e96755]/40 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between text-xs text-[#ffdad4] mb-2">
            <span>Tọa độ hiện tại:</span>
            <span className="font-mono font-bold text-white">21.0285° N, 105.8542° E</span>
          </div>
          <div className="flex items-center justify-between text-xs text-[#ffdad4]">
            <span>Vị trí:</span>
            <span className="font-bold text-[#71f8e4]">Phố Hàng Bạc, Hoàn Kiếm, Hà Nội</span>
          </div>
        </div>

        {/* Quick Dial Buttons */}
        <div className="space-y-3 mb-6">
          <a
            href="tel:115"
            className="flex items-center justify-between p-3.5 bg-[#ba1a1a] hover:bg-[#93000a] text-white rounded-xl font-bold text-sm transition-colors shadow-md"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-2xl">local_hospital</span>
              <span>115 - Cấp cứu y tế</span>
            </div>
            <span className="material-symbols-outlined text-xl">call</span>
          </a>

          <a
            href="tel:113"
            className="flex items-center justify-between p-3.5 bg-[#102a43] hover:bg-[#314863] text-white rounded-xl font-bold text-sm transition-colors border border-[#314863]"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-2xl">local_police</span>
              <span>113 - Cảnh sát phản ứng nhanh</span>
            </div>
            <span className="material-symbols-outlined text-xl">call</span>
          </a>
        </div>

        {/* Broadcast to Trip Guide */}
        <button
          onClick={() => setBroadcasted(true)}
          className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            broadcasted
              ? 'bg-[#006b5f] text-white'
              : 'bg-[#ff7043] hover:bg-[#f4511e] text-white shadow-md'
          }`}
        >
          <span className="material-symbols-outlined text-base">
            {broadcasted ? 'check_circle' : 'sensors'}
          </span>
          {broadcasted ? 'Đã gửi tọa độ tới Ban Điều Hành & HDV' : 'Gửi định vị SOS tới Ban Quản Lý Tour'}
        </button>
      </div>
    </div>
  );
};
