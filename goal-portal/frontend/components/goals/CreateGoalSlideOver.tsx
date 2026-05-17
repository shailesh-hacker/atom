'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Hash, Calendar, Percent, ToggleRight, CheckCircle, Share2, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

const goalSchema = z.object({
  thrustArea: z.string().min(1, 'Thrust area is required'),
  title: z.string().min(5, 'Title must be at least 5 characters').max(120, 'Title cannot exceed 120 characters'),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional().or(z.literal('')),
  uom: z.enum(['NUMERIC', 'PERCENTAGE', 'TIMELINE', 'ZERO_BASED']),
  target: z.any(), // Will be validated manually or handled by input type
  weightage: z.number().min(10, 'Min weightage is 10%').max(100, 'Max weightage is 100%'),
  isInverse: z.boolean().optional(),
  employeeIds: z.array(z.string()).optional(),
  primaryOwnerId: z.string().optional(),
});

type GoalFormValues = z.infer<typeof goalSchema>;

interface CreateGoalSlideOverProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: (Partial<GoalFormValues> & { isShared?: boolean }) | null;
  currentTotalWeightage?: number;
  mode?: 'INDIVIDUAL' | 'SHARED';
  availableEmployees?: { id: string; name: string }[];
  targetEmployeeId?: string;
  lockDefinition?: boolean;
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
  { value: 'PERCENTAGE', label: 'Percentage', desc: 'Percentage target (e.g., Growth %)', icon: Percent },
  { value: 'TIMELINE', label: 'Timeline', desc: 'Date-based completion', icon: Calendar },
  { value: 'ZERO_BASED', label: 'Milestone', desc: 'Zero = success (e.g., Incidents)', icon: ToggleRight },
];

export default function CreateGoalSlideOver({
  open,
  onClose,
  onSave,
  initialData,
  currentTotalWeightage = 0,
  mode = 'INDIVIDUAL',
  availableEmployees = [],
  targetEmployeeId,
  lockDefinition = false,
}: CreateGoalSlideOverProps) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      uom: 'NUMERIC',
      target: 0,
      weightage: 10,
      employeeIds: targetEmployeeId ? [targetEmployeeId] : [],
      primaryOwnerId: '',
    },
  });

  // Reset form when slide-over opens with new data
  useEffect(() => {
    if (open) {
      let displayTarget = initialData?.target || 0;
      
      // If TIMELINE, convert numeric YYYYMMDD to YYYY-MM-DD string
      if (initialData?.uom === 'TIMELINE' && typeof displayTarget === 'number' && displayTarget > 10000000) {
        const s = String(displayTarget);
        displayTarget = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` as any;
      }

      reset({
        thrustArea: initialData?.thrustArea || '',
        title: initialData?.title || '',
        description: initialData?.description || '',
        uom: initialData?.uom || 'NUMERIC',
        target: displayTarget,
        weightage: initialData?.weightage || 10,
        isInverse: initialData?.isInverse ?? false,
        employeeIds: targetEmployeeId ? [targetEmployeeId] : [],
        primaryOwnerId: initialData?.primaryOwnerId || '',
      });
    }
  }, [open, initialData, reset, targetEmployeeId]);

  const handleFormSubmit = (values: GoalFormValues) => {
    const finalData = { ...values };
    
    // If TIMELINE, convert YYYY-MM-DD string to numeric YYYYMMDD
    if (finalData.uom === 'TIMELINE' && typeof finalData.target === 'string') {
      finalData.target = Number(finalData.target.replace(/-/g, ''));
    } else if (typeof finalData.target === 'string') {
      finalData.target = Number(finalData.target);
    }
    
    onSave(finalData);
  };

  const titleValue = watch('title') || '';
  const uomValue = watch('uom');
  const weightageValue = watch('weightage') || 0;
  const selectedEmployeeIds = watch('employeeIds') || [];
  const primaryOwnerIdValue = watch('primaryOwnerId') || '';
  const remainingWeightage = 100 - currentTotalWeightage;

  if (!open) return null;

  const isEditMode = !!initialData;
  const isSharedGoal = !!initialData?.isShared;
  const isReadOnlyDefinition = isSharedGoal || (isEditMode && lockDefinition);

  const toggleEmployee = (id: string) => {
    const current = selectedEmployeeIds;
    let next: string[];
    if (current.includes(id)) {
      next = current.filter((eid) => eid !== id);
    } else {
      next = [...current, id];
    }
    setValue('employeeIds', next);

    // If current primary owner is removed or none selected, default to first selected
    if (next.length > 0 && !next.includes(primaryOwnerIdValue)) {
      setValue('primaryOwnerId', next[0]);
    } else if (next.length === 0) {
      setValue('primaryOwnerId', '');
    }
  };

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
              {isEditMode ? (isSharedGoal ? 'Edit Shared Goal' : 'Edit Goal') : mode === 'SHARED' ? 'Assign Shared Goal' : 'Create Goal'}
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              Define objective parameters for assignment.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-background rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="flex-1 overflow-y-auto custom-scrollbar flex flex-col"
        >
          <div className="p-6 space-y-6 flex-1">
            {/* Shared Goal premium Notice Banner */}
            {isReadOnlyDefinition && (
              <div className="flex items-start gap-2.5 text-xs text-brand bg-brand-light/40 p-4 rounded-xl border border-brand/10 shadow-sm leading-relaxed text-brand">
                <Lock size={15} className="mt-0.5 shrink-0 text-brand" />
                <div>
                  <strong>Goal Definition Locked:</strong> Core parameters are read-only. You are authorized to adjust the <strong>weightage</strong> only to align your goal sheet.
                </div>
              </div>
            )}

            {/* Employee Selection (Only for Shared) */}
            {mode === 'SHARED' && (
              <div className="space-y-3 bg-surface-container-low border border-border p-4 rounded-xl">
                <label className="block text-sm font-semibold text-text-primary">
                  Assign to Employees <span className="text-danger">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-border rounded-md bg-background">
                  {availableEmployees.map((emp) => (
                    <label key={emp.id} className="flex items-center gap-2 p-2 hover:bg-surface rounded cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedEmployeeIds.includes(emp.id)}
                        onChange={() => toggleEmployee(emp.id)}
                        className="rounded border-border text-brand focus:ring-brand"
                      />
                      <span className="text-sm text-text-primary">{emp.name}</span>
                    </label>
                  ))}
                </div>
                {selectedEmployeeIds.length === 0 && <p className="text-xs text-danger">Select at least one employee</p>}

                {/* Primary Owner Designation */}
                {selectedEmployeeIds.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider" htmlFor="primaryOwnerSelect">
                      Designate Primary Owner <span className="text-danger">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="primaryOwnerSelect"
                        value={primaryOwnerIdValue}
                        onChange={(e) => setValue('primaryOwnerId', e.target.value)}
                        className="w-full appearance-none bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand shadow-sm transition-shadow"
                        required
                      >
                        <option value="" disabled>Select primary owner...</option>
                        {availableEmployees
                          .filter((emp) => selectedEmployeeIds.includes(emp.id))
                          .map((emp) => (
                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                          ))}
                      </select>
                    </div>
                    <p className="text-[10px] text-text-secondary">This user's achievement updates will automatically synchronize across all recipients' goal sheets.</p>
                  </div>
                )}
              </div>
            )}

            {/* Employee Selection (For Individual Global Assignment) */}
            {mode === 'INDIVIDUAL' && !targetEmployeeId && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-text-primary" htmlFor="employeeSelect">
                  Assign to Employee <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <select
                    id="employeeSelect"
                    value={selectedEmployeeIds[0] || ''}
                    onChange={(e) => setValue('employeeIds', [e.target.value])}
                    className="w-full appearance-none bg-surface border border-border rounded-md px-4 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand shadow-sm transition-shadow"
                    required
                  >
                    <option value="" disabled>Select an employee</option>
                    {availableEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                {selectedEmployeeIds.length === 0 && <p className="text-xs text-danger">Please select an employee</p>}
              </div>
            )}

            {/* Thrust Area */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-text-primary" htmlFor="thrustArea">
                Thrust Area <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <select
                  {...register('thrustArea')}
                  id="thrustArea"
                  disabled={isReadOnlyDefinition}
                  className="w-full appearance-none bg-surface border border-border rounded-md px-4 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand shadow-sm transition-shadow disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="" disabled>Select an organizational thrust area</option>
                  {thrustAreaOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              {errors.thrustArea && <p className="text-sm text-danger">{errors.thrustArea.message}</p>}
            </div>

            {/* Goal Title */}
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <label className="block text-sm font-semibold text-text-primary" htmlFor="goalTitle">
                  Goal Title <span className="text-danger">*</span>
                </label>
                <span className="text-xs text-text-secondary">{titleValue.length} / 120</span>
              </div>
              <input
                {...register('title')}
                id="goalTitle"
                type="text"
                disabled={isReadOnlyDefinition}
                placeholder="What is the objective?"
                className="w-full border border-border rounded-md px-4 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand disabled:opacity-60 disabled:cursor-not-allowed"
              />
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
                disabled={isReadOnlyDefinition}
                placeholder="Details about the expected outcome..."
                className="w-full border border-border rounded-md px-4 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <hr className="border-border" />

            {/* Unit of Measure */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-text-primary">Measurement Metric</label>
              <div className="grid grid-cols-2 gap-3">
                {uomOptions.map((opt) => {
                  const isSelected = uomValue === opt.value;
                  const isDisabled = isReadOnlyDefinition;
                  return (
                    <label key={opt.value} className={cn('relative flex cursor-pointer rounded-lg border p-4 transition-colors', isSelected ? 'border-2 border-brand bg-brand-light' : 'border-border bg-surface hover:bg-background', isDisabled && 'opacity-65 cursor-not-allowed')}>
                      <input type="radio" {...register('uom')} value={opt.value} disabled={isDisabled} className="sr-only" />
                      <span className="flex flex-col">
                        <span className={cn('flex items-center gap-2 text-sm font-semibold', isSelected ? 'text-brand' : 'text-text-primary')}>
                          <opt.icon size={16} />
                          {opt.label}
                        </span>
                        <span className="mt-1 text-xs text-text-secondary">{opt.desc}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Inverse Logic Toggle */}
            {(uomValue === 'NUMERIC' || uomValue === 'PERCENTAGE') && (
              <div className="flex items-center justify-between p-4 bg-surface rounded-lg border border-border">
                <div>
                  <p className="text-sm font-semibold text-text-primary">Lower is better?</p>
                  <p className="text-xs text-text-secondary">Enable if lower values represent success (e.g. TAT, Cost)</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" {...register('isInverse')} disabled={isReadOnlyDefinition} className="sr-only peer" />
                  <div className="w-11 h-6 bg-border peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
                </label>
              </div>
            )}

            {/* Target & Weightage */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-surface-container-low rounded-lg border border-border border-dashed">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-text-primary" htmlFor="target">Target</label>
                <input
                  type={uomValue === 'TIMELINE' ? 'date' : 'number'}
                  {...register('target', { valueAsNumber: uomValue !== 'TIMELINE' })}
                  id="target"
                  disabled={isReadOnlyDefinition}
                  className="w-full border border-border rounded-md px-4 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-text-primary" htmlFor="weightage">Weightage (%)</label>
                <input
                  type="number"
                  {...register('weightage', { valueAsNumber: true })}
                  id="weightage"
                  className="w-full border border-border rounded-md px-4 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  min={10}
                  max={100}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border bg-background flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-text-secondary hover:text-text-primary">Cancel</button>
            <button type="submit" className="px-6 py-2.5 text-sm font-semibold bg-brand text-white rounded-lg shadow-sm hover:bg-brand-dark transition-colors">
              {isEditMode ? 'Update' : mode === 'SHARED' ? 'Assign Shared Goal' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
