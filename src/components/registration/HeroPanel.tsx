import AuthHeroPanel from "../layout/AuthHeroPanel";

export default function HeroPanel() {
  return (
    <AuthHeroPanel
      sticky
      title={
        <>
          Lên kế hoạch <span className="text-brand-brightTeal">du lịch</span> chỉ trong vài phút.
        </>
      }
      description="Công cụ dành riêng cho traveler Việt — tối ưu lịch trình, khám phá điểm đến và đồng hành cùng bạn trên mọi chuyến đi."
    />
  );
}
