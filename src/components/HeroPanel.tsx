import type { ReactNode } from "react";
import AuthHeroPanel from "./layout/AuthHeroPanel";

type HeroPanelProps = {
  /** Tiêu đề lớn. Mặc định là nội dung của trang đăng ký. */
  title?: ReactNode;
  /** Đoạn mô tả bên dưới tiêu đề. */
  description?: string;
};

export default function HeroPanel({
  title = (
    <>
      Lên kế hoạch <span className="text-brand-brightTeal">du lịch</span> chỉ
      trong vài phút.
    </>
  ),
  description = "Công cụ dành riêng cho traveler Việt — tối ưu lịch trình, khám phá điểm đến và đồng hành cùng bạn trên mọi chuyến đi.",
}: HeroPanelProps) {
  return <AuthHeroPanel title={title} description={description} />;
}
