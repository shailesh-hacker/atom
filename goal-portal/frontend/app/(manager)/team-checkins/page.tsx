'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, MessageSquare, Check, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import EmptyState from '@/components/shared/EmptyState';

const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

const getCurrentQuarter = () => {
  const m = new Date().getMonth();
  if (m < 3) return 'Q1';
  if (m < 6) return 'Q2';
  if (m < 9) return 'Q3';
  return 'Q4';
};

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 80 ? 'bg-success' : pct >= 50 ? 'bg-warning' : 'bg-danger';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className={cn('text-xs font-semibold w-8 text-right', pct >= 80 ? 'text-success' : pct >= 50 ? 'text-warning' : 'text-danger')}>
        {pct}%
      </span>
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'COMPLETED') return <TrendingUp size={14} className="text-success" />;
  if (status === 'ON_TRACK') return <Minus size={14} className="text-info" />;
  return <TrendingDown size={14} className="text-text-secondary" />;
}

export default function ManagerCheckinsPage() {
  const [teamData, setTeamData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuarter, setSelectedQuarter] = useState(getCurrentQuarter());
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<{ updateId: string; value: string } | null>(null);
  const [savingComment, setSavingComment] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const { data } = await api.get('/goals/team');
      setTeamData(data);
    } catch {
      toast.error('Failed to load team data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSaveComment = async () => {
    if (!editingComment) return;
    setSavingComment(true);
    try {
      await api.patch(`/checkins/${editingComment.updateId}/comment`, { comment: editingComment.value });
      toast.success('Check-in comment saved.');
      setEditingComment(null);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save comment');
    } finally {
      setSavingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Team Check-ins</h1>
          <p className="text-sm text-text-secondary mt-1">Review quarterly progress and add structured feedback.</p>
        </div>
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 size={32} className="animate-spin text-brand" />
        </div>
      </div>
    );
  }

  // Only show employees who have at least one APPROVED or COMPLETED goal
  const activeEmployees = teamData.filter((emp) =>
    emp.goals?.some((g: any) => ['APPROVED', 'COMPLETED'].includes(g.status))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Team Check-ins</h1>
          <p className="text-sm text-text-secondary mt-1">
            Review Planned vs. Actual achievement and add structured check-in comments.
          </p>
        </div>
        {/* Quarter selector */}
        <div className="flex gap-1 bg-background border border-border rounded-lg p-1 self-start">
          {quarters.map((q) => (
            <button
              key={q}
              onClick={() => setSelectedQuarter(q)}
              className={cn(
                'px-4 py-1.5 text-sm font-medium rounded-md transition-colors',
                selectedQuarter === q
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {activeEmployees.length === 0 ? (
        <EmptyState
          title="No Active Goals"
          description="No team members have approved goals yet. Goals must be approved before check-ins can be logged."
        />
      ) : (
        <div className="space-y-4">
          {activeEmployees.map((emp) => {
            const approvedGoals = emp.goals.filter((g: any) => ['APPROVED', 'COMPLETED'].includes(g.status));
            const isExpanded = expandedEmployee === emp.id;

            // Summary stats for this employee in selected quarter
            const updatesThisQuarter = approvedGoals.flatMap((g: any) =>
              (g.updates || []).filter((u: any) => u.quarter === selectedQuarter)
            );
            const avgScore = updatesThisQuarter.length > 0
              ? updatesThisQuarter.reduce((s: number, u: any) => s + (u.progressScore || 0), 0) / updatesThisQuarter.length
              : null;
            const checkedIn = approvedGoals.filter((g: any) =>
              (g.updates || []).some((u: any) => u.quarter === selectedQuarter)
            ).length;

            return (
              <div key={emp.id} className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
                {/* Employee row */}
                <button
                  onClick={() => setExpandedEmployee(isExpanded ? null : emp.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-background transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-brand-light text-brand rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {emp.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary text-sm">{emp.name}</p>
                      <p className="text-xs text-text-secondary">
                        {checkedIn} / {approvedGoals.length} goals updated for {selectedQuarter}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {avgScore !== null ? (
                      <div className="hidden sm:flex items-center gap-2 w-32">
                        <ScoreBar score={avgScore} />
                      </div>
                    ) : (
                      <span className="text-xs text-text-secondary hidden sm:block">No updates yet</span>
                    )}
                    <span className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-full border',
                      checkedIn === approvedGoals.length && checkedIn > 0
                        ? 'bg-success-light text-success border-success/20'
                        : checkedIn > 0
                        ? 'bg-warning-light text-amber-700 border-warning/20'
                        : 'bg-gray-100 text-gray-500 border-gray-200'
                    )}>
                      {checkedIn === approvedGoals.length && checkedIn > 0 ? 'Complete' : checkedIn > 0 ? 'Partial' : 'Pending'}
                    </span>
                    <span className="text-text-secondary">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </button>

                {/* Expanded: per-goal planned vs actual table */}
                {isExpanded && (
                  <div className="border-t border-border">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-background">
                          <tr>
                            <th className="text-left px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Goal</th>
                            <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Target</th>
                            <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">{selectedQuarter} Actual</th>
                            <th className="px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide w-36">Score</th>
                            <th className="px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Status</th>
                            <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Check-in Comment</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {approvedGoals.map((goal: any) => {
                            const update = (goal.updates || [])
                              .filter((u: any) => u.quarter === selectedQuarter)
                              .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

                            const isEditingThis = editingComment?.updateId === update?.id;

                            return (
                              <tr key={goal.id} className="hover:bg-background/50 transition-colors">
                                {/* Goal name */}
                                <td className="px-6 py-4">
                                  <div>
                                    <p className="font-medium text-text-primary">{goal.title}</p>
                                    <span className="text-xs text-brand bg-brand-light px-1.5 py-0.5 rounded">{goal.thrustArea}</span>
                                  </div>
                                </td>

                                {/* Planned target */}
                                <td className="px-4 py-4 text-right font-mono text-text-primary">
                                  {goal.uom === 'TIMELINE'
                                    ? (() => { const s = String(goal.target); return s.length === 8 ? `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}` : goal.target; })()
                                    : goal.target}
                                  {goal.uom === 'PERCENTAGE' ? '%' : ''}
                                </td>

                                {/* Actual achievement */}
                                <td className="px-4 py-4 text-right font-mono">
                                  {update ? (
                                    <span className="text-text-primary font-semibold">
                                      {update.achievement}{goal.uom === 'PERCENTAGE' ? '%' : ''}
                                    </span>
                                  ) : (
                                    <span className="text-text-secondary italic text-xs">Not logged</span>
                                  )}
                                </td>

                                {/* Score bar */}
                                <td className="px-4 py-4 w-36">
                                  {update?.progressScore != null ? (
                                    <ScoreBar score={update.progressScore} />
                                  ) : (
                                    <span className="text-text-secondary text-xs">—</span>
                                  )}
                                </td>

                                {/* Status */}
                                <td className="px-4 py-4">
                                  {update ? (
                                    <div className="flex items-center gap-1">
                                      <StatusIcon status={update.statusUpdate} />
                                      <span className="text-xs text-text-secondary capitalize">
                                        {update.statusUpdate.replace('_', ' ')}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-text-secondary text-xs">—</span>
                                  )}
                                </td>

                                {/* Check-in comment */}
                                <td className="px-6 py-4 min-w-[220px]">
                                  {!update ? (
                                    <span className="text-xs text-text-secondary italic">Employee hasn't logged yet</span>
                                  ) : (isEditingThis && editingComment) ? (
                                    <div className="space-y-2">
                                      <textarea
                                        autoFocus
                                        className="w-full text-sm border border-border rounded-md px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-brand bg-surface text-text-primary"
                                        rows={3}
                                        value={editingComment.value}
                                        onChange={(e) => setEditingComment({ ...editingComment, value: e.target.value })}
                                        placeholder="Add your check-in comment..."
                                      />
                                      <div className="flex gap-2">
                                        <button
                                          onClick={handleSaveComment}
                                          disabled={savingComment}
                                          className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-brand text-white rounded-md hover:bg-brand/90 disabled:opacity-50"
                                        >
                                          {savingComment ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                                          Save
                                        </button>
                                        <button
                                          onClick={() => setEditingComment(null)}
                                          className="px-2 py-1 text-xs font-medium text-text-secondary border border-border rounded-md hover:bg-background"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div
                                      className="group flex items-start gap-2 cursor-pointer"
                                      onClick={() => setEditingComment({ updateId: update.id, value: update.comment || '' })}
                                    >
                                      <div className="flex-1">
                                        {update.comment ? (
                                          <p className="text-sm text-text-primary line-clamp-2">{update.comment}</p>
                                        ) : (
                                          <p className="text-xs text-text-secondary italic">Click to add comment...</p>
                                        )}
                                      </div>
                                      <MessageSquare size={13} className="text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
