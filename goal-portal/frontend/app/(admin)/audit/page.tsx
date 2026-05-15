'use client';

import { useState } from 'react';
import { Search, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const mockAuditLogs = [
  { id: '1', timestamp: '2025-05-15 14:32:10', user: 'Priya Sharma', action: 'APPROVE', entity: 'Goal: Increase Sales by 20%', oldValue: { status: 'SUBMITTED' }, newValue: { status: 'APPROVED', locked: true } },
  { id: '2', timestamp: '2025-05-15 14:30:55', user: 'Priya Sharma', action: 'APPROVE', entity: 'Goal: Launch Partner Program', oldValue: { status: 'SUBMITTED' }, newValue: { status: 'APPROVED', locked: true } },
  { id: '3', timestamp: '2025-05-14 11:20:00', user: 'Shailesh Kumar', action: 'UNLOCK', entity: 'Goal: Cloud Migration', oldValue: { locked: true }, newValue: { locked: false } },
  { id: '4', timestamp: '2025-05-13 09:15:30', user: 'Rahul Verma', action: 'UPDATE', entity: 'GoalUpdate: Cloud Migration Q1', oldValue: { achievement: 0.5 }, newValue: { achievement: 0.7 } },
  { id: '5', timestamp: '2025-05-12 16:45:20', user: 'Priya Sharma', action: 'RETURN', entity: 'Goal: Employee Engagement', oldValue: { status: 'SUBMITTED' }, newValue: { status: 'RETURNED', locked: false } },
  { id: '6', timestamp: '2025-05-11 10:00:00', user: 'Anita Desai', action: 'UPDATE', entity: 'Goal: SOC 2 Compliance', oldValue: { weightage: 40 }, newValue: { weightage: 50 } },
];

const actionColors: Record<string, { bg: string; text: string }> = {
  APPROVE: { bg: 'bg-success-light', text: 'text-emerald-700' },
  RETURN: { bg: 'bg-danger-light', text: 'text-red-700' },
  UNLOCK: { bg: 'bg-warning-light', text: 'text-amber-700' },
  UPDATE: { bg: 'bg-info-light', text: 'text-blue-700' },
};

export default function AuditPage() {
  const [actionFilter, setActionFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = mockAuditLogs.filter((log) => {
    const matchesSearch = log.user.toLowerCase().includes(searchTerm.toLowerCase());
    if (actionFilter === 'ALL') return matchesSearch;
    return matchesSearch && log.action === actionFilter;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Audit Log</h1>
        <p className="text-sm text-text-secondary mt-1">Track all changes to goals and check-ins.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Search by user name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-md text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="border border-border rounded-md px-4 py-2.5 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
        >
          <option value="ALL">All Actions</option>
          <option value="APPROVE">Approve</option>
          <option value="RETURN">Return</option>
          <option value="UNLOCK">Unlock</option>
          <option value="UPDATE">Update</option>
        </select>
      </div>

      {/* Audit Table */}
      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-background">
              <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Timestamp</th>
              <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">User</th>
              <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Action</th>
              <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Entity</th>
              <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Old Value</th>
              <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">New Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredLogs.map((log) => {
              const colors = actionColors[log.action] || actionColors.UPDATE;
              return (
                <tr key={log.id} className="hover:bg-background/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-text-secondary whitespace-nowrap font-mono">{log.timestamp}</td>
                  <td className="px-6 py-4 text-sm font-medium text-text-primary">{log.user}</td>
                  <td className="px-6 py-4">
                    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase', colors.bg, colors.text)}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary max-w-[200px] truncate">{log.entity}</td>
                  <td className="px-6 py-4">
                    <code className="text-xs bg-danger-light text-red-700 px-2 py-1 rounded font-mono line-through">
                      {JSON.stringify(log.oldValue)}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-xs bg-success-light text-emerald-700 px-2 py-1 rounded font-mono">
                      {JSON.stringify(log.newValue)}
                    </code>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">Showing {filteredLogs.length} of {mockAuditLogs.length} entries</p>
        <div className="flex gap-1">
          <button className="p-2 border border-border rounded-md hover:bg-background transition-colors" aria-label="Previous page">
            <ChevronLeft size={16} className="text-text-secondary" />
          </button>
          <button className="px-3 py-1 border border-brand bg-brand-light text-brand text-sm font-medium rounded-md">1</button>
          <button className="p-2 border border-border rounded-md hover:bg-background transition-colors" aria-label="Next page">
            <ChevronRight size={16} className="text-text-secondary" />
          </button>
        </div>
      </div>
    </div>
  );
}
