'use client';

import Link from 'next/link';
import { ROUTES } from '@/lib/routes';

interface JourneyCanvasProps {
  activeCity: 'danang' | 'hoian' | 'hue';
  onSelectCity?: (city: 'danang' | 'hoian' | 'hue') => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  isAutoPlayPaused?: boolean;
}

interface DestinationTimeline {
  name: string;
  image: string;
  alt: string;
  photoTag: string;
  photoSubtitle: string;
  journeySubtitle: string;
  stops: {
    title: string;
    time: string;
    desc: string;
    badge: string;
    highlight?: boolean;
  }[];
}

const DESTINATION_DATA: Record<'danang' | 'hoian' | 'hue', DestinationTimeline> = {
  danang: {
    name: 'Đà Nẵng',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDSsQeV_BefjZ5QiBZ3PmO-CDVT3IBy5NXfoZ2VHn0M58mlOxXhD9GRDIkIWHrTt3kfJMoxkQj7H_KtkjV1X-FklLOtTQWnZ8G2tgGNAZtjmPLf6Gb0sD4jzcK6xC6sEKHZZH6R2a9sAuExeiHmokXHQRUKZvySbdk51tmeQVI8hAKaFh9BXdO6733zhohdI_FJTSGah_gvVppbxkDUlnE-LbiGEP_woNGqE00KWQfAejQA0kQjrl4',
    alt: 'Bãi biển Mỹ Khê và Bán đảo Sơn Trà, Đà Nẵng',
    photoTag: 'Bán đảo Sơn Trà & Biển Mỹ Khê',
    photoSubtitle:
      'Tâm điểm du lịch biển miền Trung với đường bờ biển cát trắng nguyên sơ và hệ sinh thái đa dạng.',
    journeySubtitle: 'Lộ trình 1 ngày: Khám phá cảnh quan ven biển & văn hóa Chăm',
    stops: [
      {
        title: 'Danh thắng Ngũ Hành Sơn',
        time: '08:00',
        desc: 'Buổi sáng mát mẻ, nhiệt độ ôn hòa lý tưởng leo núi',
        badge: '1',
      },
      {
        title: 'Bảo tàng Điêu khắc Chăm & Ăn trưa',
        time: '11:30',
        desc: 'Không gian trong nhà mát mẻ, tránh giờ nắng gắt buổi trưa',
        badge: '2',
      },
      {
        title: 'Hoàng hôn Bán đảo Sơn Trà & Cầu Rồng',
        time: '17:30',
        desc: 'Bắt trọn khoảnh khắc hoàng hôn và vãn cảnh sông Hàn',
        badge: '3',
        highlight: true,
      },
    ],
  },
  hoian: {
    name: 'Hội An',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDTerZgbvmAXswccfESZeuJuWp4SDcxQBYD3V2y_faDAANthMPtHEqT9PBTXMyymEBFncjvOZpGpYPVKh5cqW7ZnKCyvtmlgxmPRXXYdbnWQ2-tD3We8VoDVCUXYS6JI_pi5_bHJa8WS5YefC6mTyiWoO-nq7kNZslYheOsY2gsx-zkrTvob1nPXlVtHfZ55jPzkiUhnhK-odHavZT19lyo-munVOvsXghbFO_6Oc23dCrGYew37tM',
    alt: 'Phố cổ Hội An bên dòng sông Hoài lung linh hoa đăng',
    photoTag: 'Phố Cổ Hội An & Sông Hoài',
    photoSubtitle:
      'Di sản văn hóa thế giới lung linh sắc đèn hoa đăng và kiến trúc thương cảng cổ kính.',
    journeySubtitle: 'Lộ trình 1 ngày: Hòa mình vào không gian di sản & làng nghề truyền thống',
    stops: [
      {
        title: 'Rừng dừa Bảy Mẫu Cẩm Thanh',
        time: '08:30',
        desc: 'Trải nghiệm chèo thuyền thúng buổi sớm khi nước trong xanh',
        badge: '1',
      },
      {
        title: 'Bánh Mì Phượng & Cao lầu Phố Hội',
        time: '11:30',
        desc: 'Thưởng thức ẩm thực danh tiếng và nghỉ ngơi trưa râm mát',
        badge: '2',
      },
      {
        title: 'Phố cổ Hội An & Thả đèn Hoa Đăng Sông Hoài',
        time: '17:00',
        desc: 'Chiêm ngưỡng phố cổ lên đèn lồng và đi thuyền thả hoa đăng',
        badge: '3',
        highlight: true,
      },
    ],
  },
  hue: {
    name: 'Cố Đô Huế',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDvlzZ40Hx7i1FbtOob_foIQBimfPh5rFUCt3BvN5X9Sj0NS5BD1p3_b6kRz-pSG5J75nVfmuqFGTuOx0Av1FCTy0pkHzqa2XdsaSHA4j-WpoISWpmBTm7xVFCpW35bHqj0E8xN1uZ7UCbsW8qAsVX5g4fwvyjOD-y-3igiwtWpSiN60kLSSHJjmWT1MP6fuXzHBdvQwDfgzrhodjxwqBgNJKu7O2LUDP7FpsStnwwjI7iW9c-kmJk',
    alt: 'Đại Nội Hoàng Thành Huế và Quần thể di tích Cố Đô',
    photoTag: 'Đại Nội Hoàng Thành Huế',
    photoSubtitle:
      'Quần thể di tích lịch sử triều Nguyễn trầm mặc bên dòng sông Hương thơ mộng.',
    journeySubtitle: 'Lộ trình 1 ngày: Hành trình di sản triều Nguyễn & nhã nhạc cung đình',
    stops: [
      {
        title: 'Quần thể Di tích Đại Nội Hoàng Thành',
        time: '08:00',
        desc: 'Tham quan Ngọ Môn, Điện Thái Hòa sáng sớm tránh nhiệt độ cao',
        badge: '1',
      },
      {
        title: 'Bún Bò Huế Mụ Rơi & Bánh Nậm Lọc',
        time: '11:30',
        desc: 'Trải nghiệm phong vị ẩm thực Cố Đô đậm đà truyền thống',
        badge: '2',
      },
      {
        title: 'Chùa Thiên Mụ & Thuyền Rồng Sông Hương',
        time: '16:30',
        desc: 'Đón hoàng hôn buông trên sông Hương và nghe chuông Thiên Mụ',
        badge: '3',
        highlight: true,
      },
    ],
  },
};

export function JourneyCanvas({
  activeCity,
  onMouseEnter,
  onMouseLeave,
}: JourneyCanvasProps) {
  const current = DESTINATION_DATA[activeCity] ?? DESTINATION_DATA.danang;

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="relative flex flex-col gap-3.5 select-none group/canvas"
    >
      {/* Dynamic Soft Ambient Glow standing behind the entire Journey Stage */}
      <div
        className={`absolute -inset-2.5 sm:-inset-3.5 rounded-3xl transition-all duration-700 pointer-events-none blur-2xl animate-orb-1 ${
          activeCity === 'danang'
            ? 'bg-gradient-to-br from-teal-500/20 via-sky-400/14 to-emerald-300/8 opacity-65'
            : activeCity === 'hoian'
            ? 'bg-gradient-to-br from-amber-500/24 via-orange-400/16 to-yellow-300/8 opacity-70'
            : 'bg-gradient-to-br from-purple-500/20 via-violet-400/14 to-indigo-300/8 opacity-65'
        }`}
      />

      {/* Background Geographic Travel Route Spine — "Đường đi chuyển động rõ nét" */}
      <svg
        className="absolute -inset-x-6 -inset-y-5 w-[calc(100%+3rem)] h-[calc(100%+2.5rem)] pointer-events-none z-0 overflow-visible opacity-90"
        viewBox="0 0 460 520"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="routeSpineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#007D6E" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#D97706" stopOpacity="0.85" />
          </linearGradient>
          <filter id="routeGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        {/* Soft Route Glow underlay for clear contrast ("rõ nét") */}
        <path
          d="M 50 60 C 200 100, 420 160, 390 270 C 360 380, 80 410, 370 500"
          stroke="url(#routeSpineGrad)"
          strokeWidth="7"
          strokeLinecap="round"
          opacity="0.3"
          filter="url(#routeGlowFilter)"
        />
        {/* Sharp Distinct Dynamic Travel Route Path with Continuous Dash Flow */}
        <path
          d="M 50 60 C 200 100, 420 160, 390 270 C 360 380, 80 410, 370 500"
          stroke="url(#routeSpineGrad)"
          strokeWidth="3.2"
          strokeLinecap="round"
          className="animate-route-dash-flow"
        />
        {/* Waypoint Destination Beacons (Huế -> Đà Nẵng -> Hội An) */}
        <g>
          {/* Huế Beacon */}
          <circle cx="50" cy="60" r="5" fill="#7C3AED" opacity="0.35">
            <animate attributeName="r" from="5" to="18" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.35" to="0" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="50" cy="60" r="5" fill="none" stroke="#7C3AED" strokeWidth="1.4" opacity="0.8">
            <animate attributeName="r" from="5" to="18" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.8" to="0" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="50" cy="60" r="5" fill="#7C3AED" stroke="#FFFFFF" strokeWidth="2" />

          {/* Đà Nẵng Beacon */}
          <circle cx="390" cy="270" r="6" fill="#007D6E" opacity="0.35">
            <animate attributeName="r" from="6" to="20" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.35" to="0" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="390" cy="270" r="6" fill="none" stroke="#007D6E" strokeWidth="1.6" opacity="0.8">
            <animate attributeName="r" from="6" to="20" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.8" to="0" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="390" cy="270" r="6" fill="#007D6E" stroke="#FFFFFF" strokeWidth="2.5" />

          {/* Hội An Beacon */}
          <circle cx="370" cy="500" r="5" fill="#D97706" opacity="0.35">
            <animate attributeName="r" from="5" to="18" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.35" to="0" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="370" cy="500" r="5" fill="none" stroke="#D97706" strokeWidth="1.4" opacity="0.8">
            <animate attributeName="r" from="5" to="18" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.8" to="0" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="370" cy="500" r="5" fill="#D97706" stroke="#FFFFFF" strokeWidth="2" />
        </g>
      </svg>

      {/* 1. Authentic Photography Stage */}
      <div className="relative z-10 rounded-2xl overflow-hidden border border-[#E5E0D8] bg-white shadow-md shadow-black/5 group">
        <div className="relative h-[280px] sm:h-[310px] lg:h-[320px] w-full overflow-hidden bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={activeCity}
            src={current.image}
            alt={current.alt}
            loading="lazy"
            decoding="async"
            className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 animate-crossfade motion-reduce:animate-none ${
              activeCity === 'hue' ? 'scale-[1.15] origin-bottom' : ''
            }`}
          />
          {/* Subtle gradient overlay for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none" />

          {/* Location Badge */}
          <div
            key={`badge-${activeCity}`}
            className="absolute top-3.5 left-3.5 bg-white/95 backdrop-blur-md px-3 py-1 rounded-lg border border-white/50 shadow-xs flex items-center gap-1.5 text-xs font-semibold text-[#121E28] animate-fade-in motion-reduce:animate-none"
          >
            <span className="material-symbols-outlined text-sm text-[#007d6e]" aria-hidden="true">
              photo_camera
            </span>
            <span>{current.photoTag}</span>
          </div>

          {/* Bottom Photo Caption */}
          <div
            key={`caption-${activeCity}`}
            className="absolute bottom-3.5 left-4 right-4 text-white animate-fade-in motion-reduce:animate-none"
          >
            <p className="text-xs font-medium text-white/90 line-clamp-1">
              {current.photoSubtitle}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Interactive Curated Journey Preview */}
      <div className="relative z-10 rounded-2xl border border-[#E2DDD3] bg-white p-4 sm:p-4.5 shadow-2xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#F0ECE3]">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#007d6e]" />
              <span className="text-xs font-bold text-[#121E28]">
                Lịch trình mẫu tiêu biểu
              </span>
            </div>
            <p
              key={`sub-${activeCity}`}
              className="text-[11px] text-[#64748B] mt-0.5 animate-fade-in motion-reduce:animate-none"
            >
              {current.journeySubtitle}
            </p>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#F4F1EA] text-[#556370]">
            Mẫu tham khảo
          </span>
        </div>

        {/* Sequential Timeline Nodes with Staggered Entrance */}
        <div
          key={`stops-${activeCity}`}
          className="mt-3.5 space-y-3"
        >
          {current.stops.map((stop, index) => {
            const isLast = index === current.stops.length - 1;
            const isHighlight = Boolean(stop.highlight);

            return (
              <div
                key={stop.title}
                style={{
                  animationDelay: `${index * 120}ms`,
                  animationDuration: '450ms',
                  animationFillMode: 'both',
                }}
                className="flex items-start gap-2.5 animate-in fade-in slide-in-from-left-2 duration-400 ease-out"
              >
                <div className="flex flex-col items-center">
                  <span
                    className={`w-5.5 h-5.5 rounded-full text-[11px] font-bold flex items-center justify-center border transition-transform duration-300 hover:scale-110 ${
                      isHighlight
                        ? 'bg-amber-50 text-amber-700 border-amber-300'
                        : 'bg-teal-50 text-[#007d6e] border-teal-200'
                    }`}
                  >
                    {stop.badge}
                  </span>
                  {!isLast && (
                    <div className="relative w-0.5 h-5 my-0.5 bg-[#E2DDD3] overflow-hidden rounded-full">
                      <div className="absolute inset-0 bg-gradient-to-b from-[#007D6E] via-teal-400 to-[#D97706] animate-pulse" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-semibold text-[#121E28] truncate">
                      {stop.title}
                    </h4>
                    <span
                      className={`text-[11px] font-medium shrink-0 ${
                        isHighlight ? 'text-amber-700' : 'text-[#64748B]'
                      }`}
                    >
                      {stop.time}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#556370] line-clamp-1 mt-0.5">
                    {stop.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA Action inside Preview */}
        <div className="mt-3.5 pt-3 border-t border-[#F0ECE3] flex items-center justify-between">
          <span className="text-[11px] text-[#64748B] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-[#007d6e]" aria-hidden="true">
              tune
            </span>
            <span>Tùy biến theo thời gian của bạn</span>
          </span>
          <Link
            href={ROUTES.plan}
            className="text-xs font-bold text-[#007d6e] hover:text-[#006b5f] inline-flex items-center gap-0.5 transition-colors"
          >
            <span>Mở trong Trình lập lịch</span>
            <span className="material-symbols-outlined text-sm" aria-hidden="true">
              chevron_right
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
