'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import { Users, Target, Clock, CheckCircle, Search, ChevronDown, ChevronRight, Check, X, Loader2, Plus, Share2, Pencil, Trash2 } from 'lucide-react';
import StatusChip from '@/components/shared/StatusChip';
import CreateGoalSlideOver from '@/components/goals/CreateGoalSlideOver';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ReturnTarget {
  goalId?: string;       // single goal return
  employee?: any;        // bulk return (all pending goals for this employee)
}

interface Goal {
  id: string;
  title: string;
  description?: string;
  thrustArea: string;
  uom: string;
  target: number;
  weightage: number;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'RETURNED' | 'COMPLETED';
  locked: boolean;
  employeeId: string;
  employee: {
    id: string;
    name: string;
    email: string;
  };
}

interface EmployeeGroup {
  id: string;
  name: string;
  email: string;
  initials: string;
  goals: Goal[];
}

export default function TeamDashboardPage() {
  const queryClient = useQueryClient();
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [teamData, setTeamData] = useState<EmployeeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const [slideOver, setSlideOver] = useState<{
    open: boolean;
    mode: 'INDIVIDUAL' | 'SHARED';
    targetEmployeeId?: string;
    initialData?: any;
    goalId?: string;
  }>({ open: false, mode: 'INDIVIDUAL' });

  // Return dialog state
  const [returnDialog, setReturnDialog] = useState<{ open: boolean; target: ReturnTarget }>({
    open: false, target: {},
  });
  const [returnReason, setReturnReason] = useState('');
  const [returning, setReturning] = useState(false);

  const fetchTeamGoals = useCallback(async () => {
    try {
      const { data } = await api.get('/goals/team');
      
      const mappedTeam = data.map((user: any) => {
        const initials = user.name
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);
          
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          initials,
          goals: user.goals || [],
        };
      });
      
      setTeamData(mappedTeam);
    } catch (err: any) {
      toast.error('Failed to load team goals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeamGoals();
  }, [fetchTeamGoals]);

  // ── Mutations ──
  const assignMutation = useMutation({
    mutationFn: (data: any) => {
      if (slideOver.mode === 'SHARED') {
        return api.post('/goals/shared', {
          ...data,
          employeeIds: data.employeeIds,
        });
      }
      return api.post('/goals', {
        ...data,
        employeeId: data.employeeIds?.[0],
      });
    },
    onSuccess: () => {
      fetchTeamGoals();
      setSlideOver({ open: false, mode: 'INDIVIDUAL' });
      toast.success(slideOver.mode === 'SHARED' ? 'Shared goals assigned!' : 'Goal assigned successfully!');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to assign goal'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/goals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
      fetchTeamGoals();
      toast.success('Goal deleted successfully');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to delete goal'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/goals/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
      fetchTeamGoals();
      toast.success('Goal updated successfully');
      setSlideOver({ open: false, mode: 'INDIVIDUAL' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update goal'),
  });

  const totalMembers = teamData.length;
  const totalGoals = teamData.reduce((sum, e) => sum + e.goals.length, 0);
  const pendingApproval = teamData.reduce((sum, e) => sum + e.goals.filter((g) => g.status === 'PENDING').length, 0);
  const approvedGoalsCount = teamData.reduce((sum, e) => sum + e.goals.filter((g) => g.status === 'APPROVED').length, 0);
  const completedGoalsCount = teamData.reduce((sum, e) => sum + e.goals.filter((g) => g.status === 'COMPLETED').length, 0);

  const filteredData = teamData.filter((e) => {
    const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && e.goals.some((g) => g.status === statusFilter);
  });

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

  const openReturnDialog = (target: ReturnTarget) => {
    setReturnReason('');
    setReturnDialog({ open: true, target });
  };

  const handleConfirmReturn = async () => {
    if (!returnReason.trim()) {
      toast.error('Please enter a reason before returning.');
      return;
    }
    setReturning(true);
    try {
      const { target } = returnDialog;
      if (target.goalId) {
        await api.patch(`/goals/${target.goalId}/return`, { reason: returnReason });
        toast.success('Goal returned for rework.');
      } else if (target.employee) {
        const pending = target.employee.goals.filter((g: any) => g.status === 'PENDING');
        await Promise.all(pending.map((g: any) => api.patch(`/goals/${g.id}/return`, { reason: returnReason })));
        toast.success(`All goals returned for ${target.employee.name}.`);
      }
      setReturnDialog({ open: false, target: {} });
      fetchTeamGoals();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to return goal(s)');
    } finally {
      setReturning(false);
    }
  };

  const handleReturn = async (goalId: string) => {
    openReturnDialog({ goalId }); return;
  };

  const handleApproveAll = async (employee: EmployeeGroup) => {
    const submittedGoals = employee.goals.filter((g) => g.status === 'PENDING');
    try {
      await Promise.all(submittedGoals.map((g) => api.patch(`/goals/${g.id}/approve`)));
      toast.success(`All ${submittedGoals.length} goals approved!`);
      fetchTeamGoals();
    } catch (err: any) {
      toast.error('Some goals failed to approve');
    }
  };

  const handleReturnAll = async (employee: EmployeeGroup) => {
    const submittedGoals = employee.goals.filter((g) => g.status === 'PENDING');
    if (submittedGoals.length === 0) return;

    openReturnDialog({ employee }); return;
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Team Overview</h1>
          <p className="text-sm text-text-secondary mt-1">Monitor and approve goals for your direct reports.</p>
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
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Team Overview</h1>
          <p className="text-sm text-text-secondary mt-1">Monitor and approve goals for your direct reports.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSlideOver({ open: true, mode: 'INDIVIDUAL', targetEmployeeId: undefined })}
            className="bg-surface text-brand border border-brand/20 px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-brand-light transition-colors shadow-sm"
          >
            <Target size={18} />
            Assign Normal Goal
          </button>
          
          <button
            onClick={() => setSlideOver({ open: true, mode: 'SHARED' })}
            className="bg-brand text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-brand-dark transition-colors shadow-sm"
          >
            <Share2 size={18} />
            Create Shared Goal
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Users size={20} className="text-brand" />
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">Members</span>
          </div>
          <p className="text-3xl font-bold text-text-primary">{totalMembers}</p>
          <p className="text-xs text-text-secondary mt-1">in team</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Target size={20} className="text-info" />
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">Goals</span>
          </div>
          <p className="text-3xl font-bold text-text-primary">{totalGoals}</p>
          <p className="text-xs text-text-secondary mt-1">total</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Clock size={20} className="text-warning" />
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">Pending</span>
          </div>
          <p className="text-3xl font-bold text-text-primary">{pendingApproval}</p>
          <p className="text-xs text-text-secondary mt-1">approval</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle size={20} className="text-success" />
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">Completed</span>
          </div>
          <p className="text-3xl font-bold text-text-primary">{completedGoalsCount}</p>
          <p className="text-xs text-text-secondary mt-1">finalized work</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Search by employee name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-md text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-border rounded-md px-4 py-2.5 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="RETURNED">Returned</option>
        </select>
      </div>

      {/* Team Goals Table */}
      {filteredData.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-12 text-center shadow-sm">
          <Users size={48} className="mx-auto text-text-secondary/40 mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-1">No goals assigned yet</h3>
          <p className="text-sm text-text-secondary">
            Your direct reports are listed below. Click "Assign Goal" on an employee to get started.
          </p>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-background">
                <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide w-8" />
                <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Employee</th>
                <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Goals</th>
                <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredData.map((employee) => {
                const isExpanded = expandedEmployee === employee.id;
                const allPending = employee.goals.every((g) => g.status === 'PENDING');
                const allApproved = employee.goals.every((g) => g.status === 'APPROVED');
                const allCompleted = employee.goals.every((g) => g.status === 'COMPLETED');
                const anyCompleted = employee.goals.some((g) => g.status === 'COMPLETED');

                return (
                  <Fragment key={employee.id}>
                    <tr
                      className="hover:bg-background/50 transition-colors cursor-pointer"
                      onClick={() => setExpandedEmployee(isExpanded ? null : employee.id)}
                    >
                      <td className="px-6 py-4">
                        {isExpanded ? <ChevronDown size={16} className="text-text-secondary" /> : <ChevronRight size={16} className="text-text-secondary" />}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-brand-light border border-border flex items-center justify-center">
                            <span className="text-brand font-semibold text-xs">{employee.initials}</span>
                          </div>
                          <span className="font-medium text-text-primary text-sm">{employee.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">{employee.goals.length} goals</td>
                      <td className="px-6 py-4">
                        {allCompleted ? (
                          <StatusChip status="COMPLETED" />
                        ) : allApproved ? (
                          <StatusChip status="APPROVED" />
                        ) : allPending ? (
                          <StatusChip status="PENDING" />
                        ) : anyCompleted ? (
                           <div className="flex items-center gap-2">
                             <StatusChip status="APPROVED" />
                             <span className="text-[10px] font-bold text-success">
                               {employee.goals.filter(g => g.status === 'COMPLETED').length}/{employee.goals.length} Done
                             </span>
                           </div>
                        ) : (
                          <span className="text-xs text-text-secondary">Mixed</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">{employee.email}</td>
                    </tr>

                    {/* Expanded Row */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={5} className="bg-background px-6 py-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Goal Sheet</h4>
                              <button
                                onClick={() => setSlideOver({ open: true, mode: 'INDIVIDUAL', targetEmployeeId: employee.id })}
                                className="text-xs font-semibold text-brand flex items-center gap-1 hover:underline"
                              >
                                <Plus size={14} />
                                Assign Goal
                              </button>
                            </div>
                            
                            {employee.goals.map((goal) => (
                              <div key={goal.id} className="flex items-center justify-between bg-surface rounded-lg border border-border px-5 py-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-medium text-brand bg-brand-light px-2 py-0.5 rounded-full">{goal.thrustArea}</span>
                                    <StatusChip status={goal.status} />
                                  </div>
                                  <p className="text-sm font-medium text-text-primary">{goal.title}</p>
                                  <p className="text-xs text-text-secondary mt-1">
                                    Target: {goal.uom === 'TIMELINE' ? (
                                      (() => {
                                        const s = String(goal.target);
                                        return s.length === 8 ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` : goal.target;
                                      })()
                                    ) : goal.target} · Weightage: {goal.weightage}%
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                    {goal.status !== 'COMPLETED' && (
                                      <>
                                        <button
                                          onClick={(e) => { 
                                            e.stopPropagation(); 
                                            setSlideOver({ 
                                              open: true, 
                                              mode: 'INDIVIDUAL', 
                                              targetEmployeeId: employee.id,
                                              initialData: {
                                                thrustArea: goal.thrustArea,
                                                title: goal.title,
                                                description: goal.description || '',
                                                uom: goal.uom,
                                                target: goal.target,
                                                weightage: goal.weightage,
                                              },
                                              goalId: goal.id
                                            }); 
                                          }}
                                          className="p-1.5 rounded-lg hover:bg-brand-light text-brand transition-colors"
                                          title="Edit Goal"
                                        >
                                          <Pencil size={14} />
                                        </button>
                                        <button
                                          onClick={(e) => { 
                                            e.stopPropagation(); 
                                            if (confirm('Are you sure you want to delete this goal?')) {
                                              deleteMutation.mutate(goal.id);
                                            }
                                          }}
                                          className="p-1.5 rounded-lg hover:bg-danger-light text-danger transition-colors"
                                          title="Delete Goal"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </>
                                    )}
                                    {goal.status === 'PENDING' && (
                                      <>
                                        <button
                                          onClick={(e) => { e.stopPropagation(); handleApprove(goal.id); }}
                                          disabled={actionLoading === goal.id}
                                          className="p-2 rounded-lg hover:bg-success-light text-success transition-colors disabled:opacity-50"
                                          aria-label="Approve goal"
                                        >
                                          {actionLoading === goal.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                        </button>
                                        <button
                                          onClick={(e) => { e.stopPropagation(); handleReturn(goal.id); }}
                                          disabled={actionLoading === goal.id}
                                          className="p-2 rounded-lg hover:bg-danger-light text-danger transition-colors disabled:opacity-50"
                                          aria-label="Return goal"
                                        >
                                          <X size={16} />
                                        </button>
                                      </>
                                    )}
                                  </div>
                              </div>
                            ))}

                            {/* Bulk actions */}
                            {employee.goals.some((g) => g.status === 'PENDING') && (
                              <div className="flex justify-end gap-3 pt-2">
                                <button
                                  onClick={() => handleReturnAll(employee)}
                                  className="px-4 py-2 text-sm font-semibold text-danger border border-danger/30 hover:bg-danger-light rounded-lg transition-colors"
                                >
                                  Return for Rework
                                </button>
                                <button
                                  onClick={() => handleApproveAll(employee)}
                                  className="px-4 py-2 text-sm font-semibold text-white bg-success hover:bg-emerald-600 rounded-lg transition-colors shadow-sm"
                                >
                                  Approve All
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Assignment Slide-over */}
      <CreateGoalSlideOver
        open={slideOver.open}
        onClose={() => setSlideOver({ open: false, mode: 'INDIVIDUAL' })}
        onSave={(data) => {
          if ((slideOver as any).goalId) {
            updateMutation.mutate({ id: (slideOver as any).goalId, data });
          } else {
            assignMutation.mutate(data);
          }
        }}
        mode={slideOver.mode}
        targetEmployeeId={slideOver.targetEmployeeId}
        initialData={(slideOver as any).initialData}
        availableEmployees={teamData.map(e => ({ id: e.id, name: e.name }))}
      />

      {/* Return Reason Dialog */}
      <Dialog open={returnDialog.open} onOpenChange={(open) => !returning && setReturnDialog({ open, target: {} })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Return for Rework</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="return-reason" className="text-sm font-medium text-text-primary">
              Reason <span className="text-danger">*</span>
            </Label>
            <Textarea
              id="return-reason"
              placeholder="Explain what needs to be changed..."
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-text-secondary">This message will be visible to the employee.</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setReturnDialog({ open: false, target: {} })} disabled={returning}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmReturn} disabled={returning || !returnReason.trim()}>
              {returning ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              Confirm Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
