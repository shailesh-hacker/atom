'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import { Search, Plus, ChevronDown, ChevronRight, Loader2, X, UserPlus, Shield, Users as UsersIcon } from 'lucide-react';
import RoleBadge from '@/components/shared/RoleBadge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import api from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
  managerId: string | null;
  managerName: string | null;
  directReports: number;
}

interface TreeNode {
  id: string;
  name: string;
  email: string;
  role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
  children: TreeNode[];
}

interface Manager {
  id: string;
  name: string;
  role: string;
}

// ── Org Tree View Component ──
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

// ── Modal Backdrop ──
function Modal({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: React.ReactNode; title: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface rounded-2xl border border-border shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-background transition-colors text-text-secondary">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [orgTree, setOrgTree] = useState<TreeNode[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'tree'>('table');

  // Modal states
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [editRoleOpen, setEditRoleOpen] = useState(false);
  const [changeManagerOpen, setChangeManagerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Add user form
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'EMPLOYEE' | 'MANAGER' | 'ADMIN'>('EMPLOYEE');
  const [newManagerId, setNewManagerId] = useState('');

  // Edit role form
  const [editRole, setEditRole] = useState<'EMPLOYEE' | 'MANAGER' | 'ADMIN'>('EMPLOYEE');

  // Change manager form
  const [editManagerId, setEditManagerId] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [usersRes, treeRes, managersRes] = await Promise.all([
        api.get('/users'),
        api.get('/users/org-tree'),
        api.get('/users/managers'),
      ]);
      setUsers(usersRes.data);
      setOrgTree(treeRes.data);
      setManagers(managersRes.data);
    } catch (err: any) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Add User ──
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/users', {
        name: newName,
        email: newEmail,
        password: newPassword,
        role: newRole,
        managerId: newManagerId || undefined,
      });
      toast.success(`User "${newName}" created successfully.`);
      setAddUserOpen(false);
      resetAddForm();
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const resetAddForm = () => {
    setNewName('');
    setNewEmail('');
    setNewPassword('');
    setNewRole('EMPLOYEE');
    setNewManagerId('');
  };

  // ── Edit Role ──
  const openEditRole = (user: User) => {
    setSelectedUser(user);
    setEditRole(user.role);
    setEditRoleOpen(true);
  };

  const handleEditRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      await api.patch(`/users/${selectedUser.id}/role`, { role: editRole });
      toast.success(`Role updated to ${editRole}.`);
      setEditRoleOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update role');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Change Manager ──
  const openChangeManager = (user: User) => {
    setSelectedUser(user);
    setEditManagerId(user.managerId || '');
    setChangeManagerOpen(true);
  };

  const handleChangeManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      await api.patch(`/users/${selectedUser.id}/manager`, {
        managerId: editManagerId || null,
      });
      toast.success('Manager updated successfully.');
      setChangeManagerOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update manager');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Users & Hierarchy</h1>
          <p className="text-sm text-text-secondary mt-1">Manage users, roles, and reporting lines.</p>
        </div>
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 size={32} className="animate-spin text-brand" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Users & Hierarchy</h1>
          <p className="text-sm text-text-secondary mt-1">Manage users, roles, and reporting lines.</p>
        </div>
        <button
          onClick={() => { resetAddForm(); setAddUserOpen(true); }}
          className="bg-brand text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-brand-dark transition-colors shadow-sm"
        >
          <Plus size={18} />
          Add User
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface rounded-xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <UsersIcon size={18} className="text-brand" />
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">Total Users</span>
          </div>
          <p className="text-2xl font-bold text-text-primary">{users.length}</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Shield size={18} className="text-warning" />
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">Managers</span>
          </div>
          <p className="text-2xl font-bold text-text-primary">{users.filter(u => u.role === 'MANAGER').length}</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <UserPlus size={18} className="text-info" />
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">Employees</span>
          </div>
          <p className="text-2xl font-bold text-text-primary">{users.filter(u => u.role === 'EMPLOYEE').length}</p>
        </div>
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
                  <td className="px-6 py-4 text-sm text-text-secondary">{user.managerName || '—'}</td>
                  <td className="px-6 py-4 text-sm text-text-primary font-medium">{user.directReports}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEditRole(user)} className="text-xs font-medium text-brand hover:underline">Edit Role</button>
                      <button onClick={() => openChangeManager(user)} className="text-xs font-medium text-text-secondary hover:text-brand hover:underline">Change Manager</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
          {orgTree.length > 0 ? (
            orgTree.map((root) => <TreeView key={root.id} node={root} />)
          ) : (
            <p className="text-sm text-text-secondary text-center py-8">No organizational data available.</p>
          )}
        </div>
      )}

      {/* ── Add User Modal ── */}
      <Modal open={addUserOpen} onClose={() => setAddUserOpen(false)} title="Add New User">
        <form onSubmit={handleAddUser} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-primary">Full Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              placeholder="John Doe"
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-primary">Email</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              placeholder="john@company.com"
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-primary">Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-primary">Role</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as any)}
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-primary">Reports To</label>
            <select
              value={newManagerId}
              onChange={(e) => setNewManagerId(e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            >
              <option value="">None (Top-level)</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setAddUserOpen(false)} className="px-4 py-2 text-sm font-medium text-text-secondary hover:bg-background rounded-lg transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-semibold text-white bg-brand hover:bg-brand-dark rounded-lg transition-colors shadow-sm disabled:opacity-60 flex items-center gap-2"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              Create User
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Edit Role Modal ── */}
      <Modal open={editRoleOpen} onClose={() => setEditRoleOpen(false)} title="Edit User Role">
        <form onSubmit={handleEditRole} className="space-y-4">
          {selectedUser && (
            <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
              <div className="h-8 w-8 rounded-full bg-brand-light border border-border flex items-center justify-center">
                <span className="text-brand font-semibold text-xs">{selectedUser.name.split(' ').map(n => n[0]).join('')}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">{selectedUser.name}</p>
                <p className="text-xs text-text-secondary">{selectedUser.email}</p>
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-primary">New Role</label>
            <select
              value={editRole}
              onChange={(e) => setEditRole(e.target.value as any)}
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setEditRoleOpen(false)} className="px-4 py-2 text-sm font-medium text-text-secondary hover:bg-background rounded-lg transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-semibold text-white bg-brand hover:bg-brand-dark rounded-lg transition-colors shadow-sm disabled:opacity-60 flex items-center gap-2"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              Update Role
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Change Manager Modal ── */}
      <Modal open={changeManagerOpen} onClose={() => setChangeManagerOpen(false)} title="Change Manager">
        <form onSubmit={handleChangeManager} className="space-y-4">
          {selectedUser && (
            <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
              <div className="h-8 w-8 rounded-full bg-brand-light border border-border flex items-center justify-center">
                <span className="text-brand font-semibold text-xs">{selectedUser.name.split(' ').map(n => n[0]).join('')}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">{selectedUser.name}</p>
                <p className="text-xs text-text-secondary">Currently reports to: {selectedUser.managerName || 'None'}</p>
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-primary">New Manager</label>
            <select
              value={editManagerId}
              onChange={(e) => setEditManagerId(e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            >
              <option value="">None (Top-level)</option>
              {managers
                .filter((m) => m.id !== selectedUser?.id)
                .map((m) => (
                  <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setChangeManagerOpen(false)} className="px-4 py-2 text-sm font-medium text-text-secondary hover:bg-background rounded-lg transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-semibold text-white bg-brand hover:bg-brand-dark rounded-lg transition-colors shadow-sm disabled:opacity-60 flex items-center gap-2"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              Update Manager
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
