'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import QoQChart from '@/components/analytics/QoQChart';
import { TrendingUp, CheckCircle, Users, Award, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminAnalysisPage() {
  // Fetch org-wide goal data
  const { data: goals = [], isLoading, error } = useQuery({
    queryKey: ['admin-analysis-goals'],
    queryFn: async () => {
      const { data } = await api.get('/goals/mine');
      return data;
    },
  });

  // Client-side transformation to group by quarter and calculate averages
  const transformData = (goalList: any[]) => {
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

    return quarters.map((q) => {
      let totalScore = 0;
      let scoreCount = 0;
      let completedGoals = 0;

      goalList.forEach((goal) => {
        const quarterUpdates = goal.updates?.filter((u: any) => u.quarter === q) || [];
        if (quarterUpdates.length > 0) {
          const sortedUpdates = [...quarterUpdates].sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          const latestUpdate = sortedUpdates[sortedUpdates.length - 1];

          totalScore += (latestUpdate.progressScore ?? 0) * 100;
          scoreCount++;

          if (
            latestUpdate.statusUpdate === 'COMPLETED' || 
            latestUpdate.progressScore >= 1.0 ||
            goal.status === 'COMPLETED'
          ) {
            completedGoals++;
          }
        }
      });

      return {
        quarter: q,
        averageScore: scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0,
        completedGoals,
      };
    });
  };

  const getUniqueGoals = (goalList: any[]) => {
    const seenSharedGroups = new Set<string>();
    return goalList.filter((goal) => {
      if (goal.isShared && goal.sharedGroupId) {
        if (seenSharedGroups.has(goal.sharedGroupId)) {
          return false;
        }
        seenSharedGroups.add(goal.sharedGroupId);
      }
      return true;
    });
  };

  const uniqueGoals = getUniqueGoals(goals);
  const chartData = transformData(uniqueGoals);

  // Compute high level stats
  const totalEmployeesWithGoals = new Set(goals.map((g: any) => g.employeeId)).size;
  const q1Score = chartData.find((d) => d.quarter === 'Q1')?.averageScore ?? 0;
  const q2Score = chartData.find((d) => d.quarter === 'Q2')?.averageScore ?? 0;
  const qoqDiff = q2Score - q1Score;

  const totalCompletedGoalsCount = chartData.reduce((acc, curr) => acc + curr.completedGoals, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 size={32} className="animate-spin text-brand" />
          <p className="text-sm text-text-secondary">Loading organizational analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Organizational QoQ Analysis</h1>
        <p className="text-sm text-text-secondary mt-1">
          Org-wide performance trends, target achievements, and check-in volumes across all departments.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Org Average Q2 */}
        <div className="bg-surface rounded-xl border border-border p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Q2 Org Average</span>
            <TrendingUp size={16} className="text-brand" />
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-text-primary">{q2Score}%</h3>
            <p className="text-xs text-text-secondary">
              Average progress score across all goals.
            </p>
          </div>
        </div>

        {/* KPI 2: QoQ Difference */}
        <div className="bg-surface rounded-xl border border-border p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Q1 vs Q2 Delta</span>
            <Award size={16} className={cn(qoqDiff >= 0 ? 'text-emerald-500' : 'text-amber-500')} />
          </div>
          <div className="space-y-1">
            <h3 className={cn('text-2xl font-bold', qoqDiff >= 0 ? 'text-emerald-600' : 'text-amber-600')}>
              {qoqDiff >= 0 ? `+${qoqDiff}` : qoqDiff}%
            </h3>
            <p className="text-xs text-text-secondary">
              Growth in progress rate quarter-over-quarter.
            </p>
          </div>
        </div>

        {/* KPI 3: Completed Goals */}
        <div className="bg-surface rounded-xl border border-border p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Goals Completed</span>
            <CheckCircle size={16} className="text-emerald-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-text-primary">{totalCompletedGoalsCount}</h3>
            <p className="text-xs text-text-secondary">
              Volume of check-ins marked as COMPLETED.
            </p>
          </div>
        </div>

        {/* KPI 4: Active Employees */}
        <div className="bg-surface rounded-xl border border-border p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Aligned Employees</span>
            <Users size={16} className="text-text-secondary" />
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-text-primary">{totalEmployeesWithGoals}</h3>
            <p className="text-xs text-text-secondary">
              Unique personnel with defined goal sheets.
            </p>
          </div>
        </div>
      </div>

      {/* Main Charts section */}
      <QoQChart
        data={chartData}
        title="Organizational Performance Overview"
        subtitle="Aggregated progress scores and completed check-in volumes across all quarters"
      />
    </div>
  );
}
