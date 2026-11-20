'use client';

import Link from 'next/link';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { ROUTES } from '@/lib/routes';
import { useI18n } from '@/i18n';

interface StepItem {
  step: string;
  title: string;
  description: string;
  icon: string;
  tag: string;
}

const STEPS_VI: StepItem[] = [
  {
    step: '01',
    title: 'Khám phá Điểm đến',
    description:
      'Lựa chọn danh lam thắng cảnh, di sản văn hóa và ẩm thực bản địa đặc sắc tại Đà Nẵng, Hội An hoặc Cố Đô Huế.',
    icon: 'travel_explore',
    tag: 'Điểm đến chọn lọc',
  },
  {
    step: '02',
    title: 'Lập Lịch trình Tối ưu',
    description:
      'Hệ thống hỗ trợ cân đối thời gian mở cửa, khoảng cách di chuyển và nhịp độ chuyến đi để tạo lộ trình tham quan khoa học.',
    icon: 'route',
    tag: 'Thuật toán CSP',
  },
  {
    step: '03',
    title: 'Trải nghiệm Thảnh thơi',
    description:
      'Nhận đề xuất điều chỉnh lộ trình linh hoạt khi thời tiết chuyển biến và đồng hành cùng trải nghiệm bản địa an tâm.',
    icon: 'sunny_snowing',
    tag: 'Thích ứng thời tiết',
  },
];

const STEPS_EN: StepItem[] = [
  {
    step: '01',
    title: 'Discover Destinations',
    description:
      'Explore iconic landmarks, rich heritage, and authentic local cuisine across Da Nang, Hoi An, and Ancient Hue.',
    icon: 'travel_explore',
    tag: 'Curated Spots',
  },
  {
    step: '02',
    title: 'Optimize Your Itinerary',
    description:
      'The system balances operating hours, transit distances, and travel pace to craft a balanced, feasible journey.',
    icon: 'route',
    tag: 'AI Optimization',
  },
  {
    step: '03',
    title: 'Travel Effortlessly',
    description:
      'Get intelligent real-time adaptation recommendations during weather shifts, enjoying peace of mind on every stop.',
    icon: 'sunny_snowing',
    tag: 'Weather Adaptive',
  },
];

export function HowItWorksPreviewSection() {
  const { locale, hasProvider } = useI18n();
  const isVi = !hasProvider || locale === 'vi';
  const steps = isVi ? STEPS_VI : STEPS_EN;

  return (
    <section className="scroll-mt-20 py-16 sm:py-20 bg-white px-3 sm:px-6 lg:px-8 border-b border-slate-200">
      <div className="mx-auto max-w-7xl xl:max-w-[1440px]">
        {/* Section Header: Calm Editorial Hierarchy */}
        <ScrollReveal animation="fade-up">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold text-[#103B39] mb-2.5">
                <span className="material-symbols-outlined text-sm" aria-hidden="true">
                  alt_route
                </span>
                <span>{isVi ? 'Cách thức hoạt động' : 'How It Works'}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-black text-[#1C2928] tracking-tight text-balance">
                {isVi ? 'Ba Bước Khởi Hành Trọn Vẹn' : 'Three Steps to an Effortless Journey'}
              </h2>
              <p className="mt-3 text-slate-600 text-sm sm:text-base max-w-2xl leading-relaxed text-pretty">
                {isVi
                  ? 'Từ cảm hứng ban đầu đến chuyến đi thực tế, TripMate hỗ trợ bạn kết nối các điểm đến miền Trung một cách mạch lạc, thông minh và tiết kiệm thời gian.'
                  : 'From initial inspiration to real journeys, TripMate connects Central Vietnam destinations intelligently and seamlessly.'}
              </p>
            </div>

            <Link
              href={`${ROUTES.about}#planning`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#103B39] hover:text-[#174B4A] transition group shrink-0"
            >
              <span>{isVi ? 'Tìm hiểu sâu về công nghệ TripMate' : 'Learn more about TripMate technology'}</span>
              <span className="material-symbols-outlined text-sm group-hover:translate-x-0.5 transition-transform" aria-hidden="true">
                arrow_forward
              </span>
            </Link>
          </div>
        </ScrollReveal>

        {/* 3 Sequential Step Cards */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {steps.map((item, idx) => (
            <ScrollReveal key={item.step} animation="fade-up" delay={idx * 120}>
              <div className="h-full rounded-2xl border border-slate-200/90 bg-[#f8fafc] p-6 lg:p-7 flex flex-col justify-between hover:bg-white hover:border-teal-300 hover:shadow-md transition-all duration-300 group">
                <div>
                  {/* Step Header: Sequential Number & Icon */}
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <span className="text-3xl font-black text-[#1C2928]/20 group-hover:text-[#103B39]/40 transition-colors font-mono tracking-tight">
                      {item.step}
                    </span>
                    <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100/80 flex items-center justify-center text-[#103B39] group-hover:bg-[#103B39] group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-2xl" aria-hidden="true">
                        {item.icon}
                      </span>
                    </div>
                  </div>

                  {/* Step Content */}
                  <div className="inline-block px-2.5 py-0.5 rounded-md bg-teal-50/70 border border-teal-200/50 text-[11px] font-semibold text-[#174B4A] mb-3">
                    {item.tag}
                  </div>
                  <h3 className="text-xl font-bold text-[#1C2928] tracking-tight mb-2.5">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Subtle Step Divider / Action */}
                <div className="pt-6 mt-6 border-t border-slate-200/70 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-medium text-slate-500">
                    {isVi ? `Bước ${idx + 1} trên 3` : `Step ${idx + 1} of 3`}
                  </span>
                  <span className="material-symbols-outlined text-base text-slate-300 group-hover:text-[#103B39] group-hover:translate-x-1 transition-all" aria-hidden="true">
                    east
                  </span>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
