'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Hash, Calendar, Percent, ToggleRight, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const goalSchema = z.object({
  thrustArea: z.string().min(1, 'Thrust area is required'),
  title: z.string().min(5, 'Title must be at least 5 characters').max(120, 'Title cannot exceed 120 characters'),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional().or(z.literal('')),
  uom: z.enum(['NUMERIC', 'NUMERIC_MAX', 'TIMELINE', 'ZERO_BASED']),
  target: z.number({ error: 'Target is required' }).min(0, 'Target must be positive'),
  weightage: z.number().min(10, 'Min weightage is 10%').max(100, 'Max weightage is 100%'),
});

type GoalFormValues = z.infer<typeof goalSchema>;

interface CreateGoalSlideOverProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: GoalFormValues) => void;
  initialData?: Partial<GoalFormValues>;
  currentTotalWeightage?: number;
}

const thrustAreaOptions = [
  'Sales & Revenue',
  'Operations',
  'People & Culture',
  'Finance',
  'Customer Experience',
  'Technology',
  'Compliance',
];

const uomOptions = [
  { value: 'NUMERIC', label: 'Numeric', desc: 'Higher is better (e.g., Revenue)', icon: Hash },
  { value: 'NUMERIC_MAX', label: 'Numeric (Max)', desc: 'Lower is better (e.g., Cost)', icon: Hash },
  { value: 'TIMELINE', label: 'Timeline', desc: 'Date-based completion', icon: Calendar },
  { value: 'ZERO_BASED', label: 'Milestone', desc: 'Zero = success (e.g., Incidents)', icon: ToggleRight },
];

export default function CreateGoalSlideOver({
  open,
  onClose,
  onSave,
  initialData,
  currentTotalWeightage = 0,
}: CreateGoalSlideOverProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      uom: 'NUMERIC',
      target: 0,
      weightage: 10,
      ...initialData,
    },
  });

  const titleValue = watch('title') || '';
  const uomValue = watch('uom');
  const weightageValue = watch('weightage') || 0;
  const remainingWeightage = 100 - currentTotalWeightage;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full max-w-[560px] h-full bg-surface shadow-2xl flex flex-col border-l border-border z-10">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-2xl font-semibold text-text-primary">
              {initialData ? 'Edit Goal' : 'Create Goal'}
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              Define objective parameters and measurement metrics.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-background rounded-full transition-colors"
            aria-label="Close panel"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit(onSave)}
          className="flex-1 overflow-y-auto custom-scrollbar flex flex-col"
        >
          <div className="p-6 space-y-6 flex-1">
            {/* Thrust Area */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-text-primary" htmlFor="thrustArea">
                Thrust Area <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <select
                  {...register('thrustArea')}
                  id="thrustArea"
                  className="w-full appearance-none bg-surface border border-border rounded-md px-4 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand shadow-sm transition-shadow"
                >
                  <option value="" disabled>Select an organizational thrust area</option>
                  {thrustAreaOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-secondary">
                  <span className="material-symbols-outlined text-lg">expand_more</span>
                </div>
              </div>
              {errors.thrustArea && <p className="text-sm text-danger">{errors.thrustArea.message}</p>}
            </div>

            {/* Goal Title */}
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <label
                  className={cn('block text-sm font-semibold', errors.title ? 'text-danger' : 'text-text-primary')}
                  htmlFor="goalTitle"
                >
                  Goal Title <span className="text-danger">*</span>
                </label>
                <span className={cn('text-xs font-medium', titleValue.length > 120 ? 'text-danger' : 'text-text-secondary')}>
                  {titleValue.length} / 120
                </span>
              </div>
              <div className="relative">
                <input
                  {...register('title')}
                  id="goalTitle"
                  type="text"
                  placeholder="What do you want to achieve?"
                  className={cn(
                    'w-full border rounded-md px-4 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 shadow-sm transition-shadow',
                    errors.title
                      ? 'border-danger bg-danger-light/20 focus:ring-danger/20 focus:border-danger'
                      : 'border-border bg-surface focus:ring-brand/20 focus:border-brand'
                  )}
                />
                {errors.title && (
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-danger">
                    <span className="material-symbols-outlined text-lg">error</span>
                  </div>
                )}
              </div>
              {errors.title && <p className="text-sm text-danger">{errors.title.message}</p>}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-text-primary" htmlFor="goalDescription">
                Description <span className="text-sm text-text-secondary font-normal">(Optional)</span>
              </label>
              <textarea
                {...register('description')}
                id="goalDescription"
                rows={3}
                placeholder="Provide context or specific details about how this goal will be achieved..."
                className="w-full bg-surface border border-border rounded-md px-4 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand shadow-sm transition-shadow resize-none"
              />
            </div>

            <hr className="border-border" />

            {/* Unit of Measure (Radio Group Cards) */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-text-primary">
                Unit of Measure <span className="text-danger">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {uomOptions.map((opt) => {
                  const isSelected = uomValue === opt.value;
                  return (
                    <label
                      key={opt.value}
                      className={cn(
                        'relative flex cursor-pointer rounded-lg border p-4 transition-colors',
                        isSelected
                          ? 'border-2 border-brand bg-brand-light'
                          : 'border-border bg-surface hover:bg-background'
                      )}
                    >
                      <input
                        type="radio"
                        {...register('uom')}
                        value={opt.value}
                        className="sr-only"
                      />
                      <span className="flex flex-1 flex-col">
                        <span className={cn(
                          'flex items-center gap-2 text-sm font-semibold',
                          isSelected ? 'text-brand' : 'text-text-primary'
                        )}>
                          <opt.icon size={16} className={isSelected ? 'text-brand' : 'text-text-secondary'} />
                          {opt.label}
                        </span>
                        <span className="mt-1 text-xs text-text-secondary">{opt.desc}</span>
                      </span>
                      {isSelected && (
                        <CheckCircle size={18} className="text-brand ml-2 self-start shrink-0" />
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Target & Weightage Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-surface-container-low rounded-lg border border-border border-dashed">
              {/* Target */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-text-primary" htmlFor="target">
                  {uomValue === 'TIMELINE' ? 'Target Date' : 'Target Value'} <span className="text-danger">*</span>
                </label>
                <input
                  type={uomValue === 'TIMELINE' ? 'date' : 'number'}
                  {...register('target', { valueAsNumber: uomValue !== 'TIMELINE' })}
                  id="target"
                  className="w-full bg-surface border border-border rounded-md px-4 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand shadow-sm transition-shadow"
                />
                {errors.target && <p className="text-sm text-danger">{errors.target.message}</p>}
              </div>

              {/* Weightage */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-text-primary flex items-center gap-2" htmlFor="weightage">
                  Weightage (%)
                  <span className="material-symbols-outlined text-base text-text-secondary cursor-help" title="Overall impact of this goal">info</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    {...register('weightage', { valueAsNumber: true })}
                    id="weightage"
                    min={10}
                    max={100}
                    placeholder="e.g. 25"
                    className="w-full bg-surface border border-border rounded-md px-4 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand shadow-sm transition-shadow"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-secondary text-sm">
                    %
                  </div>
                </div>
                <p className="text-xs text-text-secondary">
                  Min 10%. Remaining available: <span className={cn('font-semibold', remainingWeightage < weightageValue ? 'text-danger' : 'text-success')}>{remainingWeightage}%</span>
                </p>
                {errors.weightage && <p className="text-sm text-danger">{errors.weightage.message}</p>}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border bg-background flex items-center justify-end gap-3 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-container-low rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-semibold bg-brand text-white rounded-lg shadow-sm hover:bg-brand-dark transition-colors flex items-center gap-2"
            >
              {initialData ? 'Update Goal' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
