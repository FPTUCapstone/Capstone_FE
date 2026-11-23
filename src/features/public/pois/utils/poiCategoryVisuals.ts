export type PoiCategoryVisualKind =
  | 'food'
  | 'beach'
  | 'culture'
  | 'museum'
  | 'nature'
  | 'entertainment'
  | 'stay'
  | 'default';

export interface PoiCategoryVisual {
  kind: PoiCategoryVisualKind;
  backdropClass: string;
  medallionClass: string;
  captionClass: string;
  badgeClass: string;
}

const VISUALS: Record<PoiCategoryVisualKind, PoiCategoryVisual> = {
  food: {
    kind: 'food',
    backdropClass: 'bg-[linear-gradient(135deg,#F7EFE4_0%,#EFE3D1_100%)]',
    medallionClass: 'bg-white/85 text-[#9A4A1C] ring-1 ring-[#9A4A1C]/15',
    captionClass: 'text-[#7C4321]',
    badgeClass: 'bg-[#F5ECE0] text-[#8A4117]',
  },
  beach: {
    kind: 'beach',
    backdropClass: 'bg-[linear-gradient(135deg,#E3F2F3_0%,#D4EAEF_100%)]',
    medallionClass: 'bg-white/85 text-[#0E5E6F] ring-1 ring-[#0E5E6F]/15',
    captionClass: 'text-[#155462]',
    badgeClass: 'bg-[#E2F1F3] text-[#0E5E6F]',
  },
  culture: {
    kind: 'culture',
    backdropClass: 'bg-[linear-gradient(135deg,#F3EFE6_0%,#E8E0CF_100%)]',
    medallionClass: 'bg-white/85 text-[#6E4B1F] ring-1 ring-[#6E4B1F]/15',
    captionClass: 'text-[#5D4220]',
    badgeClass: 'bg-[#F1ECE0] text-[#66461D]',
  },
  museum: {
    kind: 'museum',
    backdropClass: 'bg-[linear-gradient(135deg,#ECEFF4_0%,#DFE5EE_100%)]',
    medallionClass: 'bg-white/85 text-[#374B63] ring-1 ring-[#374B63]/15',
    captionClass: 'text-[#394B61]',
    badgeClass: 'bg-[#EAEEF4] text-[#33465C]',
  },
  nature: {
    kind: 'nature',
    backdropClass: 'bg-[linear-gradient(135deg,#E6F1EA_0%,#D7E8DD_100%)]',
    medallionClass: 'bg-white/85 text-[#175B43] ring-1 ring-[#175B43]/15',
    captionClass: 'text-[#1D5340]',
    badgeClass: 'bg-[#E5F1EA] text-[#175B43]',
  },
  entertainment: {
    kind: 'entertainment',
    backdropClass: 'bg-[linear-gradient(135deg,#F6ECEF_0%,#EEDEE4_100%)]',
    medallionClass: 'bg-white/85 text-[#8A3053] ring-1 ring-[#8A3053]/15',
    captionClass: 'text-[#732B47]',
    badgeClass: 'bg-[#F5E8ED] text-[#832D4E]',
  },
  stay: {
    kind: 'stay',
    backdropClass: 'bg-[linear-gradient(135deg,#E9EFF0_0%,#DAE4E6_100%)]',
    medallionClass: 'bg-white/85 text-[#174B4A] ring-1 ring-[#174B4A]/15',
    captionClass: 'text-[#1E4747]',
    badgeClass: 'bg-[#E6EFEF] text-[#174B4A]',
  },
  default: {
    kind: 'default',
    backdropClass: 'bg-[linear-gradient(135deg,#E9F0ED_0%,#DDE7E4_100%)]',
    medallionClass: 'bg-white/85 text-[#174B4A] ring-1 ring-[#174B4A]/15',
    captionClass: 'text-[#365452]',
    badgeClass: 'bg-[#E8F0EA] text-[#174B4A]',
  },
};

export function resolvePoiCategoryKind(categoryName?: string | null): PoiCategoryVisualKind {
  const normalized = (categoryName ?? '').trim().toLowerCase();
  if (!normalized) return 'default';

  if (
    normalized.includes('food') ||
    normalized.includes('drink') ||
    normalized.includes('ẩm thực') ||
    normalized.includes('ăn uống') ||
    normalized.includes('cafe') ||
    normalized.includes('restaurant')
  ) {
    return 'food';
  }

  if (normalized.includes('beach') || normalized.includes('biển') || normalized.includes('đảo')) {
    return 'beach';
  }

  if (normalized.includes('museum') || normalized.includes('bảo tàng')) {
    return 'museum';
  }

  if (
    normalized.includes('theme park') ||
    normalized.includes('water park') ||
    normalized.includes('giải trí') ||
    normalized.includes('công viên')
  ) {
    return 'entertainment';
  }

  if (
    normalized.includes('nature') ||
    normalized.includes('natural') ||
    normalized.includes('thiên nhiên')
  ) {
    return 'nature';
  }

  if (
    normalized.includes('lưu trú') ||
    normalized.includes('resort') ||
    normalized.includes('hotel') ||
    normalized.includes('khách sạn')
  ) {
    return 'stay';
  }

  if (
    normalized.includes('culture') ||
    normalized.includes('văn hóa') ||
    normalized.includes('di sản') ||
    normalized.includes('danh lam') ||
    normalized.includes('tâm linh') ||
    normalized.includes('tôn giáo')
  ) {
    return 'culture';
  }

  return 'default';
}

export function getPoiCategoryVisual(categoryName?: string | null): PoiCategoryVisual {
  return VISUALS[resolvePoiCategoryKind(categoryName)];
}
