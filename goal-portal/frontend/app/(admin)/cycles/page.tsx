'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Search, Lock, Unlock, Plus, Loader2, Calendar, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

const phaseLabels: Record<string, string> = {
  GOAL_SETTING: 'Phase 1 — Goal Setting',
  Q1_CHECKIN: 'Q1 Check-in',
  Q2_CHECKIN: 'Q2 Check-in',
  Q3_CHECKIN: 'Q3 Check-in',
  Q4_CHECKIN: 'Q4 / Annual',
  CLOSED: 'Closed',
};

const phaseTimings: Record<string, string> = {
  GOAL_SETTING: '1st May',
  Q1_CHECKIN: 'July',
  Q2_CHECKIN: 'October',
  Q3_CHECKIN: 'January',
  Q4_CHECKIN: 'March / April',
  CLOSED: 'Completed',
};

const phaseOrder = ['GOAL_SETTING', 'Q1_CHECKIN', 'Q2_CHECKIN', 'Q3_CHECKIN', 'Q4_CHECKIN', 'CLOSED'];

export default function CyclesPage() {
  const queryClient = useQueryClient();
  const [unlockSearch, setUnlockSearch] = useState('');
  const [unlockReason, setUnlockReason] = useState('');
  const [showWarning, setShowWarning] = useState(true);

  const { data: cycles = [], isLoading } = useQuery({
    queryKey: ['cycles'],
    queryFn: async () => {
      const { data } = await api.get('/cycles');
      return data;
    },
  });

  const { data: autoApprovedGoals = [] } = useQuery({
    queryKey: ['autoApprovedGoals'],
    queryFn: async () => {
      const { data } = await api.get('/goals/auto-approved');
      return data;
    },
  });

  const activeCycle = cycles.find((c: any) => c.isActive);

  const advancePhaseMutation = useMutation({
    mutationFn: ({ cycleId, phase }: { cycleId: string; phase: string }) =>
      api.patch(`/cycles/${cycleId}/phase`, { phase }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycles'] });
      queryClient.invalidateQueries({ queryKey: ['autoApprovedGoals'] });
      toast.success('Phase updated!');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update phase'),
  });

  const resetSystemMutation = useMutation({
    mutationFn: () => api.post('/cycles/reset'),
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success('System data reset successfully!');
    },
    onError: (err: any) => toast.error('Failed to reset system'),
  });

  const unlockMutation = useMutation({
    mutationFn: (goalId: string) => api.patch(`/goals/${goalId}/unlock`),
    onSuccess: () => {
      toast.success('Goal unlocked. Audit log updated.');
      setUnlockReason('');
      setUnlockSearch('');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to unlock goal'),
  });

  const getNextPhase = (currentPhase: string) => {
    const idx = phaseOrder.indexOf(currentPhase);
    if (idx < phaseOrder.length - 1) return phaseOrder[idx + 1];
    return null;
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Cycle Management</h1>
          <p className="text-sm text-text-secondary mt-1">Manage goal-setting windows and check-in phases.</p>
        </div>
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 size={32} className="animate-spin text-brand" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Cycle Management</h1>
        <p className="text-sm text-text-secondary mt-1">Manage goal-setting windows and check-in phases.</p>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          onClick={() => {
            if (confirm('CRITICAL ACTION: This will delete ALL goals and check-in updates. Continue?')) {
              resetSystemMutation.mutate();
            }
          }}
          className="text-xs font-semibold text-danger border border-danger/20 px-3 py-1.5 rounded hover:bg-danger-light transition-colors"
        >
          Reset System Data
        </button>
      </div>

      {/* Auto-Approved Goals Warning Banner */}
      {showWarning && autoApprovedGoals.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="p-2 bg-amber-100 rounded-lg text-amber-800 shrink-0">
                <Calendar size={20} className="stroke-[2.5]" />
              </span>
              <div>
                <h2 className="text-base font-bold text-amber-900">System Notice: Auto-Approved Goals</h2>
                <p className="text-sm text-amber-700 mt-1">
                  The following goals were automatically approved by the system because they were not approved by their manager in time when the check-in phase started.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowWarning(false)}
              className="text-amber-700 hover:bg-amber-100/50 p-1 rounded-lg transition-colors shrink-0"
              title="Dismiss warning"
            >
              <X size={18} className="stroke-[2.5]" />
            </button>
          </div>
          
          <div className="overflow-x-auto border border-amber-200/50 rounded-lg bg-surface">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-container-low border-b border-border font-bold text-text-secondary">
                  <th className="p-3">Employee</th>
                  <th className="p-3">Thrust Area</th>
                  <th className="p-3">Goal Title</th>
                  <th className="p-3">Target</th>
                  <th className="p-3">Weightage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-text-primary">
                {autoApprovedGoals.map((goal: any) => (
                  <tr key={goal.id} className="hover:bg-surface-container-lowest transition-colors">
                    <td className="p-3 font-medium">{goal.employee?.name || 'N/A'}</td>
                    <td className="p-3">
                      <span className="bg-brand-light/50 text-brand px-2 py-0.5 rounded font-bold uppercase text-[10px]">
                        {goal.thrustArea}
                      </span>
                    </td>
                    <td className="p-3 font-semibold">{goal.title}</td>
                    <td className="p-3 font-medium">{goal.target}</td>
                    <td className="p-3 font-bold">{goal.weightage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Active Cycle Card */}
      {activeCycle ? (
        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-text-primary">{activeCycle.name}</h2>
              <p className="text-sm text-text-secondary mt-1">
                Phase: <span className="font-semibold text-brand">{phaseLabels[activeCycle.phase] || activeCycle.phase}</span>
              </p>
              <p className="text-sm text-text-secondary">
                {new Date(activeCycle.startDate).toLocaleDateString()} → {new Date(activeCycle.endDate).toLocaleDateString()}
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-success-light px-3 py-1 text-xs font-semibold text-emerald-700 uppercase tracking-wide">
              Active
            </span>
          </div>
          <div className="flex gap-3">
            {activeCycle.phase !== 'CLOSED' && (
              <>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to CLOSE the current phase? This will prevent further goal edits and check-ins.')) {
                      advancePhaseMutation.mutate({
                        cycleId: activeCycle.id,
                        phase: 'CLOSED',
                      });
                    }
                  }}
                  className="px-4 py-2 text-sm font-semibold border border-red-200 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Close Current Phase
                </button>
                {getNextPhase(activeCycle.phase) && getNextPhase(activeCycle.phase) !== 'CLOSED' && (
                  <button
                    onClick={() => advancePhaseMutation.mutate({
                      cycleId: activeCycle.id,
                      phase: getNextPhase(activeCycle.phase)!,
                    })}
                    disabled={advancePhaseMutation.isPending}
                    className="px-4 py-2 text-sm font-semibold bg-brand text-white hover:bg-brand-dark rounded-lg transition-colors shadow-sm disabled:opacity-60 flex items-center gap-2"
                  >
                    {advancePhaseMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                    Open {phaseLabels[getNextPhase(activeCycle.phase)!]}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-dashed border-border p-8 text-center shadow-sm">
          <Calendar size={48} className="mx-auto text-text-secondary/40 mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-1">No active cycle</h3>
          <p className="text-sm text-text-secondary">Create and activate a cycle to begin.</p>
        </div>
      )}

      {/* Phase Timeline */}
      {activeCycle && (
        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Phase Timeline</h3>
            <p className="text-xs text-text-secondary mt-0.5">Track and control active intervals in real-time.</p>
          </div>
          <div className="flex items-center gap-0 overflow-x-auto pb-4">
            {phaseOrder.map((phase, i) => {
              const isActive = activeCycle.phase === phase;
              const isPast = phaseOrder.indexOf(activeCycle.phase) > i;

              return (
                <div key={phase} className="flex items-center">
                  <div className="flex flex-col items-center min-w-[140px]">
                    <div className={cn(
                      'h-4 w-4 rounded-full border-2',
                      isActive
                        ? 'bg-brand border-brand'
                        : isPast
                          ? 'bg-success border-success'
                          : 'bg-surface border-border'
                    )} />
                    <p className={cn(
                      'text-xs font-semibold mt-2 text-center whitespace-nowrap',
                      isActive ? 'text-brand' : isPast ? 'text-success' : 'text-text-secondary'
                    )}>
                      {phaseLabels[phase]}
                    </p>
                    <p className="text-[10px] text-text-secondary font-medium mt-0.5 italic">
                      {phaseTimings[phase]}
                    </p>
                    {isActive && (
                      <span className="inline-flex items-center rounded-full bg-brand-light px-2 py-0.5 text-[9px] font-bold text-brand uppercase tracking-wide mt-1">
                        active
                      </span>
                    )}
                    {isPast && (
                      <span className="inline-flex items-center rounded-full bg-success-light px-2 py-0.5 text-[9px] font-bold text-emerald-700 uppercase tracking-wide mt-1 gap-0.5">
                        <CheckCircle size={10} /> done
                      </span>
                    )}
                  </div>
                  {i < phaseOrder.length - 1 && (
                    <div className={cn(
                      'h-0.5 w-16 -mt-10',
                      isPast ? 'bg-success' : isActive ? 'bg-brand' : 'bg-border'
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Official Cycle Timings & Guidelines */}
      <div className="bg-surface rounded-xl border border-border p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Official Cycle Timings & Guidelines</h3>
          <p className="text-xs text-text-secondary mt-0.5">Corporate schedule for goal setting, check-in intervals, and final annual achievements.</p>
        </div>
        
        <div className="overflow-x-auto border border-border rounded-lg bg-background/30">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-background/50 font-semibold text-text-secondary">
                <th className="px-4 py-3">Phase / Cycle</th>
                <th className="px-4 py-3">Timing</th>
                <th className="px-4 py-3">Actions & Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-text-primary">
              <tr className="hover:bg-background/20 transition-colors">
                <td className="px-4 py-3 font-semibold text-brand">Phase 1 — Goal Setting</td>
                <td className="px-4 py-3 font-semibold whitespace-nowrap text-text-primary">1st May</td>
                <td className="px-4 py-3 text-text-secondary">Goal Creation, Submission & Approval</td>
              </tr>
              <tr className="hover:bg-background/20 transition-colors">
                <td className="px-4 py-3 font-semibold text-text-primary">Q1 Check-in</td>
                <td className="px-4 py-3 font-semibold whitespace-nowrap text-text-primary">July</td>
                <td className="px-4 py-3 text-text-secondary">Progress Update — Planned vs. Actual</td>
              </tr>
              <tr className="hover:bg-background/20 transition-colors">
                <td className="px-4 py-3 font-semibold text-text-primary">Q2 Check-in</td>
                <td className="px-4 py-3 font-semibold whitespace-nowrap text-text-primary">October</td>
                <td className="px-4 py-3 text-text-secondary">Progress Update — Planned vs. Actual</td>
              </tr>
              <tr className="hover:bg-background/20 transition-colors">
                <td className="px-4 py-3 font-semibold text-text-primary">Q3 Check-in</td>
                <td className="px-4 py-3 font-semibold whitespace-nowrap text-text-primary">January</td>
                <td className="px-4 py-3 text-text-secondary">Progress Update — Planned vs. Actual</td>
              </tr>
              <tr className="hover:bg-background/20 transition-colors">
                <td className="px-4 py-3 font-semibold text-text-primary">Q4 / Annual</td>
                <td className="px-4 py-3 font-semibold whitespace-nowrap text-text-primary">March / April</td>
                <td className="px-4 py-3 text-text-secondary">Final Achievement Capture</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
