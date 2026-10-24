'use client';

export interface CategoryTabItem {
  id: string;
  label: string;
  icon: string;
  countLabel?: string;
}

interface AnalyticsCategoryTabsProps {
  categories: CategoryTabItem[];
  activeCategoryId: string;
  onSelectCategory: (id: string) => void;
  ariaLabel?: string;
}

export function AnalyticsCategoryTabs({
  categories,
  activeCategoryId,
  onSelectCategory,
  ariaLabel = 'Analytics Category Navigation',
}: AnalyticsCategoryTabsProps) {
  return (
    <nav
      aria-label={ariaLabel}
      className="mb-6 flex flex-wrap items-center gap-2 overflow-x-auto pb-1 scrollbar-thin"
    >
      {categories.map((cat) => {
        const isActive = activeCategoryId === cat.id;

        return (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelectCategory(cat.id)}
            className={`group inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
              isActive
                ? 'bg-[#245747] text-white shadow-xs'
                : 'border border-[#E6E4DD] bg-[#FFFFFF] text-[#4A5851] hover:border-[#758B74] hover:text-[#1C2923]'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[18px] transition-colors ${
                isActive ? 'text-white' : 'text-[#758B74] group-hover:text-[#245747]'
              }`}
              aria-hidden="true"
            >
              {cat.icon}
            </span>
            <span>{cat.label}</span>
            {cat.countLabel && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  isActive ? 'bg-[#1C2923] text-[#A3D2BA]' : 'bg-[#F2F1ED] text-[#4A5851]'
                }`}
              >
                {cat.countLabel}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
