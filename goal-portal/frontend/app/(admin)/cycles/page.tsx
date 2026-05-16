'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Search, Lock, Unlock, Plus, Loader2, Calendar, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

const phaseLabels: Record<string, string> = {
  GOAL_SETTING: 'Goal Setting',
  Q1_CHECKIN: 'Q1 Check-in',
  Q2_CHECKIN: 'Q2 Check-in',
  Q3_CHECKIN: 'Q3 Check-in',
  Q4_CHECKIN: 'Q4 Check-in',
  CLOSED: 'Closed',
};

const phaseOrder = ['GOAL_SETTING', 'Q1_CHECKIN', 'Q2_CHECKIN', 'Q3_CHECKIN', 'Q4_CHECKIN', 'CLOSED'];

export default function CyclesPage() {
  const queryClient = useQueryClient();
  const [unlockSearch, setUnlockSearch] = useState('');
  const [unlockReason, setUnlockReason] = useState('');

  const { data: cycles = [], isLoading } = useQuery({
    queryKey: ['cycles'],
    queryFn: async () => {
      const { data } = await api.get('/cycles');
      return data;
    },
  });

  const activeCycle = cycles.find((c: any) => c.isActive);

  const advancePhaseMutation = useMutation({
    mutationFn: ({ cycleId, phase }: { cycleId: string; phase: string }) =>
      api.patch(`/cycles/${cycleId}/phase`, { phase }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycles'] });
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
        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-text-primary mb-6">Phase Timeline</h3>
          <div className="flex items-center gap-0 overflow-x-auto pb-4">
            {phaseOrder.map((phase, i) => {
              const isActive = activeCycle.phase === phase;
              const isPast = phaseOrder.indexOf(activeCycle.phase) > i;

              return (
                <div key={phase} className="flex items-center">
                  <div className="flex flex-col items-center min-w-[120px]">
                    <div className={cn(
                      'h-4 w-4 rounded-full border-2',
                      isActive
                        ? 'bg-brand border-brand'
                        : isPast
                          ? 'bg-success border-success'
                          : 'bg-surface border-border'
                    )} />
                    <p className={cn(
                      'text-xs font-medium mt-2 text-center',
                      isActive ? 'text-brand' : isPast ? 'text-success' : 'text-text-secondary'
                    )}>
                      {phaseLabels[phase]}
                    </p>
                    {isActive && (
                      <span className="text-xs text-brand font-medium mt-1">(active)</span>
                    )}
                    {isPast && (
                      <CheckCircle size={12} className="text-success mt-1" />
                    )}
                  </div>
                  {i < phaseOrder.length - 1 && (
                    <div className={cn(
                      'h-0.5 w-12 -mt-6',
                      isPast ? 'bg-success' : isActive ? 'bg-brand' : 'bg-border'
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Unlock Goal Card */}
      <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Unlock size={16} className="text-warning" />
          Unlock Goal
        </h3>
        <p className="text-sm text-text-secondary mb-4">
          Enter a goal ID to unlock it for editing. This will be recorded in the audit log.
        </p>
        <div className="space-y-4 max-w-lg">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              placeholder="Goal ID..."
              value={unlockSearch}
              onChange={(e) => setUnlockSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-border rounded-md text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
          </div>
          <textarea
            placeholder="Reason for unlock (required)"
            value={unlockReason}
            onChange={(e) => setUnlockReason(e.target.value)}
            rows={3}
            className="w-full border border-border rounded-md px-4 py-3 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none"
          />
          <button
            disabled={!unlockReason.trim() || !unlockSearch.trim() || unlockMutation.isPending}
            onClick={() => unlockMutation.mutate(unlockSearch.trim())}
            className="px-4 py-2 text-sm font-semibold bg-warning text-white hover:bg-amber-500 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {unlockMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Unlock size={16} />}
            Unlock Goal
          </button>
        </div>
      </div>
    </div>
  );
}
