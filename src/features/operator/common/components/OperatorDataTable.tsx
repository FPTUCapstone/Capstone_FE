import type { ReactNode } from 'react';

export interface TableColumn<T> {
  key: string;
  title: string;
  render: (item: T, index: number) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  align?: 'left' | 'center' | 'right';
  sticky?: 'left' | 'right';
}

export interface OperatorDataTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  loading?: boolean;
  emptyMessage?: string;
  skeletonRowCount?: number;
  className?: string;
}

export function OperatorDataTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyMessage = 'Không có dữ liệu phù hợp.',
  skeletonRowCount = 4,
  className = '',
}: OperatorDataTableProps<T>) {
  const getAlignClass = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      default:
        return 'text-left';
    }
  };

  const getStickyClass = (sticky?: 'left' | 'right') => {
    switch (sticky) {
      case 'left':
        return 'sticky left-0 z-10 bg-white shadow-[2px_0_4px_-1px_rgba(0,0,0,0.05)]';
      case 'right':
        return 'sticky right-0 z-10 bg-white shadow-[-2px_0_4px_-1px_rgba(0,0,0,0.05)]';
      default:
        return '';
    }
  };

  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {columns.map((col) => {
                const alignClass = getAlignClass(col.align);
                const stickyClass = col.sticky === 'right' ? 'sticky right-0 z-10 bg-slate-50 shadow-[-2px_0_4px_-1px_rgba(0,0,0,0.05)]' : '';
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={`px-4 py-3.5 ${alignClass} ${stickyClass} ${col.headerClassName || ''}`}
                  >
                    {col.title}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: skeletonRowCount }).map((_, rIdx) => (
                <tr key={`skeleton-${rIdx}`} data-testid="table-skeleton-row" className="animate-pulse">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3.5">
                      <div className="h-4 w-3/4 rounded bg-slate-100" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[36px] text-slate-300" aria-hidden="true">
                      inbox
                    </span>
                    <p className="text-xs font-medium text-slate-500">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, index) => {
                const rowKey = keyExtractor(item, index);
                return (
                  <tr
                    key={rowKey}
                    className="group transition-colors hover:bg-slate-50/70"
                  >
                    {columns.map((col) => {
                      const alignClass = getAlignClass(col.align);
                      const stickyClass = getStickyClass(col.sticky);
                      return (
                        <td
                          key={`${rowKey}-${col.key}`}
                          className={`px-4 py-3.5 ${alignClass} ${stickyClass} group-hover:bg-slate-50/70 ${col.cellClassName || ''}`}
                        >
                          {col.render(item, index)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
