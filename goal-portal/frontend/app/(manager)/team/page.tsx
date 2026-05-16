'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, Target, Clock, CheckCircle, Search, ChevronDown, ChevronRight, Check, X, Loader2 } from 'lucide-react';
import StatusChip from '@/components/shared/StatusChip';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import api from '@/lib/api';

interface Goal {
  id: string;
  title: string;
  thrustArea: string;
  uom: string;
  target: number;
  weightage: number;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'RETURNED';
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
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [teamData, setTeamData] = useState<EmployeeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchTeamGoals = useCallback(async () => {
    try {
      const { data } = await api.get('/goals/team');
      // Group goals by employee
      const grouped = new Map<string, EmployeeGroup>();
      for (const goal of data) {
        const emp = goal.employee;
        if (!grouped.has(emp.id)) {
          const initials = emp.name
            .split(' ')
            .map((n: string) => n[0])
            .join('');
          grouped.set(emp.id, {
            id: emp.id,
            name: emp.name,
            email: emp.email,
            initials,
            goals: [],
          });
        }
        grouped.get(emp.id)!.goals.push(goal);
      }
      setTeamData(Array.from(grouped.values()));
    } catch (err: any) {
      toast.error('Failed to load team goals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeamGoals();
  }, [fetchTeamGoals]);

  const totalMembers = teamData.length;
  const totalGoals = teamData.reduce((sum, e) => sum + e.goals.length, 0);
  const pendingApproval = teamData.reduce((sum, e) => sum + e.goals.filter((g) => g.status === 'SUBMITTED').length, 0);
  const approvedGoals = teamData.reduce((sum, e) => sum + e.goals.filter((g) => g.status === 'APPROVED').length, 0);

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

  const handleReturn = async (goalId: string) => {
    setActionLoading(goalId);
    try {
      await api.patch(`/goals/${goalId}/return`);
      toast.success('Goal returned for rework.');
      fetchTeamGoals();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to return goal');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveAll = async (employee: EmployeeGroup) => {
    const submittedGoals = employee.goals.filter((g) => g.status === 'SUBMITTED');
    try {
      await Promise.all(submittedGoals.map((g) => api.patch(`/goals/${g.id}/approve`)));
      toast.success(`All ${submittedGoals.length} goals approved!`);
      fetchTeamGoals();
    } catch (err: any) {
      toast.error('Some goals failed to approve');
    }
  };

  const handleReturnAll = async (employee: EmployeeGroup) => {
    const submittedGoals = employee.goals.filter((g) => g.status === 'SUBMITTED');
    try {
      await Promise.all(submittedGoals.map((g) => api.patch(`/goals/${g.id}/return`)));
      toast.success('All goals returned for rework.');
      fetchTeamGoals();
    } catch (err: any) {
      toast.error('Some goals failed to return');
    }
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
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Team Overview</h1>
        <p className="text-sm text-text-secondary mt-1">Monitor and approve goals for your direct reports.</p>
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
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">Approved</span>
          </div>
          <p className="text-3xl font-bold text-text-primary">{approvedGoals}</p>
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
          <option value="SUBMITTED">Submitted</option>
          <option value="APPROVED">Approved</option>
          <option value="RETURNED">Returned</option>
        </select>
      </div>

      {/* Team Goals Table */}
      {filteredData.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-12 text-center shadow-sm">
          <Users size={48} className="mx-auto text-text-secondary/40 mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-1">No team members found</h3>
          <p className="text-sm text-text-secondary">
            {teamData.length === 0
              ? 'No direct reports have submitted goals yet.'
              : 'No results match your current filters.'}
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
                const allSubmitted = employee.goals.every((g) => g.status === 'SUBMITTED');
                const allApproved = employee.goals.every((g) => g.status === 'APPROVED');

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
                        {allApproved ? (
                          <StatusChip status="APPROVED" />
                        ) : allSubmitted ? (
                          <StatusChip status="SUBMITTED" />
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
                            {employee.goals.map((goal) => (
                              <div key={goal.id} className="flex items-center justify-between bg-surface rounded-lg border border-border px-5 py-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-medium text-brand bg-brand-light px-2 py-0.5 rounded-full">{goal.thrustArea}</span>
                                    <StatusChip status={goal.status} />
                                  </div>
                                  <p className="text-sm font-medium text-text-primary">{goal.title}</p>
                                  <p className="text-xs text-text-secondary mt-1">
                                    Target: {goal.target} · Weightage: {goal.weightage}%
                                  </p>
                                </div>
                                {goal.status === 'SUBMITTED' && (
                                  <div className="flex items-center gap-2 ml-4">
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
                                  </div>
                                )}
                              </div>
                            ))}

                            {/* Bulk actions */}
                            {employee.goals.some((g) => g.status === 'SUBMITTED') && (
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
    </div>
  );
}

import { Fragment } from 'react';
