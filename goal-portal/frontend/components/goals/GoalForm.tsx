'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Target, Info } from 'lucide-react';

const goalSchema = z.object({
  thrustArea: z.string().min(1, 'Thrust area is required'),
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().optional(),
  uom: z.enum(['NUMERIC', 'PERCENTAGE', 'TIMELINE', 'ZERO_BASED']),
  target: z.number().min(0, 'Target must be positive'),
  weightage: z.number().min(10, 'Min weightage is 10%').max(100, 'Max weightage is 100%'),
});

type GoalFormValues = z.infer<typeof goalSchema>;

export default function GoalForm({ initialData }: { initialData?: any }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: initialData || {
      uom: 'PERCENTAGE',
      target: 0,
      weightage: 10,
    },
  });

  const onSubmit = (data: GoalFormValues) => {
    console.log(data);
    // Handle submission logic
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
          <Target size={24} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">{initialData ? 'Edit Goal' : 'Create New Goal'}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Thrust Area</label>
          <input
            {...register('thrustArea')}
            placeholder="e.g. Innovation, Sales, Operations"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          {errors.thrustArea && <p className="text-xs text-red-500 font-medium">{errors.thrustArea.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Goal Title</label>
          <input
            {...register('title')}
            placeholder="What do you want to achieve?"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          {errors.title && <p className="text-xs text-red-500 font-medium">{errors.title.message}</p>}
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="text-sm font-bold text-slate-700">Description</label>
          <textarea
            {...register('description')}
            rows={3}
            placeholder="Add some context to your goal..."
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Unit of Measure (UoM)</label>
          <select
            {...register('uom')}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none bg-white"
          >
            <option value="NUMERIC">Numeric</option>
            <option value="PERCENTAGE">Percentage</option>
            <option value="TIMELINE">Timeline</option>
            <option value="ZERO_BASED">Zero-Based</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Target Value</label>
          <input
            type="number"
            {...register('target', { valueAsNumber: true })}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          {errors.target && <p className="text-xs text-red-500 font-medium">{errors.target.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 flex justify-between">
            Weightage (%)
            <span className="text-blue-600 font-bold">Min 10%</span>
          </label>
          <input
            type="number"
            {...register('weightage', { valueAsNumber: true })}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          {errors.weightage && <p className="text-xs text-red-500 font-medium">{errors.weightage.message}</p>}
        </div>
      </div>

      <div className="pt-6 flex justify-end gap-4 border-t border-slate-100 mt-8">
        <button type="button" className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <button type="submit" className="px-8 py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all">
          Save Goal
        </button>
      </div>
    </form>
  );
}
