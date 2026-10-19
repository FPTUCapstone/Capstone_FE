'use client';

import Link from 'next/link';
import { ROUTES } from '@/lib/routes';
import { EditorialTextReveal, CardReveal } from '@/components/ui/ScrollReveal';
import { JourneyCanvas } from './JourneyCanvas';

interface LandingHeroProps {
  activeCity: 'danang' | 'hoian' | 'hue';
  onSelectCity: (city: 'danang' | 'hoian' | 'hue') => void;
  isAutoPlayPaused?: boolean;
  onPauseAutoPlay?: () => void;
  onResumeAutoPlay?: () => void;
}

const CITY_ATLAS_DATA = {
  danang: {
    city: 'Đà Nẵng',
    tag: 'Duyên hải & Bán đảo Sơn Trà',
    coords: '16°04′N • 108°13′E',
    elevation: '+1,487m Bà Nà • 0m Mỹ Khê',
    terrain: 'Ven biển, đèo núi & bán đảo',
    goldenHour: 'Bình minh Mỹ Khê 05:30 — 08:30',
    color: '#007D6E',
    badgeBg: 'bg-[#007D6E]/10',
    activePath: 'M 10 45 C 25 20, 50 35, 75 15 C 88 25, 98 18, 105 22',
  },
  hoian: {
    city: 'Hội An',
    tag: 'Hạ lưu Sông Thu Bồn & Phố cổ',
    coords: '15°52′N • 108°19′E',
    elevation: '+4m Phố Cổ • Cửa Đại Biển Đông',
    terrain: 'Đồng bằng hạ lưu sông & phố cổ',
    goldenHour: 'Hoàng hôn & Phố hoa đăng 17:00 — 21:00',
    color: '#D97706',
    badgeBg: 'bg-[#D97706]/10',
    activePath: 'M 10 50 C 30 35, 45 42, 65 30 C 80 40, 95 32, 105 38',
  },
  hue: {
    city: 'Cố Đô Huế',
    tag: 'Thung lũng Sông Hương & Quần thể Lăng tẩm',
    coords: '16°28′N • 107°35′E',
    elevation: '+15m Hoàng Thành • +1,450m Bạch Mã',
    terrain: 'Thung lũng phù sa sông & lăng tẩm',
    goldenHour: 'Sương sớm Đại Nội 06:30 — 10:00',
    color: '#7C3AED',
    badgeBg: 'bg-[#7C3AED]/10',
    activePath: 'M 10 25 C 28 45, 52 30, 72 48 C 85 35, 96 42, 105 30',
  },
};

export function LandingHero({
  activeCity,
  onSelectCity,
  isAutoPlayPaused = false,
  onPauseAutoPlay,
  onResumeAutoPlay,
}: LandingHeroProps) {
  const currentAtlas = CITY_ATLAS_DATA[activeCity];

  return (
    <section className="relative overflow-hidden border-b border-[#E5E0D8] bg-[#F8F6F1] px-4 py-6 sm:px-8 md:py-10 lg:py-14">
      {/* Ambient Photography & Travel Glow Orbs */}
      <div className="absolute top-1/4 -right-20 w-[480px] h-[480px] rounded-full bg-gradient-to-bl from-[#007D6E]/12 via-[#D97706]/8 to-transparent blur-3xl pointer-events-none animate-orb-1" />
      <div className="absolute -bottom-10 left-1/3 w-[360px] h-[360px] rounded-full bg-gradient-to-tr from-[#007D6E]/8 to-transparent blur-3xl pointer-events-none animate-orb-2" />

      {/* Editorial Cartographic Heritage Atlas Map Layer ("Bản đồ địa hình & hải trình Miền Trung") */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible opacity-90 hidden sm:block"
        viewBox="0 0 1440 680"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="heroRouteSpineGrad" x1="0%" y1="0%" x2="100%" y2="80%">
            <stop offset="10%" stopColor="#7C3AED" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#007D6E" stopOpacity="0.95" />
            <stop offset="90%" stopColor="#D97706" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="oceanShadeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#007D6E" stopOpacity="0.0" />
            <stop offset="60%" stopColor="#007D6E" stopOpacity="0.03" />
            <stop offset="100%" stopColor="#0284C7" stopOpacity="0.06" />
          </linearGradient>
          <filter id="heroRouteGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Subtle Ocean Basin Wash (East Vietnam Sea / Biển Đông) */}
        <path
          d="M 800 0 C 880 90, 960 140, 1060 180 C 1180 220, 1390 280, 1340 480 C 1300 580, 1160 610, 1200 680 L 1440 680 L 1440 0 Z"
          fill="url(#oceanShadeGrad)"
        />

        {/* 2. Coastal Bathymetry & Wave Ripples */}
        <path
          d="M 840 0 C 910 100, 990 150, 1090 190 C 1200 230, 1410 300, 1360 490 C 1320 590, 1190 620, 1230 680"
          stroke="#007D6E"
          strokeWidth="1"
          strokeDasharray="4 8"
          strokeOpacity="0.22"
        />
        <path
          d="M 880 0 C 950 110, 1030 160, 1130 200 C 1240 250, 1430 330, 1390 510 C 1350 600, 1230 630, 1270 680"
          stroke="#007D6E"
          strokeWidth="0.8"
          strokeDasharray="3 9"
          strokeOpacity="0.14"
        />

        {/* 3. Topographic Mountain Elevation Contours (Trường Sơn Range & Passes - Full Width) */}
        {/* Right Half: Coastal Ridges */}
        <path
          d="M 680 0 C 730 80, 800 130, 870 170 C 940 210, 1000 250, 1020 340 C 1040 440, 1010 520, 1050 680"
          stroke="#D97706"
          strokeWidth="1.2"
          strokeDasharray="6 8"
          strokeOpacity="0.18"
        />
        <path
          d="M 620 0 C 670 90, 740 150, 810 200 C 880 250, 940 310, 960 410 C 980 510, 960 590, 1000 680"
          stroke="#5A5043"
          strokeWidth="0.8"
          strokeDasharray="5 10"
          strokeOpacity="0.14"
        />

        {/* Left Half: Central Vietnam Highland & Pass Ridges */}
        <path
          d="M 0 110 C 120 150, 240 120, 380 160 C 520 200, 680 130, 800 130"
          stroke="#D97706"
          strokeWidth="1"
          strokeDasharray="5 7"
          strokeOpacity="0.14"
        />
        <path
          d="M 0 220 C 150 260, 290 210, 450 280 C 600 350, 710 260, 840 260"
          stroke="#5A5043"
          strokeWidth="0.8"
          strokeDasharray="4 8"
          strokeOpacity="0.12"
        />
        <path
          d="M 0 360 C 130 390, 260 340, 420 400 C 560 460, 680 390, 800 420"
          stroke="#007D6E"
          strokeWidth="0.8"
          strokeDasharray="3 9"
          strokeOpacity="0.12"
        />
        <path
          d="M 0 500 C 150 530, 310 470, 470 540 C 620 610, 720 550, 820 590"
          stroke="#007D6E"
          strokeWidth="0.8"
          strokeDasharray="4 6"
          strokeOpacity="0.10"
        />

        {/* Mountain Peak Badges & Elevation Labels (Trường Sơn Heritage Topo) */}
        <g opacity="0.45" fontSize="8.5" fontFamily="sans-serif" fontWeight="bold">
          <text x="160" y="145" fill="#7C3AED" textAnchor="middle">▲ +1,450m BẠCH MÃ</text>
          <text x="460" y="270" fill="#D97706" textAnchor="middle">▲ +496m ĐÈO HẢI VÂN</text>
          <text x="310" y="410" fill="#007D6E" textAnchor="middle">▲ +1,487m ĐỈNH BÀ NÀ</text>
        </g>

        {/* Heritage River Tributary Paths (Flowing to Sea) */}
        <path
          d="M 90 70 C 240 100, 450 90, 680 140 C 780 160, 840 170, 890 180"
          stroke="#7C3AED"
          strokeWidth="1"
          strokeDasharray="3 4"
          strokeOpacity="0.16"
        />
        <path
          d="M 380 340 C 540 370, 780 390, 1020 440 C 1140 460, 1220 470, 1280 480"
          stroke="#007D6E"
          strokeWidth="1"
          strokeDasharray="3 4"
          strokeOpacity="0.16"
        />
        <path
          d="M 340 520 C 520 550, 720 570, 880 620 C 940 640, 980 655, 1020 670"
          stroke="#D97706"
          strokeWidth="1"
          strokeDasharray="3 4"
          strokeOpacity="0.16"
        />

        {/* Sơn Trà Peninsula Contour (Topographic Accent) */}
        <ellipse
          cx="1375"
          cy="220"
          rx="42"
          ry="24"
          transform="rotate(-15 1375 220)"
          stroke="#007D6E"
          strokeWidth="1.2"
          strokeDasharray="4 4"
          strokeOpacity="0.28"
        />
        <text
          x="1375"
          y="208"
          fill="#007D6E"
          fillOpacity="0.45"
          fontSize="8"
          fontWeight="bold"
          fontFamily="sans-serif"
          textAnchor="middle"
        >
          BÁN ĐẢO SƠN TRÀ
        </text>

        {/* 4. GIS Graticule Lines (Coordinate Frame - Full Width) */}
        <line x1="0" y1="180" x2="1420" y2="180" stroke="#7C3AED" strokeWidth="0.8" strokeDasharray="3 9" strokeOpacity="0.14" />
        <line x1="0" y1="480" x2="1420" y2="480" stroke="#007D6E" strokeWidth="0.8" strokeDasharray="3 9" strokeOpacity="0.15" />
        <line x1="220" y1="40" x2="220" y2="640" stroke="#5A5043" strokeWidth="0.6" strokeDasharray="2 8" strokeOpacity="0.10" />
        <line x1="1280" y1="80" x2="1280" y2="660" stroke="#007D6E" strokeWidth="0.8" strokeDasharray="3 9" strokeOpacity="0.14" />

        {/* Crosshair target markers (East & West) */}
        <g stroke="#007D6E" strokeWidth="1" strokeOpacity="0.35">
          <path d="M 214 180 L 226 180 M 220 174 L 220 186" />
          <path d="M 214 480 L 226 480 M 220 474 L 220 486" />
          <path d="M 884 180 L 896 180 M 890 174 L 890 186" />
          <path d="M 1274 480 L 1286 480 M 1280 474 L 1280 486" />
          <path d="M 1014 670 L 1026 670 M 1020 664 L 1020 676" />
        </g>

        {/* Subtle Highland Watermark on Far Left Margin */}
        <text
          x="35"
          y="320"
          fill="#5A5043"
          fillOpacity="0.16"
          fontSize="10"
          fontFamily="sans-serif"
          fontWeight="bold"
          letterSpacing="0.3em"
          transform="rotate(-90 35 320)"
        >
          TRƯỜNG SƠN • CENTRAL VIETNAM ATLAS
        </text>

        {/* 5. Elegant Ocean Watermark */}
        <text
          x="1380"
          y="280"
          fill="#007D6E"
          fillOpacity="0.22"
          fontSize="11"
          fontFamily="sans-serif"
          fontWeight="bold"
          letterSpacing="0.35em"
          transform="rotate(90 1380 280)"
        >
          BIỂN ĐÔNG • EAST VIETNAM SEA
        </text>

        {/* 6. Minimalist Nautical Compass Rose (Top Right) */}
        <g transform="translate(1360, 85)" opacity="0.4">
          <circle cx="0" cy="0" r="24" stroke="#007D6E" strokeWidth="0.8" strokeDasharray="2 4" />
          <circle cx="0" cy="0" r="16" stroke="#5A5043" strokeWidth="0.6" />
          <line x1="0" y1="-30" x2="0" y2="30" stroke="#007D6E" strokeWidth="1" />
          <line x1="-30" y1="0" x2="30" y2="0" stroke="#007D6E" strokeWidth="1" />
          {/* North Arrow */}
          <polygon points="0,-26 -4,-10 4,-10" fill="#007D6E" />
          <polygon points="0,26 -3,10 3,10" fill="#5A5043" opacity="0.6" />
          <text x="-4" y="-33" fill="#007D6E" fontSize="9" fontFamily="sans-serif" fontWeight="bold">N</text>
          <text x="33" y="3" fill="#64748B" fontSize="8" fontFamily="sans-serif">E</text>
        </g>

        {/* 7. Actual Coastline Contour (Sharp Crisp Edge) */}
        <path
          d="M 800 0 C 880 50, 960 60, 1060 70 C 1180 80, 1320 100, 1370 170 C 1410 260, 1390 440, 1395 680"
          stroke="#007D6E"
          strokeWidth="1.8"
          strokeOpacity="0.4"
        />

        {/* 7.5 Detailed Secondary Scenic Routes & Heritage Branches */}
        {/* Vịnh Lăng Cô & Đèo Hải Vân Scenic Coastal Pass Route */}
        <path
          d="M 890 130 C 940 125, 1000 125, 1060 130 C 1120 135, 1170 130, 1220 130 C 1290 130, 1360 150, 1395 190"
          stroke="#D97706"
          strokeWidth="1.6"
          strokeDasharray="4 5"
          strokeOpacity="0.45"
          fill="none"
        />
        {/* Bán đảo Sơn Trà & Chùa Linh Ứng Coastal Scenic Loop */}
        <path
          d="M 1395 190 C 1435 170, 1445 230, 1400 245 C 1365 255, 1375 330, 1400 430"
          stroke="#007D6E"
          strokeWidth="1.4"
          strokeDasharray="3 4"
          strokeOpacity="0.45"
          fill="none"
        />
        {/* Ngũ Hành Sơn Coastal Highway (Đà Nẵng ↔ Hội An) */}
        <path
          d="M 1400 430 C 1220 455, 950 490, 740 530"
          stroke="#007D6E"
          strokeWidth="1.5"
          strokeDasharray="4 5"
          strokeOpacity="0.4"
          fill="none"
        />
        {/* Bà Nà Hills & Golden Bridge Westward Mountain Spur */}
        <path
          d="M 740 530 C 720 470, 700 400, 670 345"
          stroke="#7C3AED"
          strokeWidth="1.5"
          strokeDasharray="4 5"
          strokeOpacity="0.4"
          fill="none"
        />
        {/* Thánh Địa Mỹ Sơn Heritage Valley Branch (from Hội An) */}
        <path
          d="M 770 590 C 710 590, 660 590, 600 590"
          stroke="#D97706"
          strokeWidth="1.5"
          strokeDasharray="4 5"
          strokeOpacity="0.4"
          fill="none"
        />

        {/* 7.6 Secondary Satellite Waypoint Markers & Badges */}
        {/* Vịnh Lăng Cô Station */}
        <g>
          <circle cx="1060" cy="130" r="9" fill="#007D6E" fillOpacity="0.16" />
          <circle cx="1060" cy="130" r="3.5" fill="#007D6E" stroke="#FFFFFF" strokeWidth="1.5" />
          <g className="hidden md:block">
            <rect x="1005" y="104" width="110" height="20" rx="4" fill="#FFFFFF" fillOpacity="0.95" stroke="#007D6E" strokeWidth="0.8" strokeOpacity="0.45" />
            <text x="1060" y="118" fill="#007D6E" fontSize="8.5" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
              ⛩ VỊNH LĂNG CÔ
            </text>
          </g>
        </g>

        {/* Đèo Hải Vân Elevation Peak Label */}
        <g className="hidden md:block" opacity="0.65">
          <text x="1220" y="118" fill="#D97706" fontSize="8.5" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
            ▲ +496m ĐÈO HẢI VÂN
          </text>
        </g>

        {/* Sơn Trà & Linh Ứng Station */}
        <g>
          <circle cx="1400" cy="220" r="10" fill="#007D6E" fillOpacity="0.16" />
          <circle cx="1400" cy="220" r="4" fill="#007D6E" stroke="#FFFFFF" strokeWidth="1.5" />
          <g className="hidden md:block">
            <rect x="1352" y="240" width="86" height="30" rx="4" fill="#FFFFFF" fillOpacity="0.95" stroke="#007D6E" strokeWidth="0.8" strokeOpacity="0.45" />
            <text x="1395" y="253" fill="#005F56" fontSize="7.5" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
              ⛰ SƠN TRÀ
            </text>
            <text x="1395" y="264" fill="#007D6E" fontSize="7" fontFamily="sans-serif" textAnchor="middle">
              & LINH ỨNG
            </text>
          </g>
        </g>

        {/* Bà Nà Hills & Cầu Vàng Station */}
        <g>
          <circle cx="670" cy="345" r="10" fill="#7C3AED" fillOpacity="0.16" />
          <circle cx="670" cy="345" r="4" fill="#7C3AED" stroke="#FFFFFF" strokeWidth="1.5" />
          <g className="hidden md:block">
            <rect x="598" y="318" width="144" height="20" rx="4" fill="#FFFFFF" fillOpacity="0.95" stroke="#7C3AED" strokeWidth="0.8" strokeOpacity="0.45" />
            <text x="670" y="332" fill="#6B21A8" fontSize="8.5" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
              🌁 BÀ NÀ HILLS & CẦU VÀNG
            </text>
          </g>
        </g>

        {/* Ngũ Hành Sơn Station */}
        <g>
          <circle cx="740" cy="530" r="10" fill="#007D6E" fillOpacity="0.16" />
          <circle cx="740" cy="530" r="4" fill="#007D6E" stroke="#FFFFFF" strokeWidth="1.5" />
          <g className="hidden md:block">
            <rect x="682" y="502" width="116" height="20" rx="4" fill="#FFFFFF" fillOpacity="0.95" stroke="#007D6E" strokeWidth="0.8" strokeOpacity="0.45" />
            <text x="740" y="516" fill="#005F56" fontSize="8.5" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
              ⛰ NGŨ HÀNH SƠN
            </text>
          </g>
        </g>

        {/* Thánh Địa Mỹ Sơn Station */}
        <g>
          <circle cx="600" cy="590" r="9" fill="#D97706" fillOpacity="0.16" />
          <circle cx="600" cy="590" r="3.5" fill="#D97706" stroke="#FFFFFF" strokeWidth="1.5" />
          <g className="hidden md:block">
            <rect x="532" y="568" width="136" height="20" rx="4" fill="#FFFFFF" fillOpacity="0.95" stroke="#D97706" strokeWidth="0.8" strokeOpacity="0.45" />
            <text x="600" y="582" fill="#B45309" fontSize="8.5" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
              🏛 THÁNH ĐỊA MỸ SƠN
            </text>
          </g>
        </g>

        {/* 8. User-Approved Heritage Corridor Travel Route Spine — "Đường đi chuyển động rõ nét" */}
        {/* Soft Route Glow underlay for clear contrast */}
        <path
          d="M 120 260 C 360 210, 640 145, 890 130 C 950 125, 1000 125, 1060 130 C 1120 135, 1170 130, 1220 130 C 1300 130, 1370 150, 1395 190 C 1410 215, 1410 250, 1400 320 C 1390 370, 1410 400, 1400 430 C 1380 480, 1050 515, 740 530 C 700 532, 730 565, 770 590"
          stroke="url(#heroRouteSpineGrad)"
          strokeWidth="7"
          strokeLinecap="round"
          opacity="0.3"
          filter="url(#heroRouteGlow)"
        />
        {/* Sharp Distinct Dynamic Travel Route Path with Animated Dash Flow */}
        <path
          d="M 120 260 C 360 210, 640 145, 890 130 C 950 125, 1000 125, 1060 130 C 1120 135, 1170 130, 1220 130 C 1300 130, 1370 150, 1395 190 C 1410 215, 1410 250, 1400 320 C 1390 370, 1410 400, 1400 430 C 1380 480, 1050 515, 740 530 C 700 532, 730 565, 770 590"
          stroke="url(#heroRouteSpineGrad)"
          strokeWidth="3.2"
          strokeLinecap="round"
          className="animate-route-dash-flow"
        />

        {/* 9. Waypoint Destination Geographic Beacons & Pin Labels */}
        {/* Huế Station */}
        <g className="animate-pulse-subtle">
          <circle cx="890" cy="130" r="14" fill="#7C3AED" fillOpacity="0.15" />
          <circle cx="890" cy="130" r="5.5" fill="#7C3AED" stroke="#FFFFFF" strokeWidth="2" />
        </g>
        <g className="hidden md:block">
          <rect x="835" y="98" width="110" height="22" rx="5" fill="#FFFFFF" fillOpacity="0.95" stroke="#7C3AED" strokeWidth="0.8" strokeOpacity="0.45" />
          <text x="890" y="113" fill="#6B21A8" fontSize="9.5" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
            🏛 CỐ ĐÔ HUẾ
          </text>
        </g>

        {/* Đà Nẵng Station */}
        <g className="animate-pulse-subtle">
          <circle cx="1400" cy="430" r="16" fill="#007D6E" fillOpacity="0.18" />
          <circle cx="1400" cy="430" r="6" fill="#007D6E" stroke="#FFFFFF" strokeWidth="2.5" />
        </g>
        <g className="hidden md:block">
          <rect x="1352" y="452" width="86" height="22" rx="4" fill="#FFFFFF" fillOpacity="0.95" stroke="#007D6E" strokeWidth="0.8" strokeOpacity="0.5" />
          <text x="1395" y="467" fill="#005F56" fontSize="8.5" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
            🌊 TP. ĐÀ NẴNG
          </text>
        </g>

        {/* Hội An Station */}
        <g className="animate-pulse-subtle">
          <circle cx="770" cy="590" r="14" fill="#D97706" fillOpacity="0.16" />
          <circle cx="770" cy="590" r="5.5" fill="#D97706" stroke="#FFFFFF" strokeWidth="2" />
        </g>
        <g className="hidden md:block">
          <rect x="715" y="568" width="110" height="22" rx="5" fill="#FFFFFF" fillOpacity="0.95" stroke="#D97706" strokeWidth="0.8" strokeOpacity="0.45" />
          <text x="770" y="583" fill="#B45309" fontSize="9.5" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
            🏮 PHỐ CỔ HỘI AN
          </text>
        </g>
      </svg>

      <div className="mx-auto grid max-w-7xl items-center gap-6 lg:grid-cols-12 lg:gap-12 relative z-10">
        {/* Left Column: Editorial Typography & Conversion CTAs (7 Columns) */}
        <div className="relative z-10 flex flex-col justify-center lg:col-span-7 pr-0 lg:pr-2">
          {/* Editorial Location & Atlas Label */}
          <EditorialTextReveal delay={60} duration={400}>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#5A5043] mb-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#007d6e]" aria-hidden="true" />
              <span className="text-[11.5px] sm:text-xs font-semibold text-[#5A5043]">
                Cẩm nang lữ hành Đà Nẵng — Hội An — Cố Đô Huế
              </span>
              <span className="sr-only">Central Vietnam Travel Atlas</span>
            </div>
          </EditorialTextReveal>

          {/* Main Headline: Solid Dignified Color, No Template Clichés */}
          <EditorialTextReveal delay={140} duration={480}>
            <h1 className="text-2xl font-bold leading-[1.18] tracking-[-0.025em] text-[#121E28] sm:text-4xl lg:text-[46px] xl:text-[48px] text-balance">
              Hành trình miền Trung được may đo riêng cho từng khoảnh khắc.
            </h1>
          </EditorialTextReveal>

          {/* Subtitle / Human-Centric Lead Copy */}
          <EditorialTextReveal delay={220} duration={480}>
            <p className="mt-3 max-w-2xl text-sm sm:text-base lg:text-[17px] leading-relaxed text-[#475569] text-pretty">
              Từ bình minh trên bán đảo Sơn Trà đến ánh đèn hoa đăng sông Hoài và trầm tích cố đô Huế.
              Hệ thống điều phối của TripMate tự động xếp đặt lộ trình thuận tự nhiên — tối ưu theo khung giờ mở cửa, nhịp nắng mát và sở thích của riêng bạn.
            </p>
          </EditorialTextReveal>

          {/* Unified 3-Pill City Switcher */}
          <EditorialTextReveal delay={300} duration={450}>
            <div
              className="mt-4 sm:mt-5 flex flex-wrap items-center gap-2.5"
              onMouseEnter={onPauseAutoPlay}
              onMouseLeave={onResumeAutoPlay}
            >
              <div className="text-xs font-semibold text-[#64748B] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-[#007d6e]" aria-hidden="true">
                  explore
                </span>
                <span>Khám phá điểm đến tiêu biểu:</span>
              </div>
              <div
                className="inline-flex p-1 rounded-xl bg-[#EFECE4] border border-[#E5E0D8] gap-1 max-w-fit"
                aria-label="Chọn điểm đến miền Trung"
              >
                <button
                  type="button"
                  onClick={() => onSelectCity('danang')}
                  className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer btn-press ${
                    activeCity === 'danang'
                      ? 'bg-[#007d6e] text-white shadow-xs'
                      : 'text-[#475569] hover:text-[#121E28] hover:bg-white/60'
                  }`}
                >
                  <span>Đà Nẵng</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectCity('hoian')}
                  className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer btn-press ${
                    activeCity === 'hoian'
                      ? 'bg-[#d97706] text-white shadow-xs'
                      : 'text-[#475569] hover:text-[#121E28] hover:bg-white/60'
                  }`}
                >
                  <span>Hội An</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectCity('hue')}
                  className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer btn-press ${
                    activeCity === 'hue'
                      ? 'bg-[#7c3aed] text-white shadow-xs'
                      : 'text-[#475569] hover:text-[#121E28] hover:bg-white/60'
                  }`}
                >
                  <span>Cố Đô Huế</span>
                </button>
              </div>
            </div>
          </EditorialTextReveal>

          {/* Interactive Geo-Atlas Mini Map Card */}
          <EditorialTextReveal delay={340} duration={450}>
            <div className="mt-4 rounded-2xl border border-[#E5E0D8] bg-white/90 backdrop-blur-xs p-3 sm:p-3.5 shadow-2xs transition-all duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Mini Stylized Cartographic Map Inset */}
                <div className="relative shrink-0 w-full sm:w-28 h-20 rounded-xl overflow-hidden bg-[#FAF8F5] border border-[#E5E0D8]/80 flex items-center justify-center">
                  {/* Subtle grid pattern */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 112 80" fill="none" aria-hidden="true">
                    <defs>
                      <pattern id="miniGridPattern" width="14" height="14" patternUnits="userSpaceOnUse">
                        <path d="M 14 0 L 0 0 0 14" fill="none" stroke="#5A5043" strokeWidth="0.5" strokeOpacity="0.1" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#miniGridPattern)" />
                    {/* Dynamic topography curve for active city */}
                    <path
                      d={currentAtlas.activePath}
                      stroke={currentAtlas.color}
                      strokeWidth="2"
                      strokeLinecap="round"
                      fill="none"
                      className="transition-all duration-500"
                    />
                    {/* Compass crosshair center marker */}
                    <circle cx="56" cy="40" r="16" stroke="#5A5043" strokeWidth="0.5" strokeDasharray="2 3" strokeOpacity="0.25" />
                    <circle cx="56" cy="40" r="3.5" fill={currentAtlas.color} className="animate-pulse" />
                    <circle cx="56" cy="40" r="8" stroke={currentAtlas.color} strokeWidth="1" strokeOpacity="0.3" />
                  </svg>
                  <span className="absolute bottom-1 right-1.5 text-[8.5px] font-bold text-[#5A5043]/70 font-mono">
                    GIS 1:50k
                  </span>
                </div>

                {/* Atlas Attributes & Live Coordinates */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-1.5 pb-1 border-b border-[#EFECE4]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-ping" />
                      <span className="text-[11px] font-bold font-mono text-[#00152A] tracking-tight">
                        {currentAtlas.coords}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${currentAtlas.badgeBg}`} style={{ color: currentAtlas.color }}>
                      {currentAtlas.city}
                    </span>
                  </div>

                  <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-0.5 text-xs">
                    <p className="text-[11.5px] text-[#475569] truncate">
                      <strong className="font-semibold text-[#121E28]">Địa hình:</strong> {currentAtlas.tag}
                    </p>
                    <p className="text-[11.5px] text-[#475569] truncate">
                      <strong className="font-semibold text-[#121E28]">Cao độ:</strong> {currentAtlas.elevation}
                    </p>
                    <p className="text-[11.5px] text-[#007D6E] font-medium sm:col-span-2 truncate flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined text-[13px]" aria-hidden="true">schedule</span>
                      <span>{currentAtlas.goldenHour}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </EditorialTextReveal>

          {/* Dominant CTAs: Clear Hierarchy */}
          <EditorialTextReveal delay={380} duration={450}>
            <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
              <Link
                href={ROUTES.plan}
                className="inline-flex min-h-[44px] sm:min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#007d6e] px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-[#006b5f] transition-all cursor-pointer btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#007d6e]"
              >
                <span>Lập hành trình của bạn</span>
                <span className="material-symbols-outlined text-base" aria-hidden="true">
                  arrow_forward
                </span>
              </Link>
              <Link
                href={ROUTES.pois}
                className="inline-flex min-h-[44px] sm:min-h-[46px] items-center justify-center gap-2 rounded-xl bg-white border border-[#D5CEBF] px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold text-[#121E28] shadow-2xs hover:bg-[#F4F1EA] hover:border-[#B8AF9C] transition-all cursor-pointer btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007d6e]"
              >
                <span className="material-symbols-outlined text-base text-[#007d6e]" aria-hidden="true">
                  map
                </span>
                <span>Khám phá kho danh thắng</span>
              </Link>
            </div>
          </EditorialTextReveal>

          {/* Operational Guarantees & Cross-Platform Note */}
          <EditorialTextReveal delay={460} duration={450}>
            <div className="mt-5 sm:mt-6 pt-4 border-t border-[#E5E0D8] space-y-2 max-w-xl">
              <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#475569]">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/85 border border-[#E2DDD3] shadow-2xs font-medium hover:border-teal-300 transition-colors">
                  <span className="material-symbols-outlined text-sm text-[#007d6e]" aria-hidden="true">
                    verified
                  </span>
                  <span>Dữ liệu tọa độ GIS đã thẩm định</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/85 border border-[#E2DDD3] shadow-2xs font-medium hover:border-teal-300 transition-colors">
                  <span className="material-symbols-outlined text-sm text-[#007d6e]" aria-hidden="true">
                    shield
                  </span>
                  <span>Cơ chế ký quỹ Escrow bảo vệ quyền lợi</span>
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-[#E5E0D8] bg-white/75 px-3 py-2 text-xs leading-relaxed text-[#556370] backdrop-blur-xs">
                <span className="material-symbols-outlined text-base text-[#007d6e] shrink-0" aria-hidden="true">
                  devices
                </span>
                <p>
                  <strong>Đồng bộ trải nghiệm:</strong> Lên lịch trình và chọn tour trên Web; dẫn đường GPS và vé QR điện tử đồng hành trên Mobile.
                </p>
              </div>
            </div>
          </EditorialTextReveal>
        </div>

        {/* Right Column: Authentic Photography + Curated Journey Stage (5 Columns) */}
        <div className="lg:col-span-5">
          <CardReveal delay={220} duration={700}>
            <JourneyCanvas
              activeCity={activeCity}
              onSelectCity={onSelectCity}
              isAutoPlayPaused={isAutoPlayPaused}
              onMouseEnter={onPauseAutoPlay}
              onMouseLeave={onResumeAutoPlay}
            />
          </CardReveal>
        </div>
      </div>
    </section>
  );
}
