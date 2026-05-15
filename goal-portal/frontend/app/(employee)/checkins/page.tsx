'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import StatusChip from '@/components/shared/StatusChip';
import { toast } from 'sonner';

const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

const mockCheckins = [
  { id: '1', employee: 'Priya Sharma', goal: 'Increase Sales by 20%', target: 20, achievement: 8, score: 40, status: 'ON_TRACK', comment: 'Closed 3 enterprise deals in Q1. Pipeline looks strong for Q2.' },
  { id: '2', employee: 'Priya Sharma', goal: 'Launch Partner Program', target: 1, achievement: 0, score: 0, status: 'NOT_STARTED', comment: '' },
  { id: '3', employee: 'Rahul Verma', goal: 'Migrate to Cloud Infrastructure', target: 1, achievement: 0.7, score: 70, status: 'ON_TRACK', comment: 'AWS migration 70% complete. EKS clusters are live.' },
  { id: '4', employee: 'Rahul Verma', goal: 'Reduce Deploy Failures', target: 0, achievement: 0, score: 100, status: 'COMPLETED', comment: 'Zero deploy failures this quarter!' },
  { id: '5', employee: 'Anita Desai', goal: 'Ensure SOC 2 Compliance', target: 1, achievement: 0.5, score: 50, status: 'ON_TRACK', comment: 'Controls documentation in progress. Audit scheduled for Q2.' },
];

export default function CheckinsPage() {
  const [selectedQuarter, setSelectedQuarter] = useState('Q1');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [commentValue, setCommentValue] = useState('');

  // Completion stats
  const employeesUpdated = 3;
  const totalEmployees = 4;
  const completionRate = Math.round((employeesUpdated / totalEmployees) * 100);

  const handleSaveComment = (id: string) => {
    toast.success('Comment saved.');
    setEditingComment(null);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Quarterly Check-ins — {selectedQuarter} 2025</h1>
          <p className="text-sm text-text-secondary mt-1">Review achievement data and add coaching comments.</p>
        </div>

        {/* Quarter selector */}
        <div className="flex bg-background border border-border rounded-lg p-1">
          {quarters.map((q) => (
            <button
              key={q}
              onClick={() => setSelectedQuarter(q)}
              className={cn(
                'px-4 py-1.5 text-sm font-medium rounded-md transition-colors',
                selectedQuarter === q
                  ? 'bg-surface text-brand shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Completion Rate Card */}
      <div className="bg-surface rounded-xl border border-border p-6 shadow-sm max-w-sm">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Team Check-in Completion</h3>
        <p className="text-sm text-text-secondary mb-3">
          {employeesUpdated} / {totalEmployees} employees updated
        </p>
        <div className="w-full bg-border rounded-full h-2.5 overflow-hidden mb-2">
          <div
            className="h-2.5 rounded-full bg-brand transition-all duration-300"
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <button className="text-xs text-brand font-medium hover:underline">View pending →</button>
      </div>

      {/* Check-in Table */}
      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-background">
              <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Employee</th>
              <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Goal</th>
              <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Target</th>
              <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Achievement</th>
              <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Progress</th>
              <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Status</th>
              <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Comment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {mockCheckins.map((row) => (
              <tr key={row.id} className="hover:bg-background/50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-text-primary whitespace-nowrap">{row.employee}</td>
                <td className="px-6 py-4 text-sm text-text-secondary max-w-[200px] truncate">{row.goal}</td>
                <td className="px-6 py-4 text-sm text-text-primary font-medium">{row.target}</td>
                <td className="px-6 py-4 text-sm text-text-primary font-medium">{row.achievement}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-border rounded-full h-2 overflow-hidden">
                      <div
                        className={cn(
                          'h-2 rounded-full transition-all',
                          row.score >= 80 ? 'bg-success' : row.score >= 50 ? 'bg-warning' : 'bg-danger'
                        )}
                        style={{ width: `${Math.min(row.score, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-text-primary">{row.score}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <StatusChip status={row.status as any} />
                </td>
                <td className="px-6 py-4">
                  {editingComment === row.id ? (
                    <input
                      type="text"
                      value={commentValue}
                      onChange={(e) => setCommentValue(e.target.value)}
                      onBlur={() => handleSaveComment(row.id)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveComment(row.id)}
                      autoFocus
                      className="w-full border border-border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    />
                  ) : (
                    <button
                      onClick={() => { setEditingComment(row.id); setCommentValue(row.comment); }}
                      className="text-sm text-text-secondary hover:text-brand truncate max-w-[200px] block text-left"
                      title={row.comment || 'Add comment'}
                    >
                      {row.comment || <span className="text-brand text-xs font-medium">+ Add Comment</span>}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
