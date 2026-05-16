'use client';

import { useState } from 'react';
import { Plus, Send, AlertCircle, Loader2, Lock } from 'lucide-react';
import GoalCard from '@/components/goals/GoalCard';
import WeightageBar from '@/components/goals/WeightageBar';
import CreateGoalSlideOver from '@/components/goals/CreateGoalSlideOver';
import CheckinModal from '@/components/checkins/CheckinModal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import EmptyState from '@/components/shared/EmptyState';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useGoals } from '@/hooks/useGoals';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

const getCurrentQuarter = () => {
  const month = new Date().getMonth();
  if (month < 3) return 'Q1';
  if (month < 6) return 'Q2';
  if (month < 9) return 'Q3';
  return 'Q4';
};

export default function GoalsPage() {
  const queryClient = useQueryClient();
  const { data: goals = [], isLoading, error } = useGoals();

  const [slideOver, setSlideOver] = useState<{ open: boolean; goal: any | null }>({ open: false, goal: null });
  const [checkinModal, setCheckinModal] = useState<{ open: boolean; goalId: string | null }>({ open: false, goalId: null });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; goalId: string | null }>({ open: false, goalId: null });

  const currentQuarter = getCurrentQuarter();

  // ── Update Goal Mutation (Fix 5: Edit Goal Wiring) ──
  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/goals/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Goal updated successfully!');
      setSlideOver({ open: false, goal: null });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update goal'),
  });

  // ── Create Goal Mutation ──
  const createGoalMutation = useMutation({
    mutationFn: (data: any) => api.post('/goals', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Goal created successfully!');
      setSlideOver({ open: false, goal: null });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to create goal'),
  });

  // ── Submit All Mutation ──
  const submitMutation = useMutation({
    mutationFn: () => api.post('/goals/submit'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('All goals submitted for approval!');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to submit goals'),
  });

  // ── Check-in Mutation ──
  const checkinMutation = useMutation({
    mutationFn: (data: any) => api.post('/checkins', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Check-in saved successfully!');
      setCheckinModal({ open: false, goalId: null });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to save check-in'),
  });

  // ── Submit Work Mutation ──
  const submitWorkMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/goals/${id}/submit`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Work submitted for manager review!');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to submit work'),
  });

  const totalWeightage = goals.reduce((sum: number, g: any) => sum + g.weightage, 0);
  const isWeightageValid = totalWeightage === 100;
  const canAddGoal = goals.length < 8;
  const hasDraftGoals = goals.some((g: any) => g.status === 'DRAFT');

  const activeCheckinGoal = goals.find((g: any) => g.id === checkinModal.goalId);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">My Goal Sheet</h1>
          <p className="text-sm text-text-secondary mt-1">FY 2025–26 · Goal Setting Phase</p>
        </div>
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 size={32} className="animate-spin text-brand" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Assigned Objectives</h1>
          <p className="text-sm text-text-secondary mt-1">Review and execute goals assigned by your manager.</p>
          <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold text-brand bg-brand-light/50 px-2 py-0.5 rounded uppercase tracking-wider border border-brand/10">
            <Lock size={10} />
            Managed by Organization
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Weightage Meter (Circular) */}
          <div className="flex items-center gap-3">
            <div className={cn(
              'h-12 w-12 rounded-full border-4 flex items-center justify-center text-sm font-bold',
              isWeightageValid
                ? 'border-success text-success'
                : totalWeightage > 100
                  ? 'border-danger text-danger'
                  : 'border-warning text-warning'
            )}>
              {totalWeightage}
            </div>
            <div>
              <p className="text-xs font-medium text-text-secondary">/ 100%</p>
            </div>
          </div>
        </div>
      </div>



      {/* Return reason banner */}
      {goals.some((g: any) => g.status === 'RETURNED' && g.returnReason) && (
        <div className="flex items-start gap-2 text-sm text-danger bg-danger-light px-4 py-3 rounded-lg border border-danger/20">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <div>
            <strong>Goal(s) returned for rework:</strong>
            {goals.filter((g: any) => g.status === 'RETURNED' && g.returnReason).map((g: any) => (
              <p key={g.id} className="mt-1">• <strong>{g.title}:</strong> {g.returnReason}</p>
            ))}
          </div>
        </div>
      )}

      {/* Goal List */}
      {goals.length === 0 ? (
        <EmptyState
          title="No goals assigned"
          description="Your manager hasn't assigned any goals to you for this cycle yet."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map((goal: any) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onSubmitWork={(id) => submitWorkMutation.mutate(id)}
              onEdit={(goal) => setSlideOver({ open: true, goal })}
            />
          ))}
        </div>
      )}

      {/* Weightage Distribution Bar */}
      {goals.length > 0 && <WeightageBar goals={goals} />}

      {/* Edit Goal Slide-Over */}
      <CreateGoalSlideOver
        open={slideOver.open}
        onClose={() => setSlideOver({ open: false, goal: null })}
        onSave={(data) => {
          if (slideOver.goal) {
            updateGoalMutation.mutate({ id: slideOver.goal.id, data });
          } else {
            createGoalMutation.mutate(data);
          }
        }}
        initialData={slideOver.goal}
      />

      {/* Check-in Modal */}
      {activeCheckinGoal && (
        <CheckinModal
          open={checkinModal.open}
          onClose={() => setCheckinModal({ open: false, goalId: null })}
          onSave={(data) => checkinMutation.mutate({ ...data, goalId: activeCheckinGoal.id, quarter: currentQuarter })}
          goal={activeCheckinGoal}
          quarter={currentQuarter}
        />
      )}

    </div>
  );
}
