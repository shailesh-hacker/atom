'use client';

import { useState, useEffect } from 'react';
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
import { useAuth } from '@/hooks/useAuth';

const getCurrentQuarter = () => {
  const month = new Date().getMonth();
  if (month < 3) return 'Q1';
  if (month < 6) return 'Q2';
  if (month < 9) return 'Q3';
  return 'Q4';
};

export default function GoalsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: goals = [], isLoading, error } = useGoals();

  const [slideOver, setSlideOver] = useState<{ open: boolean; goal: any | null }>({ open: false, goal: null });
  const [checkinModal, setCheckinModal] = useState<{ open: boolean; goalId: string | null }>({ open: false, goalId: null });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; goalId: string | null }>({ open: false, goalId: null });

  const [activeCycle, setActiveCycle] = useState<any>(null);
  const [cycleLoading, setCycleLoading] = useState(true);

  useEffect(() => {
    api.get('/cycles/active')
      .then(({ data }) => {
        setActiveCycle(data);
      })
      .catch((err) => {
        console.error('Failed to fetch active cycle', err);
      })
      .finally(() => {
        setCycleLoading(false);
      });
  }, []);

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

  // ── Delete Goal Mutation ──
  const deleteGoalMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/goals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Goal deleted successfully!');
      setDeleteDialog({ open: false, goalId: null });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to delete goal'),
  });

  const totalWeightage = goals.reduce((sum: number, g: any) => sum + g.weightage, 0);
  const isWeightageValid = totalWeightage === 100;
  const canAddGoal = goals.length < 8;
  const hasDraftGoals = goals.some((g: any) => g.status === 'DRAFT');

  const activeCheckinGoal = goals.find((g: any) => g.id === checkinModal.goalId);

  if (isLoading || cycleLoading) {
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

  const hasReturnedGoals = goals.some((g: any) => g.status === 'RETURNED');
  const isPendingApproval = goals.some((g: any) => g.status === 'PENDING');
  const allApproved = goals.length > 0 && goals.every((g: any) => g.status === 'APPROVED' || g.status === 'COMPLETED');
  const isGoalSettingActive = activeCycle?.phase === 'GOAL_SETTING';
  const isEditableSheet = isGoalSettingActive;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">My Goal Sheet</h1>
          <p className="text-sm text-text-secondary mt-1">Define, track, and submit your objectives for the current cycle.</p>
          <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold text-brand bg-brand-light/50 px-2 py-1 rounded uppercase tracking-wider border border-brand/10">
            {allApproved 
              ? 'Approved & Locked' 
              : isPendingApproval 
                ? 'Pending Approval' 
                : activeCycle 
                  ? `Phase: ${activeCycle.phase.replace('_', ' ')}` 
                  : 'Goal Setting Phase'}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Weightage Meter (Circular) */}
          <div className="flex items-center gap-3 bg-surface border border-border p-2.5 rounded-xl shadow-sm">
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
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Total Weightage</p>
              <p className="text-xs text-text-secondary mt-0.5">/ 100% required</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {canAddGoal && isEditableSheet && (
              <button
                onClick={() => setSlideOver({ open: true, goal: null })}
                className="bg-brand text-white px-4 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-brand-dark transition-colors shadow-sm"
              >
                <Plus size={18} />
                Create Goal
              </button>
            )}

            {(hasDraftGoals || hasReturnedGoals) && (
              <button
                onClick={() => submitMutation.mutate()}
                disabled={!isWeightageValid || submitMutation.isPending}
                className={cn(
                  "px-4 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 transition-colors shadow-sm border",
                  isWeightageValid 
                    ? "bg-success text-white border-success hover:bg-emerald-600 cursor-pointer" 
                    : "bg-surface text-text-secondary border-border cursor-not-allowed"
                )}
              >
                {submitMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                Submit Goal Sheet
              </button>
            )}
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
          title="Your goal sheet is empty"
          description="Click 'Create Goal' to start adding objectives for this performance cycle."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map((goal: any) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onSubmitWork={(id) => submitWorkMutation.mutate(id)}
              onEdit={(goal) => setSlideOver({ open: true, goal })}
              onDelete={(id) => setDeleteDialog({ open: true, goalId: id })}
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
        currentTotalWeightage={totalWeightage - (slideOver.goal?.weightage || 0)}
        lockDefinition={true}
        targetEmployeeId={user?.id}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, goalId: null })}
        onConfirm={() => {
          if (deleteDialog.goalId) {
            deleteGoalMutation.mutate(deleteDialog.goalId);
          }
        }}
        title="Delete Goal"
        description="Are you sure you want to delete this goal? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deleteGoalMutation.isPending}
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
