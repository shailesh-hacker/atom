'use client';

import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CheckinModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { achievement: number; statusUpdate: string; comment: string }) => void;
  goal: {
    id: string;
    title: string;
    target: number;
    uom: string;
  };
  quarter: string;
  initialAchievement?: number;
  initialComment?: string;
}

export default function CheckinModal({ 
  open, 
  onClose, 
  onSave, 
  goal, 
  quarter,
  initialAchievement = 0,
  initialComment = ''
}: CheckinModalProps) {
  const [achievement, setAchievement] = useState<number | ''>(initialAchievement || '');
  const [statusUpdate, setStatusUpdate] = useState('ON_TRACK');
  const [comment, setComment] = useState(initialComment);

  if (!open) return null;

  // Compute progress score
  const numericAchievement = achievement === '' ? 0 : achievement;
  let score = 0;
  if (goal.uom === 'ZERO_BASED') {
    score = numericAchievement === 0 ? 100 : 0;
  } else if (goal.target > 0) {
    score = Math.round((numericAchievement / goal.target) * 100);
  }
  const clampedScore = Math.min(score, 100);

  const statusOptions = [
    { value: 'NOT_STARTED', label: 'Not Started' },
    { value: 'ON_TRACK', label: 'On Track' },
    { value: 'COMPLETED', label: 'Completed' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-inverse-surface/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl bg-surface rounded-xl shadow-md border border-border flex flex-col m-4 max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex justify-between items-center shrink-0">
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">
              {goal.title}
            </p>
            <h2 className="text-lg font-semibold text-text-primary">{quarter} Check-in</h2>
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors rounded-full p-1 hover:bg-background"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          {/* Progress Preview Panel */}
          <div className="bg-surface-container-low border border-border rounded-lg p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Current Progress</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-1">Target</p>
                <p className="text-sm font-semibold text-text-primary">
                  {goal.uom === 'PERCENTAGE' ? `${goal.target}%` : goal.target}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-1">Achievement to Date</p>
                <p className="text-sm font-semibold text-brand">
                  {goal.uom === 'PERCENTAGE' ? `${achievement}%` : achievement}
                </p>
              </div>
            </div>
            <div className="w-full bg-border rounded-full h-2.5 mb-2 overflow-hidden">
              <div
                className={cn(
                  'h-2.5 rounded-full transition-all duration-300',
                  clampedScore >= 80 ? 'bg-success' : clampedScore >= 50 ? 'bg-warning' : 'bg-danger'
                )}
                style={{ width: `${clampedScore}%` }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-text-secondary">0%</span>
              <span className="text-brand font-semibold">{clampedScore}% Score</span>
              <span className="text-text-secondary">100%</span>
            </div>
            <p className="text-xs text-text-secondary mt-2">
              Score = Achievement ÷ Target ({goal.uom === 'ZERO_BASED' ? 'Zero-Based' : 'Min type'})
            </p>
          </div>

          {/* Achievement Input */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2" htmlFor="achievement">
              {quarter} Achievement Value
            </label>
            <div className="relative">
              <input
                type="number"
                id="achievement"
                value={achievement}
                onChange={(e) => setAchievement(e.target.value === '' ? '' : Number(e.target.value))}
                step="0.1"
                className="w-full bg-surface border border-border rounded-md px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors pr-10"
              />
              {goal.uom === 'PERCENTAGE' && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-text-secondary text-sm">%</span>
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-text-secondary">
              Enter the cumulative value achieved as of {quarter} end.
            </p>
          </div>

          {/* Status Segmented Control */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">Goal Status</label>
            <div className="grid grid-cols-3 gap-2 bg-background border border-border p-1 rounded-lg">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatusUpdate(opt.value)}
                  className={cn(
                    'py-2 text-center rounded-md text-sm transition-colors',
                    statusUpdate === opt.value
                      ? 'bg-surface-variant text-text-primary font-medium shadow-sm'
                      : 'text-text-secondary hover:bg-surface-variant/50'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes Textarea */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2" htmlFor="notes">
              Check-in Notes
            </label>
            <textarea
              id="notes"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Provide context on performance, challenges, and next steps..."
              className="w-full bg-surface border border-border rounded-md px-4 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-surface rounded-b-xl flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-brand bg-transparent border border-border hover:bg-background rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (achievement === '') {
                toast.error('Please enter an achievement value.');
                return;
              }
              if (achievement > goal.target) {
                toast.error(`Achievement value (${achievement}) cannot exceed the assigned target value (${goal.target}).`);
                return;
              }
              onSave({ achievement: Number(achievement), statusUpdate, comment });
            }}
            className="px-4 py-2 text-sm font-semibold text-white bg-brand rounded-lg shadow-sm hover:bg-brand-dark transition-colors flex items-center gap-2"
          >
            <Save size={16} />
            Save Update
          </button>
        </div>
      </div>
    </div>
  );
}
