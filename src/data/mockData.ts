import type { ItineraryNode, PendingTourReview, TourBooking, UserProfile } from '@/types';

export const ASSETS = {
  // Maps & locations
  hanoiLiveMapBg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCsS1y3yWkJfxcm0nhBrpFLeN2XryCVHpMVJZkqaZD_7v8Wzn0GzqBzKW6X9AkXlI29WBAyZNxxo1-otEzmzFCXOYIMCrieOOVI-rbMaxx7SW5h1eKqipr8wiKDvRiVzOkH0YPwM79LaAz0N2NRLupFGhcfKkRZWMVVbBFU3VGyl9DT5zaZcqwfsxuJOG_WtjYHkAE8nqSRWe29qjrhVwTzYqO62RangtAisiaWIiL29N3vmrRIeNg',
  hanoiSuggestedMapBg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6cxm8EBfZkBw0n9bKKC5VXh4k9jdsqgXLMO6SeGx7fYWWtfStRmG_gj7D04guScpMyz1fearwDSrxS1avfGBTSp2rL-HUqHALDDQIL1N6AS2q9oEpszB8vJOuOSlCnoex5RScpsIzZlAlcGdpHteurqim41HlWfQP6LkDPWruaxXFwKniVz6QPStTZVdux-xCnsr4gYsw-RGEMOfs_lDNftZhZ07z4o4ekav7EesO7x_jYvKhsrU',
  hanoiNavMapBg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB721GoYubOqnQeTVX108FrM4zOdDT2-SgDrvnZPnNbEM4nb5-6Z_XRjivTdpQnWIDL1SpbRVXfKYSntQ-gtRMdoAn7RpehcJbwD0QqOis2yz-ezvQ-3tyArmGsigIW4j3unFH4k9kpsBGT90WQy_B5rlFEJIL_0tLMkJ_fBzS76YwlvpdTgzUgAEw1dcoq4DP4lt-zjogDowR40HWXNYQ-aGF0ybaJhDeo9sQmE7kyIIMlSDNERA4',
  vietnamCommandMapDark: 'https://lh3.googleusercontent.com/aida-public/AB6AXuChdoqCWq1SK4jrhkcExpKxMr0QaIjJWMugCCDi4SWXvpbQsttr3hIv63Pj-28Q55vk1HFI9qToX4uMorNkfdM62Xrxh6UxgD9ViLvv_dUFWbEfJyX0xe1eL5l9rqt1pPYS0r8lICFH2xbnfO0MDLtzb-P5ei0nKUtViEP-5rEjJoX2gFCJChX58NpLW_r3ZLbhXyjNY5ZDdOj5bEXVTz80S4nBNMjTlOeia0gfqwDn16hHJXQGu8A',
  topoVietnamBg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBIVClEw_mtH3SK_Wlcg7YpOjb0KOlIenfV9I1_Tn0Ym7dEXLX6Y3X8rZoGVTf4-2aDhzywcNJuJjMvoiaTVr1lMhTRnc4H0aiNDO2oOHgwhC0CmTpxAy50OA_PxxvCgjMb2gyAOJ-TZ9Ygeumg43VThxcHtxi8C5M03nTEtiK9cl1y5JzSH5VH7C-d6b_p-8zn0gCKt1Vh9ZFL5y6RGOh6o0rzx2ccsgMIUUzEhizdtB7TZnw3Puc',
  
  // Destination Photos
  hoanKiemSunrise: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDrIwgAq9cOE4kwvRoQvAl3Lq9zhE2JWa9gqEQyuii2o5WtzR5BGHn3Xf9RUzRX_ZzpfcwGeF636HtcearogdPXQU7bLOs2-k3BjDaViJigTyEo7iePMQQdRI5bOtMH67JPIm5a67DeesfXYE3_GA2sihUONbXNNPc8X468MbypsD0MUh83Y6fh96TJGjU30TJti9l4JuKhH4O0zpyKKwGm6Y80cl--6yUOg7Hr3f1qYLfdO7ivqtw',
  dongXuanMarket: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCp299hwHz9sudmCQ8QPvAc2mGUSvci0SvLi1i0LtY48eIsXzchcTErt4pxbDZO-LDymhgZtgbojyfeT4sW9vAH5jS7rVWnDG0MfhY9TpE_jUYgZsyckeACjw9St7Firk0g3HEZ0o_JzPldnng6Q-e7pKUKVuQa62a3TRPMg3SdOQlpYqE_Wvrs0Id1kMH4H1myAV7pDwDUj3B3nwp0xyY1ymeNgxj2VlzauDtNaPWOL1X3wAQpHbc',
  hanoiStreetOld: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD_d8ZDvnb-DHqTvEowePFerSaSc1Gq0XofTEi5D5XZ9WFEXjRVnNeQHIbdAD0zkh4qFUTJOH35SiKdTlVeSoWw1VJ25wAGsGAy7IzSUEy2KTgh_Mlz_tIu4IDhEEMn_qqR0K-RJ2rIzoiPe8ylfCdVetk-x28pFxazFK4Ni9VHyaeAihGMrMYASNDacCMdW_G2OdZ5tUX7W1CxXL-v6HHA2a0rzwH6qGS0WE1kSEIqmwBXU52_rao',
  daNangBridge: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDSsQeV_BefjZ5QiBZ3PmO-CDVT3IBy5NXfoZ2VHn0M58mlOxXhD9GRDIkIWHrTt3kfJMoxkQj7H_KtkjV1X-FklLOtTQWnZ8G2tgGNAZtjmPLf6Gb0sD4jzcK6xC6sEKHZZH6R2a9sAuExeiHmokXHQRUKZvySbdk51tmeQVI8hAKaFh9BXdO6733zhohdI_FJTSGah_gvVppbxkDUlnE-LbiGEP_woNGqE00KWQfAejQA0kQjrl4',
  hoiAnLanterns: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDTerZgbvmAXswccfESZeuJuWp4SDcxQBYD3V2y_faDAANthMPtHEqT9PBTXMyymEBFncjvOZpGpYPVKh5cqW7ZnKCyvtmlgxmPRXXYdbnWQ2-tD3We8VoDVCUXYS6JI_pi5_bHJa8WS5YefC6mTyiWoO-nq7kNZslYheOsY2gsx-zkrTvob1nPXlVtHfZ55jPzkiUhnhK-odHavZT19lyo-munVOvsXghbFO_6Oc23dCrGYew37tM',
  hanoiEveningCycling: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvQhPFR13r5IPAmTJ8qELZlJ8OtpnWg1TgDouF6aGXjlpvEbDVecNILx3YEEQZWrjuWZMrjt4F0135DvADS_DjY8avxb0MFAc-z3Y2gWvjHrdc-I8IqAXtcsbls8NOLBuDumrIdvkATk8rwRr-XeaneTr04i4H8xJJ6lL-HdfQAxAWMgRDxe79oVVMx6kJvHQNBL0vvMuUqezZDWWtVYhBnXcOZXJYlrWMxOneVow5JXfjXq_ZouQ',
  hueFoodPho: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDvlzZ40Hx7i1FbtOob_foIQBimfPh5rFUCt3BvN5X9Sj0NS5BD1p3_b6kRz-pSG5J75nVfmuqFGTuOx0Av1FCTy0pkHzqa2XdsaSHA4j-WpoISWpmBTm7xVFCpW35bHqj0E8xN1uZ7UCbsW8qAsVX5g4fwvyjOD-y-3igiwtWpSiN60kLSSHJjmWT1MP6fuXzHBdvQwDfgzrhodjxwqBgNJKu7O2LUDP7FpsStnwwjI7iW9c-kmJk',

  // Avatars & Agency Logos
  travelerAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD7ZRTHAXE6PgMYA_YRrNIN3eOcpbBwnIf4eLby1zEU5my7qe8UuXxOOfKXlTfXOGhW-Nw8P9ua8a3ZknstenGa4TABz6rFFhwvvTqGrO4G84F-3ksdErvRrwbhA2fVDBMs82eRxVRGhZJAV37EXoQO6uEgbjvi5wndcQcBJ-saKZ1fNSBF7MP7VgTTAJUTYf2I965ErcUJNYLvF-m5k78vLPtXk-WAMnxEhZTZdEnNP6U6ehpuGjg',
  adminAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDvxAwunFjsJc5NnaNsDcV5qnER-ECj8geIe7JGv04O-D9RbD_nflAAN66Qysm-jOT5rTqTxf6-o-27MhfPaUD3v6RaRwNJh6Z7vjxbjPtKne4Zfegs84t3UXMo7_hSPL1mFDECi-d7bumXjXCfQP4ygcjWbPf40Z-kvBvoZFAsWVus43wRdZZSklOiMUk_CrsGhcMX29C94hOT9-WvACN14Wwga0MkflAyWW60SGw21q77H13Vdck',
  operatorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAvVyAMURTIqY2e53Lm2CTRpRoUyPk2uAfmBx6JH7YtJcq1uxIombl4V_LHZkHRZ2fVaS4SAdZxqRFLvIS_sqHE34sAou4swK_XH9ErULweDiGqqoslKBm_D3V1jHXdeSyqAlJOpKSSfin6Dqu7QOJHn3CK9RuYzT-vb1yN16wTClAtTTF39n3nRQuD5n0NGjwLEj565QMVQDDc7K2OkRPvmLM7iiI1mlNUog1SSMbqBcXy8JjHE0I',
  guideAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA_6Ne4EbEIlKTBWtPY8-Xxjun_cGWa0akyffc657T8zv0kICTPujWXbkOZmC64YjZXFsJAqVj25GmOFzCNN2K1BQejNySTPUPMvVgKIQ43as2P4LT_UArRZaBU3S_Tg3mToXd5vCRZOtFNMl7qeGiZoZnRVeHdEKSzfGZTWo1_nz4EbJzVP3FUqKGrwv4-1NjXM7MTIsKJEK_IZo3WPfWrKZaWF6QLr4TGw1vcmjkIue9ySQWqAzQ',
  agencyLogo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYeZBmnizFI_en5lJFngPaYVSV7a-OLxG5U2tHY5VdyFTjRJtPZxx33SB-3yhAMmHqVtli33-JWuD9FQM3MRf2k9Qdpv7Ec531QbfbgJXQpR-OriWXwewbq2_sn1fDEDHkLSbhlywtQiIuvBwGArl60gUCtd97NSc_JAPrfbI2QFUyKr6-8fHUa1XAf4757zoSjqGzrUElJfy_sKpdRm-NDjbgsvhWBkl462w3oWaHtqSpmY3CLKY',
};

export const defaultUser: UserProfile = {
  name: 'Minh',
  avatar: ASSETS.travelerAvatar,
  role: 'traveler',
  location: 'Hà Nội',
  temp: '28°C',
  weatherDesc: 'Mây nhẹ',
  pace: 'Thong thả',
  interests: ['Văn hóa', 'Ẩm thực', 'Nhiếp ảnh'],
};

export const hanoiSuggestedItinerary: ItineraryNode[] = [
  {
    id: 'node-1',
    title: 'Bún Chả Hương Liên',
    category: 'Ẩm thực',
    time: '08:30',
    duration: '1h',
    status: 'active',
    icon: 'restaurant',
    description: 'Thưởng thức món bún chả gia truyền nổi tiếng tại phố Lê Văn Hưu.',
    matchScore: 96,
  },
  {
    id: 'node-2',
    title: 'Văn Miếu',
    category: 'Lịch sử',
    time: '10:00',
    duration: '2h',
    status: 'planned',
    icon: 'account_balance',
    description: 'Quần thể di tích lịch sử và trường đại học đầu tiên của Việt Nam.',
    matchScore: 95,
  },
  {
    id: 'node-3',
    title: 'Bánh Mì Phượng',
    category: 'Ăn nhanh',
    time: '12:30',
    duration: '45m',
    status: 'planned',
    icon: 'fastfood',
    description: 'Thưởng thức bánh mì kẹp đậm đà hương vị truyền thống.',
    matchScore: 92,
  },
];

export const operatorBookings: TourBooking[] = [
  {
    id: '#TRP-8829',
    tour: 'Sapa Trekking 2D1N',
    client: 'Michael B. (2 pax)',
    status: 'Pending',
    amount: '3.2M VND',
    date: 'Hôm nay',
  },
  {
    id: '#TRP-8828',
    tour: 'Ha Long Day Cruise',
    client: 'Sarah J. (4 pax)',
    status: 'Confirmed',
    amount: '4.8M VND',
    date: 'Hôm qua',
  },
  {
    id: '#TRP-8827',
    tour: 'Hoi An Lantern Walk',
    client: 'David K. (1 pax)',
    status: 'Confirmed',
    amount: '0.5M VND',
    date: '12/08',
  },
  {
    id: '#TRP-8826',
    tour: 'Cu Chi Tunnels Half Day',
    client: 'Emily R. (3 pax)',
    status: 'Pending',
    amount: '1.5M VND',
    date: '11/08',
  },
];

export const mockTourReview: PendingTourReview = {
  id: 'REV-9921',
  tourName: 'Hanoi Old Quarter Evening Cycle',
  operatorName: 'Hanoi Heritage Travel',
  operatorAvatar: ASSETS.agencyLogo,
  rating: 4.8,
  activeTours: 12,
  submittedTime: '2 giờ trước',
  price: '899.000đ',
  duration: '3.5 Hours',
  maxPeople: 12,
  languages: 'English, Vietnamese',
  category: 'Cycling',
  matchScore: 92,
  heroImage: ASSETS.hanoiEveningCycling,
  overview: "Experience the vibrant energy of Hanoi's historic heart on this guided cycling tour. We'll navigate the 36 streets, exploring hidden alleys, sampling local street food, and learning about the rich heritage that shapes this dynamic city. Perfect for active travelers looking for an immersive cultural deep dive.",
  itinerary: [
    {
      id: 'step-1',
      title: 'Meet at Opera House',
      category: 'Tập trung',
      time: '17:00',
      icon: 'location_on',
      description: 'Bike fitting and safety briefing. Introduction to the guide.',
    },
    {
      id: 'step-2',
      title: 'Hoan Kiem Lake Circuit',
      category: 'Tham quan',
      time: '17:30',
      icon: 'pedal_bike',
      description: 'A gentle ride around the iconic lake as the city lights begin to turn on.',
    },
    {
      id: 'step-3',
      title: 'Street Food Stop: Ta Hien',
      category: 'Ẩm thực',
      time: '18:45',
      icon: 'restaurant',
      description: "Sample local delicacies like Banh Mi or Bun Cha in the bustling 'Beer Street'.",
      warning: 'Ta Hien street is pedestrian-only after 19:00 on weekends. Ensure bike parking is secured outside the zone.',
    },
    {
      id: 'step-4',
      title: 'Return to Opera House',
      category: 'Kết thúc',
      time: '20:30',
      icon: 'flag',
      description: 'Tour concludes at the starting point.',
    },
  ],
};
