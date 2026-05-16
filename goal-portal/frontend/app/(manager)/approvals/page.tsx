'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import { Check, X, Loader2, Target, CheckCircle2, AlertCircle } from 'lucide-react';
import StatusChip from '@/components/shared/StatusChip';
import EmptyState from '@/components/shared/EmptyState';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function ApprovalsPage() {
  const [teamData, setTeamData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchTeamGoals = useCallback(async () => {
    try {
      const { data } = await api.get('/goals/team');
      setTeamData(data);
    } catch (err: any) {
      toast.error('Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeamGoals();
  }, [fetchTeamGoals]);

  const handleApprove = async (goalId: string) => {
    setActionLoading(goalId);
    try {
      await api.patch(`/goals/${goalId}/approve`);
      toast.success('Goal approved and locked.');
      fetchTeamGoals();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to approve goal');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReturn = async (goalId: string) => {
    const reason = window.prompt('Please enter a reason for returning this goal:');
    if (!reason) return;

    setActionLoading(goalId);
    try {
      await api.patch(`/goals/${goalId}/return`, { reason });
      toast.success('Goal returned for rework.');
      fetchTeamGoals();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to return goal');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveAll = async (employee: any) => {
    const submittedGoals = employee.goals.filter((g: any) => g.status === 'PENDING');
    try {
      await Promise.all(submittedGoals.map((g: any) => api.patch(`/goals/${g.id}/approve`)));
      toast.success(`All ${submittedGoals.length} goals approved for ${employee.name}`);
      fetchTeamGoals();
    } catch (err: any) {
      toast.error('Some goals failed to approve');
    }
  };

  const handleReturnAll = async (employee: any) => {
    const submittedGoals = employee.goals.filter((g: any) => g.status === 'PENDING');
    if (submittedGoals.length === 0) return;

    const reason = window.prompt(`Please enter a reason for returning ${submittedGoals.length} goals for ${employee.name}:`);
    if (!reason) return;

    try {
      await Promise.all(submittedGoals.map((g: any) => api.patch(`/goals/${g.id}/return`, { reason })));
      toast.success(`All goals returned for rework for ${employee.name}`);
      fetchTeamGoals();
    } catch (err: any) {
      toast.error('Some goals failed to return');
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Pending Approvals</h1>
          <p className="text-sm text-text-secondary mt-1">Review goals submitted by your team.</p>
        </div>
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 size={32} className="animate-spin text-brand" />
        </div>
      </div>
    );
  }

  // Filter to only users who have at least one PENDING goal
  const usersWithPending = teamData.filter((user) => 
    user.goals?.some((g: any) => g.status === 'PENDING')
  );

  const totalPending = usersWithPending.reduce((sum, user) => sum + user.goals.filter((g: any) => g.status === 'PENDING').length, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary flex items-center gap-2">
            Pending Approvals
            {totalPending > 0 && (
              <span className="bg-brand text-white text-xs py-0.5 px-2 rounded-full">
                {totalPending}
              </span>
            )}
          </h1>
          <p className="text-sm text-text-secondary mt-1">Review goals submitted by your team for the current cycle.</p>
        </div>
      </div>

      {usersWithPending.length === 0 ? (
        <EmptyState
          title="All Caught Up!"
          description="There are no pending goals awaiting your approval at this time."
        />
      ) : (
        <div className="space-y-8">
          {usersWithPending.map((user) => {
            const pendingGoals = user.goals.filter((g: any) => g.status === 'PENDING');
            
            return (
              <div key={user.id} className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
                {/* Employee Header */}
                <div className="bg-surface-container-low px-6 py-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-brand-light text-brand rounded-full flex items-center justify-center font-bold">
                      {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">{user.name}</h3>
                      <p className="text-xs text-text-secondary">{pendingGoals.length} pending goals</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReturnAll(user)}
                      className="px-4 py-2 text-sm font-semibold text-danger bg-surface border border-danger/20 hover:bg-danger-light rounded-lg transition-colors"
                    >
                      Return All
                    </button>
                    <button
                      onClick={() => handleApproveAll(user)}
                      className="px-4 py-2 text-sm font-semibold text-white bg-success hover:bg-emerald-600 rounded-lg shadow-sm transition-colors"
                    >
                      Approve All
                    </button>
                  </div>
                </div>

                {/* Goals List */}
                <div className="divide-y divide-border">
                  {pendingGoals.map((goal: any) => (
                    <div key={goal.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-background transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-brand bg-brand-light px-2 py-0.5 rounded-full">{goal.thrustArea}</span>
                          <StatusChip status={goal.status} />
                          {goal.locked ? (
                            <span className="text-[10px] font-bold text-success bg-success-light/50 px-2 py-0.5 rounded uppercase border border-success/10 flex items-center gap-1">
                              <CheckCircle2 size={10} />
                              Work Approval
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-brand bg-brand-light/50 px-2 py-0.5 rounded uppercase border border-brand/10 flex items-center gap-1">
                              <Target size={10} />
                              Goal Setting
                            </span>
                          )}
                        </div>
                        <h4 className="font-medium text-text-primary mb-1">{goal.title}</h4>
                        {goal.description && <p className="text-sm text-text-secondary mb-3">{goal.description}</p>}
                        
                        <div className="flex items-center gap-4 text-xs font-medium text-text-secondary">
                          <div className="bg-background px-3 py-1.5 rounded-md border border-border">
                            Target: <span className="text-text-primary">{goal.target} {goal.uom === 'PERCENTAGE' ? '%' : ''}</span>
                          </div>
                          <div className="bg-background px-3 py-1.5 rounded-md border border-border">
                            Weightage: <span className="text-text-primary">{goal.weightage}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 md:pl-6 md:border-l border-border shrink-0">
                        <button
                          onClick={() => handleApprove(goal.id)}
                          disabled={actionLoading === goal.id}
                          className="flex items-center justify-center h-10 w-10 rounded-full bg-success-light text-success hover:bg-success hover:text-white transition-colors disabled:opacity-50"
                          aria-label="Approve goal"
                          title="Approve Goal"
                        >
                          {actionLoading === goal.id ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} strokeWidth={2.5} />}
                        </button>
                        <button
                          onClick={() => handleReturn(goal.id)}
                          disabled={actionLoading === goal.id}
                          className="flex items-center justify-center h-10 w-10 rounded-full bg-danger-light text-danger hover:bg-danger hover:text-white transition-colors disabled:opacity-50"
                          aria-label="Return goal"
                          title="Return for Rework"
                        >
                          <X size={18} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
