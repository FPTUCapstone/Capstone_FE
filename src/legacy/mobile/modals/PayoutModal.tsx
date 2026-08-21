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
    <div className="fixed inset-0 z-50 bg-[#00152a]/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-[#c3c6ce] rounded-3xl max-w-md w-full p-6 text-[#191c1e] shadow-2xl relative animate-scale-in">
        <div className="flex justify-between items-start mb-5">
          <div>
            <h3 className="text-xl font-extrabold text-[#00152a]">Yêu Cầu Rút Tiền</h3>
            <p className="text-xs text-[#43474d]">Quyết toán doanh thu về tài khoản ngân hàng</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#eceef1] hover:bg-[#e0e3e6] flex items-center justify-center text-[#43474d]"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-[#6df5e1]/40 text-[#006b5f] flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">check_circle</span>
            </div>
            <h4 className="text-lg font-bold text-[#00152a]">Yêu cầu đã gửi thành công!</h4>
            <p className="text-xs text-[#43474d] mt-1">
              Tiền sẽ được chuyển vào tài khoản của bạn trong 24h làm việc.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#74777e] uppercase tracking-wider block mb-1">
                Số tiền rút (VND)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-[#f7f9fc] border border-[#c3c6ce] rounded-xl px-4 py-2.5 font-mono font-bold text-base text-[#00152a] outline-none focus:border-[#006b5f]"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#006b5f]">
                  Tối đa
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#74777e] uppercase tracking-wider block mb-1">
                Ngân hàng thụ hưởng
              </label>
              <select
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                className="w-full bg-[#f7f9fc] border border-[#c3c6ce] rounded-xl px-3 py-2.5 text-xs font-semibold text-[#00152a] outline-none focus:border-[#006b5f]"
              >
                <option value="vietcombank">Vietcombank - Ngân hàng Ngoại thương Việt Nam</option>
                <option value="techcombank">Techcombank - Ngân hàng Kỹ thương Việt Nam</option>
                <option value="mb">MB Bank - Ngân hàng Quân Đội</option>
                <option value="bidv">BIDV - Ngân hàng Đầu tư & Phát triển</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#74777e] uppercase tracking-wider block mb-1">
                Số tài khoản
              </label>
              <input
                type="text"
                value={accountNum}
                onChange={(e) => setAccountNum(e.target.value)}
                className="w-full bg-[#f7f9fc] border border-[#c3c6ce] rounded-xl px-4 py-2 text-xs font-mono font-bold text-[#00152a] outline-none focus:border-[#006b5f]"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#74777e] uppercase tracking-wider block mb-1">
                Tên chủ tài khoản
              </label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="w-full bg-[#f7f9fc] border border-[#c3c6ce] rounded-xl px-4 py-2 text-xs font-bold text-[#00152a] outline-none uppercase focus:border-[#006b5f]"
                required
              />
            </div>

            <div className="p-3 bg-[#f2f4f7] rounded-xl text-xs text-[#43474d] space-y-1">
              <div className="flex justify-between">
                <span>Phí xử lý giao dịch:</span>
                <span className="font-mono font-bold text-[#006b5f]">0 VND (Miễn phí)</span>
              </div>
              <div className="flex justify-between font-bold text-[#00152a]">
                <span>Thực nhận:</span>
                <span className="font-mono">{amount} VND</span>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-[#eceef1] hover:bg-[#e0e3e6] text-[#43474d] py-2.5 rounded-xl font-bold text-xs transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="flex-1 bg-[#006b5f] hover:bg-[#005048] text-white py-2.5 rounded-xl font-bold text-xs shadow-xs transition-colors"
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
