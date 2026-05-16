'use client';

import { cn } from '@/lib/utils';

type StatusType = 'DRAFT' | 'PENDING' | 'APPROVED' | 'RETURNED' | 'NOT_STARTED' | 'ON_TRACK' | 'COMPLETED';

const statusConfig: Record<StatusType, { label: string; bg: string; text: string }> = {
  DRAFT:       { label: 'Draft',       bg: 'bg-gray-100',        text: 'text-gray-600' },
  PENDING:     { label: 'Not Approved',  bg: 'bg-warning-light',   text: 'text-amber-700' },
  APPROVED:    { label: 'Not Completed', bg: 'bg-success-light',   text: 'text-emerald-700' },
  RETURNED:    { label: 'Returned',      bg: 'bg-danger-light',    text: 'text-red-700' },
  NOT_STARTED: { label: 'Not Started',   bg: 'bg-gray-100',        text: 'text-gray-600' },
  ON_TRACK:    { label: 'On Track',      bg: 'bg-info-light',      text: 'text-blue-700' },
  COMPLETED:   { label: 'Completed',     bg: 'bg-success-light',   text: 'text-emerald-700' },
};

interface StatusChipProps {
  status: StatusType;
  className?: string;
}

export default function StatusChip({ status, className }: StatusChipProps) {
  const config = statusConfig[status] || statusConfig.DRAFT;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide',
        config.bg,
        config.text,
        className
      )}
    >
      {config.label}
    </span>
  );
}
