'use client';

import type { ReactNode } from "react";
import AuthHeroPanel from "./layout/AuthHeroPanel";
import { useI18n } from "@/i18n";

type HeroPanelProps = {
  /** Tiêu đề lớn. Mặc định là nội dung của trang đăng ký. */
  title?: ReactNode;
  /** Đoạn mô tả bên dưới tiêu đề. */
  description?: string;
};

export default function HeroPanel({
  title,
  description,
}: HeroPanelProps) {
  const { locale, hasProvider } = useI18n();
  const isVi = !hasProvider || locale === 'vi';

  const resolvedTitle =
    title ??
    (isVi ? (
      <>
        Lên kế hoạch <span className="text-teal-300">du lịch</span> chỉ trong vài phút.
      </>
    ) : (
      <>
        Plan your <span className="text-teal-300">journey</span> in minutes.
      </>
    ));

  const resolvedDescription =
    description ??
    (isVi
      ? 'Công cụ dành riêng cho traveler Việt — tối ưu lịch trình, khám phá điểm đến và đồng hành cùng bạn trên mọi chuyến đi.'
      : 'Tailored for modern explorers — optimize itineraries, discover top destinations, and travel with peace of mind.');

  return <AuthHeroPanel title={resolvedTitle} description={resolvedDescription} />;
}
