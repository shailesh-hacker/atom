'use client';

import { cn } from '@/lib/utils';

type RoleType = 'EMPLOYEE' | 'MANAGER' | 'ADMIN';

const roleConfig: Record<RoleType, { label: string; bg: string; text: string }> = {
  EMPLOYEE: { label: 'Employee', bg: 'bg-info-light',    text: 'text-blue-700' },
  MANAGER:  { label: 'Manager',  bg: 'bg-brand-light',   text: 'text-brand' },
  ADMIN:    { label: 'Admin',    bg: 'bg-warning-light',  text: 'text-amber-700' },
};

interface RoleBadgeProps {
  role: RoleType;
  className?: string;
}

export default function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = roleConfig[role] || roleConfig.EMPLOYEE;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        config.bg,
        config.text,
        className
      )}
    >
      {config.label}
    </span>
  );
}
