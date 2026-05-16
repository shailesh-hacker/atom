'use client';

import { useState } from 'react';
import { Download, BarChart3, CheckSquare, PieChart, Loader2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

const reportOptions = [
  { id: 'achievement', label: 'Achievement Report', desc: 'Export all goals with planned vs actual', icon: BarChart3 },
  { id: 'completion', label: 'Completion Dashboard', desc: 'Who has / hasn\'t completed check-ins', icon: CheckSquare },
  { id: 'distribution', label: 'Goal Distribution', desc: 'Breakdown by thrust area and UoM', icon: PieChart },
];

export default function ReportsPage() {
  const { user } = useAuth();
  const [selectedReport, setSelectedReport] = useState('achievement');
  const [downloading, setDownloading] = useState(false);
  const [selectedManagerId, setSelectedManagerId] = useState<string>('');

  const isAdmin = user?.role === 'ADMIN';

  // Fetch managers for the dropdown (only if Admin)
  const { data: managers = [] } = useQuery({
    queryKey: ['managers-list'],
    queryFn: async () => {
      const { data } = await api.get('/users/managers');
      return data;
    },
    enabled: isAdmin,
  });

  // Fetch completion rates from backend
  const { data: completion } = useQuery({
    queryKey: ['reports-completion', selectedManagerId],
    queryFn: async () => {
      const { data } = await api.get('/reports/completion', {
        params: { managerId: selectedManagerId || undefined },
      });
      return data;
    },
  });

  // Fetch all goals for report preview and distribution
  const { data: allGoals = [] } = useQuery({
    queryKey: ['reports-goals', selectedManagerId],
    queryFn: async () => {
      const { data } = await api.get('/goals/mine', {
        params: { managerId: selectedManagerId || undefined },
      });
      return data;
    },
  });

  const handleDownloadCsv = async () => {
    setDownloading(true);
    try {
      const response = await api.get('/reports/export', {
        params: { managerId: selectedManagerId || undefined },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `goals_report_${selectedManagerId ? 'team' : 'global'}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Report downloaded successfully!');
    } catch (err: any) {
      toast.error('Failed to download report. Ensure you have admin/manager access.');
    } finally {
      setDownloading(false);
    }
  };

  // Calculate distribution from real goals
  const distribution = allGoals.reduce((acc: Record<string, number>, g: any) => {
    acc[g.thrustArea] = (acc[g.thrustArea] || 0) + 1;
    return acc;
  }, {});

  const distributionColors = [
    'bg-brand', 'bg-info', 'bg-warning', 'bg-success', 'bg-purple-500', 'bg-pink-500',
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Reports & Export</h1>
          <p className="text-sm text-text-secondary mt-1">Generate reports and export data for analysis.</p>
        </div>

        {/* Manager Selector */}
        {isAdmin && (
          <div className="w-full sm:w-64">
            <label className="block text-xs font-semibold text-text-secondary mb-1 uppercase tracking-wide">
              Filter by Manager
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
              <select
                value={selectedManagerId}
                onChange={(e) => setSelectedManagerId(e.target.value)}
                className="w-full appearance-none bg-surface border border-border rounded-lg pl-9 pr-8 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand shadow-sm transition-shadow"
              >
                <option value="">All Organization (Global)</option>
                {managers.map((m: any) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar: Report Options */}
        <div className="lg:w-80 space-y-3 shrink-0">
          {reportOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSelectedReport(opt.id)}
              className={cn(
                'w-full text-left p-4 rounded-xl border transition-colors',
                selectedReport === opt.id
                  ? 'bg-brand-light border-brand/30'
                  : 'bg-surface border-border hover:bg-background'
              )}
            >
              <div className="flex items-center gap-3 mb-1">
                <opt.icon size={18} className={selectedReport === opt.id ? 'text-brand' : 'text-text-secondary'} />
                <span className={cn('text-sm font-semibold', selectedReport === opt.id ? 'text-brand' : 'text-text-primary')}>{opt.label}</span>
              </div>
              <p className="text-xs text-text-secondary ml-8">{opt.desc}</p>
            </button>
          ))}
        </div>

        {/* Main: Report Content */}
        <div className="flex-1">
          {selectedReport === 'achievement' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text-primary">Achievement Report</h2>
                <button
                  onClick={handleDownloadCsv}
                  disabled={downloading}
                  className="bg-brand text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-brand-dark transition-colors shadow-sm disabled:opacity-60"
                >
                  {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  Download CSV
                </button>
              </div>

              {allGoals.length === 0 ? (
                <div className="bg-surface rounded-xl border border-border p-12 text-center shadow-sm">
                  <BarChart3 size={48} className="mx-auto text-text-secondary/40 mb-4" />
                  <p className="text-text-secondary">No goal data available yet. Goals will appear here once created.</p>
                </div>
              ) : (
                <div className="bg-surface rounded-xl border border-border shadow-sm overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border bg-background">
                        <th className="px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Goal</th>
                        <th className="px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Thrust Area</th>
                        <th className="px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">UoM</th>
                        <th className="px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Target</th>
                        <th className="px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Weightage</th>
                        <th className="px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {allGoals.map((goal: any) => (
                        <tr key={goal.id} className="hover:bg-background/50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-text-primary max-w-[200px] truncate">{goal.title}</td>
                          <td className="px-4 py-3 text-xs text-brand bg-brand-light/50 rounded">{goal.thrustArea}</td>
                          <td className="px-4 py-3 text-sm text-text-secondary">{goal.uom}</td>
                          <td className="px-4 py-3 text-sm font-medium text-text-primary">{goal.target}</td>
                          <td className="px-4 py-3 text-sm font-medium text-text-primary">{goal.weightage}%</td>
                          <td className="px-4 py-3 text-xs font-semibold text-text-secondary">{goal.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {selectedReport === 'completion' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-text-primary">Completion Dashboard</h2>
              <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
                {completion ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm text-text-secondary">Employees Pending</p>
                        <p className="text-3xl font-bold text-text-primary">{completion.submitted} / {completion.total}</p>
                      </div>
                      <div className="flex-1 max-w-xs">
                        <div className="w-full bg-border rounded-full h-3 overflow-hidden">
                          <div
                            className="h-3 rounded-full bg-brand transition-all duration-300"
                            style={{ width: `${completion.rate || 0}%` }}
                          />
                        </div>
                        <p className="text-xs text-text-secondary mt-1">{Math.round(completion.rate || 0)}% completion rate</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-text-secondary">Loading completion data...</p>
                )}
              </div>
            </div>
          )}

          {selectedReport === 'distribution' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-text-primary">Goal Distribution</h2>
              {Object.keys(distribution).length === 0 ? (
                <div className="bg-surface rounded-xl border border-border p-12 text-center shadow-sm">
                  <PieChart size={48} className="mx-auto text-text-secondary/40 mb-4" />
                  <p className="text-text-secondary">No goals to analyze yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(distribution).map(([area, count], i) => (
                    <div key={area} className="bg-surface rounded-xl border border-border p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={cn('h-3 w-3 rounded-full', distributionColors[i % distributionColors.length])} />
                        <span className="text-sm font-medium text-text-primary">{area}</span>
                      </div>
                      <p className="text-2xl font-bold text-text-primary">{count as number}</p>
                      <p className="text-xs text-text-secondary">goals</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
