import React, { useState } from 'react';
import { AppView } from '@/legacy/mobile/types';

interface NewTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanCreated: (view: AppView) => void;
}

export const NewTripModal: React.FC<NewTripModalProps> = ({ isOpen, onClose, onPlanCreated }) => {
  const [destination, setDestination] = useState('Hà Nội');
  const [days, setDays] = useState('1');
  const [pace, setPace] = useState('Thong thả');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['Văn hóa', 'Ẩm thực']);

  if (!isOpen) return null;

  const toggleInterest = (tag: string) => {
    if (selectedInterests.includes(tag)) {
      setSelectedInterests(selectedInterests.filter(t => t !== tag));
    } else {
      setSelectedInterests([...selectedInterests, tag]);
    }
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
    onPlanCreated('suggested-itinerary');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#00152a]/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-[#c3c6ce] rounded-3xl max-w-lg w-full p-6 text-[#191c1e] shadow-2xl relative animate-scale-in">
        <div className="flex justify-between items-start mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#6df5e1]/30 text-[#006b5f] flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">auto_awesome</span>
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-[#00152a]">Tạo Chuyến Đi Mới</h3>
              <p className="text-xs text-[#43474d]">Tối ưu hóa đa điểm dừng với thuật toán CSP</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#eceef1] hover:bg-[#e0e3e6] flex items-center justify-center text-[#43474d]"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-[#74777e] uppercase tracking-wider block mb-1">
              Điểm đến chính
            </label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full bg-[#f7f9fc] border border-[#c3c6ce] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#00152a] outline-none focus:border-[#006b5f]"
            >
              <option value="Hà Nội">Hà Nội (Phố Cổ, Ba Đình, Hồ Tây)</option>
              <option value="Đà Nẵng">Đà Nẵng (Bà Nà, Sơn Trà, Cầu Rồng)</option>
              <option value="Hội An">Hội An (Phố Cổ, Rừng Dừa Bảy Mẫu)</option>
              <option value="Sapa">Sa Pa (Fansipan, Cát Cát, Ô Quy Hồ)</option>
              <option value="Huế">Huế (Đại Nội, Lăng Tự Đức, Sông Hương)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#74777e] uppercase tracking-wider block mb-1">
                Thời gian (Ngày)
              </label>
              <input
                type="number"
                min="1"
                max="14"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="w-full bg-[#f7f9fc] border border-[#c3c6ce] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#00152a] outline-none focus:border-[#006b5f]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#74777e] uppercase tracking-wider block mb-1">
                Nhịp độ
              </label>
              <select
                value={pace}
                onChange={(e) => setPace(e.target.value)}
                className="w-full bg-[#f7f9fc] border border-[#c3c6ce] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#00152a] outline-none focus:border-[#006b5f]"
              >
                <option value="Thong thả">Thong thả (2-3 điểm/ngày)</option>
                <option value="Cân bằng">Cân bằng (3-4 điểm/ngày)</option>
                <option value="Năng động">Năng động (5+ điểm/ngày)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#74777e] uppercase tracking-wider block mb-1.5">
              Sở thích ưu tiên
            </label>
            <div className="flex flex-wrap gap-2">
              {['Văn hóa', 'Ẩm thực', 'Nhiếp ảnh', 'Thiên nhiên', 'Cafe & Chill', 'Lịch sử'].map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => toggleInterest(tag)}
                  className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-all ${
                    selectedInterests.includes(tag)
                      ? 'bg-[#006b5f] text-white border-[#006b5f]'
                      : 'bg-[#f7f9fc] text-[#43474d] border-[#c3c6ce] hover:border-[#74777e]'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#eceef1] hover:bg-[#e0e3e6] text-[#43474d] py-3 rounded-xl font-bold text-xs transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 bg-[#ff7043] hover:bg-[#f4511e] text-white py-3 rounded-xl font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">auto_fix_high</span>
              Tạo lộ trình ngay
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
