'use client';

import StatusChip from '@/components/shared/StatusChip';
import { Lock, Pencil, Trash2, Share2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GoalCardProps {
  goal: {
    id: string;
    thrustArea: string;
    title: string;
    description?: string;
    uom: string;
    target: number;
    weightage: number;
    status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'RETURNED' | 'COMPLETED';
    locked: boolean;
    isShared: boolean;
  };
  onEdit?: (goal: any) => void;
  onDelete?: (id: string) => void;
  onSubmitWork?: (id: string) => void;
}

const uomLabels: Record<string, string> = {
  NUMERIC: 'Numeric',
  PERCENTAGE: 'Percentage',
  TIMELINE: 'Timeline',
  ZERO_BASED: 'Zero-Based',
};

export default function GoalCard({ goal, onEdit, onDelete, onSubmitWork }: GoalCardProps) {


  return (
    <div className="bg-surface rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-6 pb-0">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-brand-light px-2.5 py-0.5 text-xs font-semibold text-brand">
              {goal.thrustArea}
            </span>
            {goal.isShared && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-600">
                <Share2 size={12} />
                Shared
              </span>
            )}
          </div>
          <StatusChip status={goal.status} />
        </div>

        <h3 className="text-base font-semibold text-text-primary mb-1">{goal.title}</h3>
        <p className="text-sm text-text-secondary line-clamp-2 mb-4">
          {goal.description || 'No description provided.'}
        </p>
      </div>

      {/* Metadata Divider */}
      <div className="border-t border-border mx-6" />

      {/* Stats */}
      <div className="px-6 py-3 flex items-center gap-6 text-sm">
        <div>
          <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">UoM</span>
          <p className="font-semibold text-text-primary">{uomLabels[goal.uom] || goal.uom}</p>
        </div>
        <div>
          <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">Target</span>
          <p className="font-semibold text-text-primary">
            {goal.uom === 'PERCENTAGE' ? `${goal.target}%` : 
             goal.uom === 'TIMELINE' ? (
               (() => {
                 const s = String(goal.target);
                 return s.length === 8 ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` : goal.target;
               })()
             ) : goal.target}
          </p>
        </div>
        <div>
          <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">Weightage</span>
          <p className="font-semibold text-text-primary">{goal.weightage}%</p>
        </div>
      </div>

      {/* Footer Divider */}
      <div className="border-t border-border mx-6" />

      {/* Actions */}
      <div className="px-6 py-3 flex items-center justify-between">
        <div>
          {goal.locked && (
            <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary font-medium bg-surface-container-low px-2 py-1 rounded">
              <Lock size={12} />
              Definition Locked
            </span>
          )}
        </div>
        
        <div className="flex justify-end gap-2">
          {(goal.status === 'DRAFT' || goal.status === 'RETURNED' || goal.status === 'PENDING') && !goal.locked ? (
            <>
              {onEdit && (
                <button
                  onClick={() => onEdit(goal)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-brand hover:bg-brand-light rounded-lg transition-colors"
                  aria-label="Edit goal"
                >
                  <Pencil size={14} />
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(goal.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-danger hover:bg-danger-light rounded-lg transition-colors"
                  aria-label="Delete goal"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              )}
            </>
          ) : goal.status === 'APPROVED' ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-success font-medium bg-success-light/30 px-2 py-1 rounded">
              <CheckCircle size={14} />
              Approved
            </span>
          ) : goal.status === 'PENDING' ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary font-medium">
              Pending Manager Review
            </span>
          ) : goal.status === 'COMPLETED' ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-success font-medium bg-success-light/30 px-2 py-1 rounded">
              <CheckCircle size={14} />
              Final Work Approved
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
