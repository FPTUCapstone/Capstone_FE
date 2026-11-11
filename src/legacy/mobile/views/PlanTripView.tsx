import React, { useState } from 'react';
import { ASSETS, defaultUser } from '@/data/mockData';
import { AppView } from '@/legacy/mobile/types';

interface PlanTripViewProps {
  onNavigate: (view: AppView) => void;
  onOpenNewTripModal?: () => void;
}

export const PlanTripView: React.FC<PlanTripViewProps> = ({ onNavigate, onOpenNewTripModal }) => {
  const [selectedPace, setSelectedPace] = useState(defaultUser.pace);
  const [interests, setInterests] = useState(defaultUser.interests);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const toggleInterest = (tag: string) => {
    if (interests.includes(tag)) {
      setInterests(interests.filter(i => i !== tag));
    } else {
      setInterests([...interests, tag]);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#1C2928] pb-24 md:pb-12">
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">
        {/* Header & Main CTA */}
        <section className="mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#1C2928] tracking-tight mb-2">
              Bắt đầu hành trình mới
            </h1>
            <p className="text-base text-[#5B6E69]">
              Khám phá thế giới với Atlas Du lịch Thông minh và thuật toán tối ưu hóa đa điểm dừng.
            </p>
          </div>
          
          <button
            onClick={() => onOpenNewTripModal ? onOpenNewTripModal() : onNavigate('suggested-itinerary')}
            className="bg-[#B96D4C] hover:bg-[#f4511e] text-white font-bold text-base px-8 py-3.5 rounded-full flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all w-full md:w-auto"
          >
            <span className="material-symbols-outlined text-xl">add_circle</span>
            Lên kế hoạch chuyến đi
          </button>
        </section>

        {/* 2 Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Column: Upcoming Itinerary & Recent Destinations */}
          <div className="md:col-span-8 flex flex-col gap-8">
            {/* Upcoming Itinerary Preview */}
            <section className="bg-white border border-[#DCE2DD] rounded-2xl p-6 relative overflow-hidden shadow-xs">
              <div className="absolute left-[39px] top-8 bottom-8 w-[4px] bg-[#174B4A]/30 rounded-full z-0" />
              
              <h2 className="text-xl font-bold text-[#1C2928] mb-6 flex items-center gap-2 z-10 relative">
                <span className="material-symbols-outlined text-[#174B4A]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  flight_takeoff
                </span>
                Chuyến đi sắp tới
              </h2>

              <div className="flex flex-col gap-6 relative z-10">
                {/* Node 1 */}
                <div 
                  onClick={() => onNavigate('suggested-itinerary')}
                  className="flex items-start gap-5 group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-[#174B4A] text-white flex items-center justify-center shrink-0 shadow-sm border-2 border-white group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-xl">hotel</span>
                  </div>
                  <div className="bg-[#F7F5EF] border border-[#DCE2DD] p-4 rounded-xl flex-grow group-hover:border-[#174B4A] transition-colors shadow-xs">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-base text-[#1C2928] group-hover:text-[#174B4A] transition-colors">
                        Nhận phòng khách sạn
                      </h3>
                      <span className="text-xs font-semibold text-[#5B6E69] bg-[#DCE2DD] px-2.5 py-1 rounded-md">
                        14:00
                      </span>
                    </div>
                    <p className="text-sm text-[#5B6E69]">La Siesta Premium Hang Be, Hà Nội</p>
                  </div>
                </div>

                {/* Node 2 */}
                <div 
                  onClick={() => onNavigate('suggested-itinerary')}
                  className="flex items-start gap-5 group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-[#e6e8eb] text-[#1C2928] flex items-center justify-center shrink-0 border-2 border-white group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-xl">restaurant</span>
                  </div>
                  <div className="bg-[#F7F5EF] border border-[#DCE2DD] p-4 rounded-xl flex-grow group-hover:border-[#174B4A] transition-colors shadow-xs">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-base text-[#1C2928] group-hover:text-[#174B4A] transition-colors">
                        Ăn tối - Phở Gia Truyền
                      </h3>
                      <span className="text-xs font-semibold text-[#5B6E69] bg-[#DCE2DD] px-2.5 py-1 rounded-md">
                        19:00
                      </span>
                    </div>
                    <p className="text-sm text-[#5B6E69]">Khám phá ẩm thực phố cổ Bát Đàn</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Recent Destinations */}
            <section>
              <h2 className="text-xl font-bold text-[#1C2928] mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#174B4A]">history</span>
                Điểm đến gần đây
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Dest 1: Hanoi */}
                <div 
                  onClick={() => onNavigate('suggested-itinerary')}
                  className="group relative rounded-2xl overflow-hidden aspect-[4/3] cursor-pointer shadow-sm border border-[#DCE2DD]"
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                    style={{ backgroundImage: `url('${ASSETS.hanoiStreetOld}')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1C2928]/90 via-[#1C2928]/30 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="text-lg font-bold">Hà Nội</h3>
                    <p className="text-xs text-[#b0c9e8]">3 ngày trước</p>
                  </div>
                </div>

                {/* Dest 2: Da Nang */}
                <div 
                  onClick={() => onNavigate('reroute-proposal')}
                  className="group relative rounded-2xl overflow-hidden aspect-[4/3] cursor-pointer shadow-sm border border-[#DCE2DD]"
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                    style={{ backgroundImage: `url('${ASSETS.daNangBridge}')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1C2928]/90 via-[#1C2928]/30 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold">Đà Nẵng</h3>
                      <span className="w-2 h-2 rounded-full bg-[#B96D4C] animate-pulse" />
                    </div>
                    <p className="text-xs text-[#ffdad4]">Tháng trước • Có cảnh báo</p>
                  </div>
                </div>

                {/* Dest 3: Hoi An */}
                <div 
                  onClick={() => onNavigate('suggested-itinerary')}
                  className="group relative rounded-2xl overflow-hidden aspect-[4/3] cursor-pointer shadow-sm border border-[#DCE2DD]"
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                    style={{ backgroundImage: `url('${ASSETS.hoiAnLanterns}')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1C2928]/90 via-[#1C2928]/30 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="text-lg font-bold">Hội An</h3>
                    <p className="text-xs text-[#b0c9e8]">2 tháng trước</p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Preferences Panel */}
          <div className="md:col-span-4 flex flex-col gap-6">
            <section className="bg-[#103B39] text-white p-6 rounded-2xl shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-36 h-36 bg-[#174B4A]/30 rounded-full blur-2xl -mr-10 -mt-10" />

              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#71f8e4]">tune</span>
                Tùy chọn đã lưu
              </h2>

              <div className="space-y-6">
                {/* Pace */}
                <div>
                  <p className="text-xs font-semibold text-[#7a92b0] uppercase tracking-wider mb-2">
                    Nhịp độ (Pace)
                  </p>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[#71f8e4]">
                      <span className="material-symbols-outlined text-lg">nature_people</span>
                    </div>
                    <span className="text-base font-semibold text-white">{selectedPace}</span>
                  </div>

                  {isEditingProfile && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {['Thong thả', 'Cân bằng', 'Nhanh'].map((p) => (
                        <button
                          key={p}
                          onClick={() => setSelectedPace(p)}
                          className={`text-xs py-1.5 px-2 rounded-lg font-medium transition-all ${
                            selectedPace === p ? 'bg-[#174B4A] text-white' : 'bg-white/10 text-[#b0c9e8]'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Interests */}
                <div>
                  <p className="text-xs font-semibold text-[#7a92b0] uppercase tracking-wider mb-2">
                    Sở thích (Interests)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {interests.map((tag) => (
                      <span
                        key={tag}
                        className="bg-[#5B6E69] text-[#d1e4ff] px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 border border-[#103B39]"
                      >
                        <span className="material-symbols-outlined text-[15px]">
                          {tag === 'Văn hóa' ? 'museum' : tag === 'Ẩm thực' ? 'restaurant_menu' : 'photo_camera'}
                        </span>
                        {tag}
                      </span>
                    ))}
                  </div>

                  {isEditingProfile && (
                    <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-white/10">
                      {['Văn hóa', 'Ẩm thực', 'Nhiếp ảnh', 'Thiên nhiên', 'Mua sắm', 'Lịch sử'].map((tag) => (
                        <button
                          key={tag}
                          onClick={() => toggleInterest(tag)}
                          className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                            interests.includes(tag)
                              ? 'bg-[#71f8e4] text-[#00201c] border-[#71f8e4] font-bold'
                              : 'border-white/20 text-[#b0c9e8] hover:bg-white/5'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3">
                <button
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className="w-full border border-[#71f8e4] text-[#71f8e4] hover:bg-[#71f8e4] hover:text-[#1C2928] transition-colors py-2.5 rounded-xl text-xs font-bold"
                >
                  {isEditingProfile ? 'Lưu thay đổi' : 'Chỉnh sửa hồ sơ'}
                </button>

                <button
                  onClick={() => onNavigate('suggested-itinerary')}
                  className="w-full bg-[#B96D4C] hover:bg-[#f4511e] text-white py-2.5 rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                  Tạo lộ trình tối ưu CSP
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};
