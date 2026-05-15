'use client';

import { useState } from 'react';
import { Plus, Send, AlertCircle } from 'lucide-react';
import GoalCard from '@/components/goals/GoalCard';
import WeightageBar from '@/components/goals/WeightageBar';
import CreateGoalSlideOver from '@/components/goals/CreateGoalSlideOver';
import CheckinModal from '@/components/checkins/CheckinModal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import EmptyState from '@/components/shared/EmptyState';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Mock data
const initialGoals = [
  {
    id: '1',
    thrustArea: 'Sales & Revenue',
    title: 'Increase Q3 revenue in the APAC region',
    description: 'Launch three new specialized product lines targeted at enterprise clients to drive regional revenue growth.',
    uom: 'NUMERIC',
    target: 500000,
    weightage: 30,
    status: 'APPROVED' as const,
    locked: true,
    isShared: false,
  },
  {
    id: '2',
    thrustArea: 'Technology',
    title: 'Complete platform migration to microservices',
    description: 'Decompose the monolithic application into 5 core microservices with full CI/CD pipelines.',
    uom: 'NUMERIC',
    target: 5,
    weightage: 25,
    status: 'DRAFT' as const,
    locked: false,
    isShared: false,
  },
  {
    id: '3',
    thrustArea: 'Operations',
    title: 'Reduce customer support response time by 40%',
    description: 'Implement AI-powered ticket routing and self-service knowledge base.',
    uom: 'PERCENTAGE',
    target: 40,
    weightage: 20,
    status: 'SUBMITTED' as const,
    locked: false,
    isShared: false,
  },
  {
    id: '4',
    thrustArea: 'People & Culture',
    title: 'Achieve 90% employee engagement score',
    description: 'Run quarterly pulse surveys and act on the top 3 improvement areas each cycle.',
    uom: 'PERCENTAGE',
    target: 90,
    weightage: 15,
    status: 'RETURNED' as const,
    locked: false,
    isShared: true,
  },
];

export default function GoalsPage() {
  const [goals, setGoals] = useState(initialGoals);
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [checkinModal, setCheckinModal] = useState<{ open: boolean; goalId: string | null }>({ open: false, goalId: null });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; goalId: string | null }>({ open: false, goalId: null });

  const totalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0);
  const isWeightageValid = totalWeightage === 100;
  const canAddGoal = goals.length < 8;

  const handleSaveGoal = (data: any) => {
    const newGoal = {
      id: String(Date.now()),
      ...data,
      status: 'DRAFT' as const,
      locked: false,
      isShared: false,
    };
    setGoals([...goals, newGoal]);
    setSlideOverOpen(false);
    toast.success('Goal created successfully!');
  };

  const handleDeleteGoal = () => {
    if (deleteDialog.goalId) {
      setGoals(goals.filter((g) => g.id !== deleteDialog.goalId));
      setDeleteDialog({ open: false, goalId: null });
      toast.success('Goal deleted.');
    }
  };

  const handleSubmitAll = () => {
    setGoals(goals.map((g) => (g.status === 'DRAFT' ? { ...g, status: 'SUBMITTED' as const } : g)));
    toast.success('All goals submitted for approval!');
  };

  const handleCheckin = (data: any) => {
    toast.success('Check-in saved successfully!');
    setCheckinModal({ open: false, goalId: null });
  };

  const activeCheckinGoal = goals.find((g) => g.id === checkinModal.goalId);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">My Goal Sheet</h1>
          <p className="text-sm text-text-secondary mt-1">FY 2025–26 · Goal Setting Phase</p>
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

          {/* Add Goal */}
          <button
            onClick={() => setSlideOverOpen(true)}
            disabled={!canAddGoal}
            className="bg-brand text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-brand-dark transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={18} />
            Add Goal
          </button>

          {/* Submit All */}
          <button
            onClick={handleSubmitAll}
            disabled={!isWeightageValid}
            className={cn(
              'px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition-colors shadow-sm',
              isWeightageValid
                ? 'bg-brand text-white hover:bg-brand-dark'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            )}
          >
            <Send size={16} />
            Submit for Approval
          </button>
        </div>
      </div>

      {/* Weightage warning */}
      {!isWeightageValid && goals.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-warning bg-warning-light px-4 py-3 rounded-lg border border-warning/20">
          <AlertCircle size={16} />
          <span>Total weightage must equal 100% before submission. Current: {totalWeightage}%</span>
        </div>
      )}

      {/* Goal List */}
      {goals.length === 0 ? (
        <EmptyState
          title="No goals yet"
          description="Click 'Add Goal' to get started with your quarterly objectives."
          action={
            <button
              onClick={() => setSlideOverOpen(true)}
              className="bg-brand text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-brand-dark transition-colors"
            >
              <Plus size={18} />
              Add Goal
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={() => {/* TODO: open slide-over with pre-filled data */}}
              onDelete={(id) => setDeleteDialog({ open: true, goalId: id })}
              onCheckin={(id) => setCheckinModal({ open: true, goalId: id })}
            />
          ))}
        </div>
      )}

      {/* Weightage Distribution Bar */}
      {goals.length > 0 && <WeightageBar goals={goals} />}

      {/* Create Goal Slide-over */}
      <CreateGoalSlideOver
        open={slideOverOpen}
        onClose={() => setSlideOverOpen(false)}
        onSave={handleSaveGoal}
        currentTotalWeightage={totalWeightage}
      />

      {/* Check-in Modal */}
      {activeCheckinGoal && (
        <CheckinModal
          open={checkinModal.open}
          onClose={() => setCheckinModal({ open: false, goalId: null })}
          onSave={handleCheckin}
          goal={activeCheckinGoal}
          quarter="Q1"
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, goalId: null })}
        onConfirm={handleDeleteGoal}
        title="Delete this goal?"
        description="This action cannot be undone. The goal will be permanently removed."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
