'use client';

import { cn } from '@/lib/utils';

interface WeightageBarProps {
  goals: { thrustArea: string; weightage: number }[];
}

const thrustColors: Record<string, string> = {
  'Sales & Revenue': 'bg-brand',
  'Operations': 'bg-info',
  'People & Culture': 'bg-success',
  'Finance': 'bg-warning',
  'Customer Experience': 'bg-purple-500',
  'Technology': 'bg-cyan-500',
  'Compliance': 'bg-pink-500',
  'Productivity': 'bg-brand',
  'Learning': 'bg-info',
  'Market Growth & Expansion': 'bg-brand',
  'Product Innovation': 'bg-success',
  'Operational Efficiency': 'bg-warning',
  'Team Culture & Retention': 'bg-purple-500',
};

export default function WeightageBar({ goals }: WeightageBarProps) {
  const total = goals.reduce((sum, g) => sum + g.weightage, 0);
  const isValid = total === 100;

  return (
    <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-text-primary">Weightage Distribution</h4>
        <span
          className={cn(
            'text-sm font-bold',
            isValid ? 'text-success' : 'text-danger'
          )}
        >
          Total: {total}%
        </span>
      </div>

      {/* Stacked Bar */}
      <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden flex">
        {goals.map((g, i) => (
          <div
            key={i}
            className={cn(
              'h-full transition-all duration-300',
              thrustColors[g.thrustArea] || 'bg-brand',
              i === 0 && 'rounded-l-full',
              i === goals.length - 1 && 'rounded-r-full'
            )}
            style={{ width: `${g.weightage}%` }}
            title={`${g.thrustArea}: ${g.weightage}%`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-3">
        {goals.map((g, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-text-secondary">
            <div className={cn('h-2.5 w-2.5 rounded-full', thrustColors[g.thrustArea] || 'bg-brand')} />
            <span>{g.thrustArea}: {g.weightage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
