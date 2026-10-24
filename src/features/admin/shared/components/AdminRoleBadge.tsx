import type { AdministrationRole } from '@/features/auth/session/authSession';

interface AdminRoleBadgeProps {
  role: AdministrationRole;
  size?: 'sm' | 'md';
  className?: string;
}

export function AdminRoleBadge({ role, size = 'sm', className = '' }: AdminRoleBadgeProps) {
  const isStaff = role === 'Staff';

  const badgeStyles = isStaff
    ? 'border-[#758B74] bg-[#E8EFE9] text-[#1C2923]'
    : 'border-[#B87558] bg-[#F7EBE5] text-[#7A3F26]';

  const sizeStyles =
    size === 'sm'
      ? 'px-2.5 py-0.5 text-[11px] gap-1'
      : 'px-3 py-1 text-xs gap-1.5';

  const iconName = isStaff ? 'support_agent' : 'shield_person';
  const roleLabel = isStaff ? 'STAFF OPERATOR' : 'ADMINISTRATOR';

  return (
    <span
      className={`inline-flex items-center font-bold tracking-wider uppercase rounded-full border shadow-xs transition-colors ${badgeStyles} ${sizeStyles} ${className}`}
      data-testid="admin-role-badge"
    >
      <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
        {iconName}
      </span>
      <span>{roleLabel}</span>
    </span>
  );
}
