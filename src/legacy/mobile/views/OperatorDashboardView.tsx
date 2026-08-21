import React, { useState } from 'react';
import { ASSETS, operatorBookings } from '@/data/mockData';
import { AppView } from '@/legacy/mobile/types';
import { TourBooking } from '@/types';

interface OperatorDashboardViewProps {
  onNavigate: (view: AppView) => void;
  onOpenPayout: () => void;
}

export const OperatorDashboardView: React.FC<OperatorDashboardViewProps> = ({ onNavigate, onOpenPayout }) => {
  const [bookings, setBookings] = useState<TourBooking[]>(operatorBookings);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const balance = '12.5M VND';

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch = b.tour.toLowerCase().includes(searchTerm.toLowerCase()) || b.client.toLowerCase().includes(searchTerm.toLowerCase()) || b.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'All' || b.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleUpdateStatus = (id: string, newStatus: 'Confirmed' | 'Cancelled') => {
    setBookings(bookings.map((b) => (b.id === id ? { ...b, status: newStatus } : b)));
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#191c1e] pb-24 md:pb-12">
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">
        {/* Header with Agency Branding */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#c3c6ce]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cover bg-center border-2 border-white shadow-sm shrink-0" style={{ backgroundImage: `url('${ASSETS.agencyLogo}')` }} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold text-[#00152a] tracking-tight">
                  Nguyen Travel
                </h1>
                <span className="bg-[#6df5e1]/40 text-[#006b5f] text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  Verified Operator
                </span>
              </div>
              <p className="text-sm text-[#43474d]">
                Bảng điều khiển quản lý tour, đơn đặt chỗ và dòng tiền của đối tác
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('admin-tour-review')}
              className="bg-[#eceef1] hover:bg-[#e0e3e6] text-[#00152a] px-4 py-2.5 rounded-xl text-xs font-bold transition-colors border border-[#c3c6ce] flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">post_add</span>
              Gửi Tour mới duyệt
            </button>
            
            <button
              onClick={onOpenPayout}
              className="bg-[#006b5f] hover:bg-[#005048] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">payments</span>
              Yêu cầu rút tiền
            </button>
          </div>
        </div>

        {/* 3 Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* KPI 1: Today's Tours */}
          <div className="bg-white border border-[#c3c6ce] rounded-2xl p-6 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#74777e] uppercase tracking-wider mb-1">
                Tour đang chạy hôm nay
              </p>
              <h3 className="text-3xl font-extrabold text-[#00152a]">8</h3>
              <p className="text-xs text-[#006b5f] font-semibold mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">trending_up</span>
                +2 so với hôm qua
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#6df5e1]/30 text-[#006b5f] flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">tour</span>
            </div>
          </div>

          {/* KPI 2: Pending Bookings */}
          <div className="bg-white border border-[#c3c6ce] rounded-2xl p-6 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#74777e] uppercase tracking-wider mb-1">
                Đơn chờ duyệt (Pending)
              </p>
              <h3 className="text-3xl font-extrabold text-[#ff7043]">14</h3>
              <p className="text-xs text-[#ba1a1a] font-semibold mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">priority_high</span>
                Cần phản hồi trong 2h
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#ffdad4] text-[#872015] flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">pending_actions</span>
            </div>
          </div>

          {/* KPI 3: Available Balance */}
          <div className="bg-[#00152a] text-white rounded-2xl p-6 shadow-md flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#b0c9e8] uppercase tracking-wider mb-1">
                Số dư khả dụng
              </p>
              <h3 className="text-3xl font-mono font-extrabold text-[#71f8e4]">{balance}</h3>
              <button 
                onClick={onOpenPayout}
                className="text-xs text-[#d1e4ff] hover:underline font-semibold mt-1 flex items-center gap-1"
              >
                Yêu cầu quyết toán ví &rarr;
              </button>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/10 text-[#71f8e4] flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
            </div>
          </div>
        </div>

        {/* Active Tours Real-Time Monitor */}
        <section className="mb-10 bg-white border border-[#c3c6ce] rounded-2xl p-6 shadow-xs">
          <h2 className="text-lg font-bold text-[#00152a] mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#006b5f]">radar</span>
            Theo dõi đoàn đang di chuyển
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tour A */}
            <div className="p-4 bg-[#f7f9fc] rounded-xl border border-[#c3c6ce] flex justify-between items-center">
              <div>
                <span className="text-xs font-semibold text-[#006b5f] bg-[#6df5e1]/30 px-2 py-0.5 rounded-md">
                  Vịnh Hạ Long
                </span>
                <h4 className="font-bold text-base text-[#00152a] mt-1">Ha Long Day Cruise 2D1N</h4>
                <p className="text-xs text-[#43474d]">34/40 khách • HDV: Trần Văn Bình</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-[#006b5f] bg-white px-2.5 py-1 rounded-full border border-[#6df5e1]">
                  Đúng tiến độ
                </span>
              </div>
            </div>

            {/* Tour B */}
            <div className="p-4 bg-[#f7f9fc] rounded-xl border border-[#c3c6ce] flex justify-between items-center">
              <div>
                <span className="text-xs font-semibold text-[#006b5f] bg-[#6df5e1]/30 px-2 py-0.5 rounded-md">
                  Miền Tây
                </span>
                <h4 className="font-bold text-base text-[#00152a] mt-1">Mekong Delta Eco Tour</h4>
                <p className="text-xs text-[#43474d]">18/20 khách • Khởi hành 08:30</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-[#ff7043] bg-white px-2.5 py-1 rounded-full border border-[#ff7043]">
                  Đang đón khách
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Bookings Table */}
        <section className="bg-white border border-[#c3c6ce] rounded-2xl p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold text-[#00152a] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006b5f]">table_chart</span>
              Danh sách đơn đặt chỗ
            </h2>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <span className="material-symbols-outlined text-lg absolute left-3 top-1/2 -translate-y-1/2 text-[#74777e]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Tìm theo mã hoặc khách..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#f7f9fc] border border-[#c3c6ce] pl-9 pr-3 py-1.5 rounded-xl text-xs outline-none focus:border-[#006b5f]"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-[#f7f9fc] border border-[#c3c6ce] px-3 py-1.5 rounded-xl text-xs font-medium text-[#00152a] outline-none"
              >
                <option value="All">Tất cả trạng thái</option>
                <option value="Pending">Chờ duyệt</option>
                <option value="Confirmed">Đã xác nhận</option>
                <option value="Cancelled">Đã hủy</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#c3c6ce] text-[#74777e] font-semibold">
                  <th className="pb-3">Mã đơn</th>
                  <th className="pb-3">Tour</th>
                  <th className="pb-3">Khách hàng</th>
                  <th className="pb-3">Trạng thái</th>
                  <th className="pb-3">Giá trị</th>
                  <th className="pb-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eceef1]">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-[#f7f9fc] transition-colors">
                    <td className="py-3.5 font-mono font-bold text-[#00152a]">{booking.id}</td>
                    <td className="py-3.5 font-semibold text-[#00152a]">{booking.tour}</td>
                    <td className="py-3.5 text-[#43474d]">{booking.client}</td>
                    <td className="py-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full font-semibold text-[11px] ${
                          booking.status === 'Confirmed'
                            ? 'bg-[#6df5e1]/30 text-[#006b5f]'
                            : booking.status === 'Pending'
                            ? 'bg-[#ffdad4] text-[#872015]'
                            : 'bg-[#e0e3e6] text-[#74777e]'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="py-3.5 font-mono font-bold text-[#00152a]">{booking.amount}</td>
                    <td className="py-3.5 text-right space-x-2">
                      {booking.status === 'Pending' ? (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(booking.id, 'Confirmed')}
                            className="bg-[#006b5f] text-white px-2.5 py-1 rounded-lg font-bold hover:bg-[#005048] transition-colors"
                          >
                            Duyệt
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(booking.id, 'Cancelled')}
                            className="bg-[#eceef1] text-[#ba1a1a] px-2.5 py-1 rounded-lg font-bold hover:bg-[#ffdad6] transition-colors"
                          >
                            Từ chối
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => alert(`Chi tiết đơn ${booking.id}`)}
                          className="text-[#006b5f] hover:underline font-semibold"
                        >
                          Chi tiết
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};
