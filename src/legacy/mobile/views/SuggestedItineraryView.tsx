import React, { useState } from 'react';
import { ASSETS, hanoiSuggestedItinerary } from '@/data/mockData';
import { AppView } from '@/legacy/mobile/types';
import { ItineraryNode } from '@/types';

interface SuggestedItineraryViewProps {
  onNavigate: (view: AppView) => void;
}

export const SuggestedItineraryView: React.FC<SuggestedItineraryViewProps> = ({ onNavigate }) => {
  const nodes: ItineraryNode[] = hanoiSuggestedItinerary;
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node-1');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleRegenerate = () => {
    setIsRegenerating(true);
    setToastMessage('Đang tính toán lại với thuật toán CSP...');
    setTimeout(() => {
      setIsRegenerating(false);
      setToastMessage('Đã tối ưu lại lộ trình: Tiết kiệm thêm 15 phút di chuyển!');
      setTimeout(() => setToastMessage(null), 3000);
    }, 1000);
  };

  const handleAccept = () => {
    onNavigate('live-nav');
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#191c1e] flex flex-col pb-20 md:pb-6">
      {/* Top Bar / Header */}
      <div className="bg-white border-b border-[#c3c6ce] px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-[#006b5f] bg-[#6df5e1]/30 px-2.5 py-0.5 rounded-full">
                CSP Constraint Optimized
              </span>
              <span className="text-xs text-[#43474d]">Thứ Tư, 24 Tháng 5</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#00152a] tracking-tight">
              Hà Nội Khám Phá
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-[#00152a] text-white px-3.5 py-2 rounded-xl flex items-center gap-2 font-mono font-bold text-sm shadow-xs">
              <span className="material-symbols-outlined text-[18px] text-[#71f8e4]">radar</span>
              95% Match
            </div>
            <button
              onClick={handleAccept}
              className="bg-[#006b5f] hover:bg-[#005048] text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-xs transition-colors"
            >
              <span className="material-symbols-outlined text-lg">play_arrow</span>
              Bắt đầu Live
            </button>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="bg-[#006b5f] text-white text-center py-2 px-4 text-xs font-semibold animate-fade-in shadow-xs">
          {toastMessage}
        </div>
      )}

      {/* Main Content: Split Layout */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Itinerary Timeline */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="bg-white border border-[#c3c6ce] rounded-2xl p-5 md:p-6 shadow-xs flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-[#00152a] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006b5f]">timeline</span>
                Lịch trình chi tiết
              </h2>
              <span className="text-xs text-[#74777e] font-medium">3 điểm dừng • 3.5 giờ</span>
            </div>

            {/* Route Ribbon Timeline */}
            <div className="relative flex-1 space-y-6 ml-2">
              {/* Vertical Ribbon Line */}
              <div className="absolute left-[19px] top-4 bottom-8 w-[3px] bg-[#c3c6ce] z-0" />

              {nodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`relative flex items-start gap-4 cursor-pointer group transition-all`}
                  >
                    {/* Node Pin Marker */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 border-2 transition-all ${
                        isSelected
                          ? 'bg-[#006b5f] text-white border-white shadow-md scale-105'
                          : 'bg-[#f7f9fc] text-[#43474d] border-[#c3c6ce] group-hover:border-[#006b5f]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">
                        {node.icon || 'place'}
                      </span>
                    </div>

                    {/* Card Content */}
                    <div
                      className={`flex-1 rounded-xl p-4 border transition-all ${
                        isSelected
                          ? 'bg-[#f7f9fc] border-[#006b5f] shadow-xs'
                          : 'bg-white border-[#c3c6ce] group-hover:border-[#74777e]'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <span className="text-[11px] font-semibold text-[#006b5f] uppercase tracking-wider">
                            {node.category}
                          </span>
                          <h3 className="font-bold text-base text-[#00152a] group-hover:text-[#006b5f] transition-colors">
                            {node.title}
                          </h3>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-[#00152a] block">
                            {node.time}
                          </span>
                          <span className="text-[11px] text-[#74777e]">{node.duration}</span>
                        </div>
                      </div>

                      <p className="text-xs text-[#43474d] leading-relaxed mt-2">
                        {node.description}
                      </p>

                      {isSelected && (
                        <div className="mt-3 pt-3 border-t border-[#c3c6ce]/60 flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#006b5f] flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">verified</span>
                            TripMatch: {node.matchScore}%
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigate('live-nav');
                            }}
                            className="text-xs font-bold text-white bg-[#006b5f] hover:bg-[#005048] px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                          >
                            Điều hướng đến đây
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="mt-8 pt-5 border-t border-[#c3c6ce] flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="flex-1 bg-[#eceef1] hover:bg-[#e0e3e6] text-[#00152a] font-semibold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-[#c3c6ce]"
              >
                <span className={`material-symbols-outlined text-base ${isRegenerating ? 'animate-spin' : ''}`}>
                  refresh
                </span>
                {isRegenerating ? 'Đang tối ưu...' : 'Tạo lại theo sở thích'}
              </button>

              <button
                onClick={handleAccept}
                className="flex-1 bg-[#ff7043] hover:bg-[#f4511e] text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <span className="material-symbols-outlined text-base">check_circle</span>
                Chấp nhận lộ trình này
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Vector Map Preview */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="relative bg-[#eceef1] rounded-2xl border border-[#c3c6ce] overflow-hidden flex-1 min-h-[460px] shadow-xs flex flex-col">
            {/* Background Map Imagery */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url('${ASSETS.hanoiSuggestedMapBg}')` }}
            />
            
            {/* Dark/Light overlay */}
            <div className="absolute inset-0 bg-[#00152a]/10 pointer-events-none" />

            {/* Map Header Floating Badge */}
            <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-sm px-3.5 py-2 rounded-xl border border-[#c3c6ce] shadow-xs flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#006b5f] animate-pulse" />
              <span className="text-xs font-bold text-[#00152a]">Hà Nội • Khu vực Hoàn Kiếm & Ba Đình</span>
            </div>

            {/* Simulated Interactive Map Markers */}
            <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
              {/* Marker 1 */}
              <div className="absolute top-[32%] left-[45%] pointer-events-auto cursor-pointer transform -translate-x-1/2 -translate-y-1/2 group">
                <div className="bg-[#006b5f] text-white font-bold text-xs px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1 border border-white group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[14px]">restaurant</span>
                  Bún Chả Hương Liên
                </div>
              </div>

              {/* Marker 2 */}
              <div className="absolute top-[52%] left-[30%] pointer-events-auto cursor-pointer transform -translate-x-1/2 -translate-y-1/2 group">
                <div className="bg-[#00152a] text-white font-bold text-xs px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1 border border-white group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[14px]">account_balance</span>
                  Văn Miếu
                </div>
              </div>

              {/* Marker 3 */}
              <div className="absolute top-[68%] left-[62%] pointer-events-auto cursor-pointer transform -translate-x-1/2 -translate-y-1/2 group">
                <div className="bg-[#00152a] text-white font-bold text-xs px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1 border border-white group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[14px]">fastfood</span>
                  Bánh Mì Phượng
                </div>
              </div>
            </div>

            {/* Map Controls */}
            <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
              <button className="w-9 h-9 bg-white hover:bg-[#f7f9fc] rounded-lg shadow-sm border border-[#c3c6ce] flex items-center justify-center text-[#00152a]">
                <span className="material-symbols-outlined text-lg">add</span>
              </button>
              <button className="w-9 h-9 bg-white hover:bg-[#f7f9fc] rounded-lg shadow-sm border border-[#c3c6ce] flex items-center justify-center text-[#00152a]">
                <span className="material-symbols-outlined text-lg">remove</span>
              </button>
              <button 
                onClick={() => onNavigate('live-nav')}
                className="w-9 h-9 bg-[#006b5f] hover:bg-[#005048] rounded-lg shadow-sm text-white flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-lg">my_location</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
