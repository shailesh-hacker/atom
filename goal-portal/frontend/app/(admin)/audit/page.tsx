'use client';

import { useState } from 'react';
import { Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

const actionColors: Record<string, { bg: string; text: string }> = {
  APPROVE: { bg: 'bg-success-light', text: 'text-emerald-700' },
  RETURN: { bg: 'bg-danger-light', text: 'text-red-700' },
  UNLOCK: { bg: 'bg-warning-light', text: 'text-amber-700' },
  UPDATE: { bg: 'bg-info-light', text: 'text-blue-700' },
  CREATE: { bg: 'bg-brand-light', text: 'text-brand' },
  DELETE: { bg: 'bg-danger-light', text: 'text-red-700' },
  MANAGER_EDIT: { bg: 'bg-purple-50', text: 'text-purple-700' },
  SHARED_PUSH: { bg: 'bg-purple-50', text: 'text-purple-700' },
};

export default function AuditPage() {
  const [actionFilter, setActionFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const { data } = await api.get('/audit');
      return data;
    },
  });

  const filteredLogs = logs.filter((log: any) => {
    const matchesSearch = log.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    if (actionFilter === 'ALL') return matchesSearch;
    return matchesSearch && log.action === actionFilter;
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Audit Log</h1>
          <p className="text-sm text-text-secondary mt-1">Track all changes to goals and check-ins.</p>
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
          <option value="CREATE">Create</option>
          <option value="APPROVE">Approve</option>
          <option value="RETURN">Return</option>
          <option value="UNLOCK">Unlock</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
          <option value="MANAGER_EDIT">Manager Edit</option>
        </select>
      </div>

      {/* Audit Table */}
      {filteredLogs.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-12 text-center shadow-sm">
          <p className="text-text-secondary">No audit logs match your filters.</p>
        </div>
      ) : (
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
              {filteredLogs.map((log: any) => {
                const colors = actionColors[log.action] || actionColors.UPDATE;
                return (
                  <tr key={log.id} className="hover:bg-background/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-text-secondary whitespace-nowrap font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-text-primary">{log.user?.name || 'Unknown'}</td>
                    <td className="px-6 py-4">
                      <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase', colors.bg, colors.text)}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary max-w-[200px] truncate">
                      {log.entityType}: {log.entityId?.substring(0, 8)}…
                    </td>
                    <td className="px-6 py-4">
                      {log.oldValue ? (
                        <code className="text-xs bg-danger-light text-red-700 px-2 py-1 rounded font-mono line-through block max-w-[200px] truncate">
                          {JSON.stringify(log.oldValue)}
                        </code>
                      ) : (
                        <span className="text-xs text-text-secondary">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {log.newValue ? (
                        <code className="text-xs bg-success-light text-emerald-700 px-2 py-1 rounded font-mono block max-w-[200px] truncate">
                          {JSON.stringify(log.newValue)}
                        </code>
                      ) : (
                        <span className="text-xs text-text-secondary">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">Showing {filteredLogs.length} of {logs.length} entries</p>
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
