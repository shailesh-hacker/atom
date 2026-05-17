'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import QoQChart from '@/components/analytics/QoQChart';
import { Users, Award, ShieldAlert, AwardIcon, Loader2, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TeamAnalysisPage() {
  // Fetch L1 manager's team goals
  const { data: teamGoals = [], isLoading, error } = useQuery({
    queryKey: ['manager-analysis-team-goals'],
    queryFn: async () => {
      const { data } = await api.get('/goals/team');
      return data;
    },
  });

  // Client-side transformation to group team goals by quarter and calculate statistics
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

  // Flatten goals from the list of users
  const directReports = teamGoals;
  const flatGoals = teamGoals.flatMap((user: any) => user.goals || []);

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

  const uniqueGoals = getUniqueGoals(flatGoals);
  const chartData = transformData(uniqueGoals);

  // Compute team high level stats
  const uniqueReportsCount = directReports.length;
  const q1Score = chartData.find((d) => d.quarter === 'Q1')?.averageScore ?? 0;
  const q2Score = chartData.find((d) => d.quarter === 'Q2')?.averageScore ?? 0;
  const qoqDiff = q2Score - q1Score;
  const totalCompletedGoals = chartData.reduce((acc, curr) => acc + curr.completedGoals, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 size={32} className="animate-spin text-brand" />
          <p className="text-sm text-text-secondary">Loading team analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Team Performance QoQ Analysis</h1>
        <p className="text-sm text-text-secondary mt-1">
          Monitor your direct reports' progress metrics, quarter-over-quarter growth, and goal completion volumes.
        </p>
      </div>

      {/* Team KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Direct Reports */}
        <div className="bg-surface rounded-xl border border-border p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Direct Reports</span>
            <Users size={16} className="text-brand" />
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-text-primary">{uniqueReportsCount}</h3>
            <p className="text-xs text-text-secondary">Direct reports with assigned goals.</p>
          </div>
        </div>

        {/* Card 2: Team Performance (Q2 Average) */}
        <div className="bg-surface rounded-xl border border-border p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Q2 Team Average</span>
            <BarChart2 size={16} className="text-brand animate-pulse" />
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-text-primary">{q2Score}%</h3>
            <p className="text-xs text-text-secondary">Average completion rate for the team.</p>
          </div>
        </div>

        {/* Card 3: QoQ Growth Delta */}
        <div className="bg-surface rounded-xl border border-border p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">QoQ Progress Shift</span>
            <Award size={16} className={cn(qoqDiff >= 0 ? 'text-emerald-500' : 'text-amber-500')} />
          </div>
          <div className="space-y-1">
            <h3 className={cn('text-2xl font-bold', qoqDiff >= 0 ? 'text-emerald-600' : 'text-amber-600')}>
              {qoqDiff >= 0 ? `+${qoqDiff}` : qoqDiff}%
            </h3>
            <p className="text-xs text-text-secondary">Growth shift in average team score.</p>
          </div>
        </div>

        {/* Card 4: Total Completed Team Goals */}
        <div className="bg-surface rounded-xl border border-border p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Team Goals Finished</span>
            <AwardIcon size={16} className="text-emerald-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-text-primary">{totalCompletedGoals}</h3>
            <p className="text-xs text-text-secondary">Goals marked completed by your direct reports.</p>
          </div>
        </div>
      </div>

      {/* Chart Panel */}
      <QoQChart
        data={chartData}
        title="Direct Reports' Performance Trends"
        subtitle="Quarterly breakdown of direct reports' average scores and completed check-in volumes"
      />
    </div>
  );
}
