'use client';

import { useState, useEffect } from 'react';
import { Loader2, Target, TrendingUp, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGoals } from '@/hooks/useGoals';
import CheckinModal from '@/components/checkins/CheckinModal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

const getCurrentQuarter = () => {
  const month = new Date().getMonth();
  if (month < 3) return 'Q1';
  if (month < 6) return 'Q2';
  if (month < 9) return 'Q3';
  return 'Q4';
};

export default function CheckinsPage() {
  const queryClient = useQueryClient();
  const { data: goals = [], isLoading } = useGoals();
  const [selectedQuarter, setSelectedQuarter] = useState(getCurrentQuarter());
  const [activeGoal, setActiveGoal] = useState<any>(null);

  const [activeCycle, setActiveCycle] = useState<any>(null);
  const [cycleLoading, setCycleLoading] = useState(true);

  useEffect(() => {
    api.get('/cycles/active')
      .then(({ data }) => {
        setActiveCycle(data);
        if (data) {
          const phaseToQuarter: Record<string, string> = {
            Q1_CHECKIN: 'Q1', Q2_CHECKIN: 'Q2', Q3_CHECKIN: 'Q3', Q4_CHECKIN: 'Q4',
          };
          const activeQuarter = phaseToQuarter[data.phase];
          if (activeQuarter) {
            setSelectedQuarter(activeQuarter);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to fetch active cycle', err);
      })
      .finally(() => {
        setCycleLoading(false);
      });
  }, []);

  const checkinMutation = useMutation({
    mutationFn: (data: any) => api.post('/checkins', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Progress updated successfully!');
      setActiveGoal(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to save check-in'),
  });

  // Only show approved or completed goals for check-ins
  const approvedGoals = goals.filter((g: any) => ['APPROVED', 'COMPLETED'].includes(g.status));

  if (isLoading || cycleLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Quarterly Check-ins</h1>
          <p className="text-sm text-text-secondary mt-1">Log your progress for approved goals.</p>
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
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Quarterly Check-ins — {selectedQuarter} 2025</h1>
          <p className="text-sm text-text-secondary mt-1">Log your achievement data and track progress against targets.</p>
        </div>

        {/* Quarter selector */}
        <div className="flex bg-background border border-border rounded-lg p-1 shadow-sm">
          {quarters.map((q) => {
            const phaseToQuarter: Record<string, string> = {
              Q1_CHECKIN: 'Q1', Q2_CHECKIN: 'Q2', Q3_CHECKIN: 'Q3', Q4_CHECKIN: 'Q4',
            };
            const activeQuarter = activeCycle ? phaseToQuarter[activeCycle.phase] : null;
            const isDisabled = activeQuarter ? q !== activeQuarter : true;

            return (
              <button
                key={q}
                onClick={() => !isDisabled && setSelectedQuarter(q)}
                disabled={isDisabled}
                className={cn(
                  'px-4 py-1.5 text-sm font-semibold rounded-md transition-all duration-200',
                  selectedQuarter === q
                    ? 'bg-surface text-brand shadow-sm'
                    : 'text-text-secondary hover:text-text-primary',
                  isDisabled && 'opacity-40 cursor-not-allowed hover:text-text-secondary hover:bg-transparent'
                )}
                title={isDisabled ? `Quarter ${q} is locked during the current phase` : `Select Quarter ${q}`}
              >
                {q}
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface rounded-xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Target size={18} className="text-brand" />
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">Approved Goals</span>
          </div>
          <p className="text-2xl font-bold text-text-primary">{approvedGoals.length}</p>
          <p className="text-xs text-text-secondary mt-1">active for execution</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp size={18} className="text-success" />
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">Updates ({selectedQuarter})</span>
          </div>
          <p className="text-2xl font-bold text-text-primary">
            {approvedGoals.filter((g: any) => g.updates?.some((u: any) => u.quarter === selectedQuarter)).length}
          </p>
          <p className="text-xs text-text-secondary mt-1">logged this quarter</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">Avg. Progress</span>
          </div>
          <p className="text-2xl font-bold text-text-primary">
            {approvedGoals.length > 0 
              ? Math.round(approvedGoals.reduce((sum: number, g: any) => {
                  const latest = g.updates ? [...g.updates].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] : null;
                  return sum + (latest?.progressScore || 0);
                }, 0) / approvedGoals.length * 100)
              : 0}%
          </p>
          <p className="text-xs text-text-secondary mt-1">across all goals</p>
        </div>
      </div>

      {/* Goals list for check-in */}
      {(() => {
        const phaseToQuarter: Record<string, string> = {
          Q1_CHECKIN: 'Q1', Q2_CHECKIN: 'Q2', Q3_CHECKIN: 'Q3', Q4_CHECKIN: 'Q4',
        };
        const activeQuarter = activeCycle ? phaseToQuarter[activeCycle.phase] : null;
        const isCheckinLocked = !activeQuarter;

        return (
          <>
            {isCheckinLocked && (
              <div className="flex items-start gap-3 bg-danger/10 border border-danger/20 text-danger rounded-xl p-4 text-sm mb-6 shadow-sm">
                <AlertCircle className="mt-0.5 shrink-0" size={18} />
                <div>
                  <strong className="block font-semibold">Check-ins are currently locked</strong>
                  {activeCycle?.phase === 'GOAL_SETTING' ? (
                    <span>The cycle is currently in the Goal Setting phase. Check-ins will open once your manager starts the execution phase.</span>
                  ) : activeCycle?.phase === 'CLOSED' ? (
                    <span>This cycle has been closed. No further progress logging is permitted.</span>
                  ) : (
                    <span>There is currently no active goal cycle or check-in phase. Please check with your Administrator.</span>
                  )}
                </div>
              </div>
            )}

            {approvedGoals.length === 0 ? (
        <div className="bg-surface rounded-xl border border-dashed border-border p-12 text-center shadow-sm">
          <Target size={48} className="mx-auto text-text-secondary/40 mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-1">No approved goals</h3>
          <p className="text-sm text-text-secondary">
            Goals need to be approved by your manager before you can log check-in progress.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {approvedGoals.map((goal: any) => {
            const latestUpdate = goal.updates
              ? [...goal.updates]
                  .filter((u: any) => u.quarter === selectedQuarter)
                  .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
              : null;

            const score = latestUpdate?.progressScore != null
              ? Math.round(latestUpdate.progressScore * 100)
              : null;

            return (
              <div
                key={goal.id}
                className="bg-surface rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-brand bg-brand-light px-2.5 py-0.5 rounded-full">
                        {goal.thrustArea}
                      </span>
                      <span className="text-xs font-medium text-text-secondary">
                        Wt: {goal.weightage}%
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-text-primary mt-2">{goal.title}</h3>

                    <div className="flex items-center gap-6 mt-3">
                      <div>
                        <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Target</p>
                        <p className="text-sm font-semibold text-text-primary">
                          {goal.uom === 'PERCENTAGE' ? `${goal.target}%` : goal.target}
                        </p>
                      </div>
                      {latestUpdate && (
                        <>
                          <div>
                            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Achievement</p>
                            <p className="text-sm font-semibold text-brand">
                              {goal.uom === 'PERCENTAGE' ? `${latestUpdate.achievement}%` : latestUpdate.achievement}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Score</p>
                            <p className={cn('text-sm font-bold',
                              score != null && score >= 80 ? 'text-success' : score != null && score >= 50 ? 'text-warning' : 'text-danger'
                            )}>
                              {score != null ? `${score}%` : '—'}
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    {latestUpdate && (
                      <div className="mt-3">
                        <div className="w-full max-w-xs bg-border rounded-full h-2 overflow-hidden">
                          <div
                            className={cn(
                              'h-2 rounded-full transition-all duration-300',
                              score != null && score >= 80 ? 'bg-success' : score != null && score >= 50 ? 'bg-warning' : 'bg-danger'
                            )}
                            style={{ width: `${Math.min(score || 0, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {!isCheckinLocked && (
                    <button
                      onClick={() => setActiveGoal(goal)}
                      className="bg-brand/10 text-brand px-4 py-2 rounded-lg font-semibold text-sm hover:bg-brand/20 transition-colors shrink-0 ml-4 shadow-sm"
                    >
                      {latestUpdate ? 'Update' : 'Log Progress'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
          </>
        );
      })()}

      {/* Check-in Modal */}
      {activeGoal && (
        <CheckinModal
          open={!!activeGoal}
          onClose={() => setActiveGoal(null)}
          onSave={(data) =>
            checkinMutation.mutate({
              ...data,
              goalId: activeGoal.id,
              quarter: selectedQuarter,
            })
          }
          goal={activeGoal}
          quarter={selectedQuarter}
          initialAchievement={
            activeGoal.updates?.find((u: any) => u.quarter === selectedQuarter)?.achievement || 0
          }
          initialComment={
            activeGoal.updates?.find((u: any) => u.quarter === selectedQuarter)?.comment || ''
          }
        />
      )}
    </div>
  );
}
