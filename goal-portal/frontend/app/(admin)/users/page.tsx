'use client';

import { useState } from 'react';
import { Search, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import RoleBadge from '@/components/shared/RoleBadge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const mockUsers = [
  { id: '1', name: 'Shailesh Kumar', email: 'shailesh@company.com', role: 'ADMIN' as const, manager: '—', directReports: 5 },
  { id: '2', name: 'Priya Sharma', email: 'priya@company.com', role: 'MANAGER' as const, manager: 'Shailesh Kumar', directReports: 3 },
  { id: '3', name: 'Rahul Verma', email: 'rahul@company.com', role: 'EMPLOYEE' as const, manager: 'Priya Sharma', directReports: 0 },
  { id: '4', name: 'Anita Desai', email: 'anita@company.com', role: 'EMPLOYEE' as const, manager: 'Priya Sharma', directReports: 0 },
  { id: '5', name: 'Vikram Singh', email: 'vikram@company.com', role: 'EMPLOYEE' as const, manager: 'Priya Sharma', directReports: 0 },
  { id: '6', name: 'Neha Gupta', email: 'neha@company.com', role: 'MANAGER' as const, manager: 'Shailesh Kumar', directReports: 2 },
];

// Org hierarchy tree structure
const orgTree = {
  id: '1', name: 'Shailesh Kumar', role: 'ADMIN' as const,
  children: [
    {
      id: '2', name: 'Priya Sharma', role: 'MANAGER' as const,
      children: [
        { id: '3', name: 'Rahul Verma', role: 'EMPLOYEE' as const, children: [] },
        { id: '4', name: 'Anita Desai', role: 'EMPLOYEE' as const, children: [] },
        { id: '5', name: 'Vikram Singh', role: 'EMPLOYEE' as const, children: [] },
      ],
    },
    {
      id: '6', name: 'Neha Gupta', role: 'MANAGER' as const,
      children: [],
    },
  ],
};

interface TreeNode {
  id: string;
  name: string;
  role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
  children: TreeNode[];
}

function TreeView({ node, level = 0 }: { node: TreeNode; level?: number }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <div className={cn('ml-0', level > 0 && 'ml-6 border-l border-border pl-4')}>
      <div
        className="flex items-center gap-3 py-2 cursor-pointer hover:bg-background rounded-lg px-3 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {hasChildren ? (
          expanded ? <ChevronDown size={14} className="text-text-secondary" /> : <ChevronRight size={14} className="text-text-secondary" />
        ) : (
          <div className="w-3.5" />
        )}
        <div className="h-7 w-7 rounded-full bg-brand-light border border-border flex items-center justify-center">
          <span className="text-brand text-xs font-semibold">{node.name.split(' ').map(n => n[0]).join('')}</span>
        </div>
        <span className="text-sm font-medium text-text-primary">{node.name}</span>
        <RoleBadge role={node.role} />
      </div>
      {expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeView key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'tree'>('table');

  const filteredUsers = mockUsers.filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Users & Hierarchy</h1>
          <p className="text-sm text-text-secondary mt-1">Manage users, roles, and reporting lines.</p>
        </div>
        <button
          onClick={() => toast.info('Add User dialog would open here.')}
          className="bg-brand text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-brand-dark transition-colors shadow-sm"
        >
          <Plus size={18} />
          Add User
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-md text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
        </div>
        <div className="flex bg-background border border-border rounded-lg p-1">
          <button
            onClick={() => setViewMode('table')}
            className={cn('px-4 py-1.5 text-sm font-medium rounded-md transition-colors', viewMode === 'table' ? 'bg-surface text-brand shadow-sm' : 'text-text-secondary')}
          >
            Table
          </button>
          <button
            onClick={() => setViewMode('tree')}
            className={cn('px-4 py-1.5 text-sm font-medium rounded-md transition-colors', viewMode === 'tree' ? 'bg-surface text-brand shadow-sm' : 'text-text-secondary')}
          >
            Org Tree
          </button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-background">
                <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Name</th>
                <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Email</th>
                <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Role</th>
                <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Manager</th>
                <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Reports</th>
                <th className="px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-background/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-brand-light border border-border flex items-center justify-center">
                        <span className="text-brand font-semibold text-xs">{user.name.split(' ').map(n => n[0]).join('')}</span>
                      </div>
                      <span className="text-sm font-medium text-text-primary">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{user.email}</td>
                  <td className="px-6 py-4"><RoleBadge role={user.role} /></td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{user.manager}</td>
                  <td className="px-6 py-4 text-sm text-text-primary font-medium">{user.directReports}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => toast.info('Edit Role dialog would open.')} className="text-xs font-medium text-brand hover:underline">Edit Role</button>
                      <button onClick={() => toast.info('Change Manager dialog would open.')} className="text-xs font-medium text-text-secondary hover:text-brand hover:underline">Change Manager</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
          <TreeView node={orgTree} />
        </div>
      )}
    </div>
  );
}
