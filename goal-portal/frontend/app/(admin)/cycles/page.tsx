'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Search, Lock, Unlock } from 'lucide-react';
import { toast } from 'sonner';

const phases = [
  { id: 'goal-setting', label: 'Goal Setting', start: '1 May 2025', end: '31 May 2025', status: 'active' },
  { id: 'q1-checkin', label: 'Q1 Check-in', start: '1 Jul 2025', end: '15 Jul 2025', status: 'upcoming' },
  { id: 'q2-checkin', label: 'Q2 Check-in', start: '1 Oct 2025', end: '15 Oct 2025', status: 'upcoming' },
  { id: 'q3-checkin', label: 'Q3 Check-in', start: '1 Jan 2026', end: '15 Jan 2026', status: 'upcoming' },
  { id: 'q4-checkin', label: 'Q4 Check-in', start: '1 Apr 2026', end: '15 Apr 2026', status: 'upcoming' },
];

export default function CyclesPage() {
  const [unlockSearch, setUnlockSearch] = useState('');
  const [unlockReason, setUnlockReason] = useState('');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Cycle Management</h1>
        <p className="text-sm text-text-secondary mt-1">Manage goal-setting windows and check-in phases.</p>
      </div>

      {/* Active Cycle Card */}
      <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">FY 2025–26</h2>
            <p className="text-sm text-text-secondary mt-1">
              Phase: <span className="font-semibold text-brand">Goal Setting</span>
            </p>
            <p className="text-sm text-text-secondary">Window: 1 May 2025 → 31 May 2025</p>
          </div>
          <span className="inline-flex items-center rounded-full bg-success-light px-3 py-1 text-xs font-semibold text-emerald-700 uppercase tracking-wide">
            Active
          </span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => toast.info('Phase would be closed.')}
            className="px-4 py-2 text-sm font-semibold border border-border text-text-secondary hover:bg-background rounded-lg transition-colors"
          >
            Close Current Phase
          </button>
          <button
            onClick={() => toast.success('Q1 Check-in phase opened!')}
            className="px-4 py-2 text-sm font-semibold bg-brand text-white hover:bg-brand-dark rounded-lg transition-colors shadow-sm"
          >
            Open Q1 Check-in
          </button>
        </div>
      </div>

      {/* Phase Timeline */}
      <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-text-primary mb-6">Phase Timeline</h3>
        <div className="flex items-center gap-0 overflow-x-auto pb-4">
          {phases.map((phase, i) => (
            <div key={phase.id} className="flex items-center">
              <div className="flex flex-col items-center min-w-[120px]">
                <div
                  className={cn(
                    'h-4 w-4 rounded-full border-2',
                    phase.status === 'active'
                      ? 'bg-brand border-brand'
                      : 'bg-surface border-border'
                  )}
                />
                <p className={cn(
                  'text-xs font-medium mt-2 text-center',
                  phase.status === 'active' ? 'text-brand' : 'text-text-secondary'
                )}>
                  {phase.label}
                </p>
                <p className="text-xs text-text-secondary mt-0.5">{phase.start}</p>
                {phase.status === 'active' && (
                  <span className="text-xs text-brand font-medium mt-1">(active)</span>
                )}
              </div>
              {i < phases.length - 1 && (
                <div className={cn(
                  'h-0.5 w-12 -mt-6',
                  i === 0 ? 'bg-brand' : 'bg-border'
                )} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Unlock Goal Card */}
      <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Unlock size={16} className="text-warning" />
          Unlock Goal
        </h3>
        <p className="text-sm text-text-secondary mb-4">
          Search for an employee and goal to unlock it for editing. This will be recorded in the audit log.
        </p>
        <div className="space-y-4 max-w-lg">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              placeholder="Search by employee or goal title..."
              value={unlockSearch}
              onChange={(e) => setUnlockSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-border rounded-md text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
          </div>
          <textarea
            placeholder="Reason for unlock (required)"
            value={unlockReason}
            onChange={(e) => setUnlockReason(e.target.value)}
            rows={3}
            className="w-full border border-border rounded-md px-4 py-3 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none"
          />
          <button
            disabled={!unlockReason.trim()}
            onClick={() => { toast.success('Goal unlocked. Audit log updated.'); setUnlockReason(''); setUnlockSearch(''); }}
            className="px-4 py-2 text-sm font-semibold bg-warning text-white hover:bg-amber-500 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Unlock size={16} />
            Unlock Goal
          </button>
        </div>
      </div>
    </div>
  );
}
