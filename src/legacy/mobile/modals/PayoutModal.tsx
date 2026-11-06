import React, { useState } from 'react';

/** Legacy visual reference for the Flutter Tour Operator payout flow. */

interface PayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PayoutModal: React.FC<PayoutModalProps> = ({ isOpen, onClose }) => {
  const [amount, setAmount] = useState('12,500,000');
  const [bank, setBank] = useState('vietcombank');
  const [accountNum, setAccountNum] = useState('0011002345678');
  const [accountName, setAccountName] = useState('CONG TY TNHH NGUYEN TRAVEL');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#103B39]/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-[#DCE2DD] rounded-3xl max-w-md w-full p-6 text-[#1C2928] shadow-2xl relative animate-scale-in">
        <div className="flex justify-between items-start mb-5">
          <div>
            <h3 className="text-xl font-extrabold text-[#1C2928]">Yêu Cầu Rút Tiền</h3>
            <p className="text-xs text-[#5B6E69]">Quyết toán doanh thu về tài khoản ngân hàng</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#DCE2DD] hover:bg-[#DCE2DD] flex items-center justify-center text-[#5B6E69]"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-[#6df5e1]/40 text-[#174B4A] flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">check_circle</span>
            </div>
            <h4 className="text-lg font-bold text-[#1C2928]">Yêu cầu đã gửi thành công!</h4>
            <p className="text-xs text-[#5B6E69] mt-1">
              Tiền sẽ được chuyển vào tài khoản của bạn trong 24h làm việc.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#5B6E69] uppercase tracking-wider block mb-1">
                Số tiền rút (VND)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-[#F7F5EF] border border-[#DCE2DD] rounded-xl px-4 py-2.5 font-mono font-bold text-base text-[#1C2928] outline-none focus:border-[#174B4A]"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#174B4A]">
                  Tối đa
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#5B6E69] uppercase tracking-wider block mb-1">
                Ngân hàng thụ hưởng
              </label>
              <select
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                className="w-full bg-[#F7F5EF] border border-[#DCE2DD] rounded-xl px-3 py-2.5 text-xs font-semibold text-[#1C2928] outline-none focus:border-[#174B4A]"
              >
                <option value="vietcombank">Vietcombank - Ngân hàng Ngoại thương Việt Nam</option>
                <option value="techcombank">Techcombank - Ngân hàng Kỹ thương Việt Nam</option>
                <option value="mb">MB Bank - Ngân hàng Quân Đội</option>
                <option value="bidv">BIDV - Ngân hàng Đầu tư & Phát triển</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#5B6E69] uppercase tracking-wider block mb-1">
                Số tài khoản
              </label>
              <input
                type="text"
                value={accountNum}
                onChange={(e) => setAccountNum(e.target.value)}
                className="w-full bg-[#F7F5EF] border border-[#DCE2DD] rounded-xl px-4 py-2 text-xs font-mono font-bold text-[#1C2928] outline-none focus:border-[#174B4A]"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#5B6E69] uppercase tracking-wider block mb-1">
                Tên chủ tài khoản
              </label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="w-full bg-[#F7F5EF] border border-[#DCE2DD] rounded-xl px-4 py-2 text-xs font-bold text-[#1C2928] outline-none uppercase focus:border-[#174B4A]"
                required
              />
            </div>

            <div className="p-3 bg-[#F7F5EF] rounded-xl text-xs text-[#5B6E69] space-y-1">
              <div className="flex justify-between">
                <span>Phí xử lý giao dịch:</span>
                <span className="font-mono font-bold text-[#174B4A]">0 VND (Miễn phí)</span>
              </div>
              <div className="flex justify-between font-bold text-[#1C2928]">
                <span>Thực nhận:</span>
                <span className="font-mono">{amount} VND</span>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-[#DCE2DD] hover:bg-[#DCE2DD] text-[#5B6E69] py-2.5 rounded-xl font-bold text-xs transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="flex-1 bg-[#174B4A] hover:bg-[#103B39] text-white py-2.5 rounded-xl font-bold text-xs shadow-xs transition-colors"
              >
                Xác nhận rút tiền
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
