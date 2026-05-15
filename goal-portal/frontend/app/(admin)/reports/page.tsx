'use client';

import { useState } from 'react';
import { Download, BarChart3, CheckSquare, PieChart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const reportOptions = [
  { id: 'achievement', label: 'Achievement Report', desc: 'Export all goals with planned vs actual', icon: BarChart3 },
  { id: 'completion', label: 'Completion Dashboard', desc: 'Who has / hasn\'t completed check-ins', icon: CheckSquare },
  { id: 'distribution', label: 'Goal Distribution', desc: 'Breakdown by thrust area and UoM', icon: PieChart },
];

const mockReportPreview = [
  { employee: 'Priya Sharma', goal: 'Increase Sales by 20%', thrustArea: 'Sales & Revenue', uom: 'Percentage', target: 20, q1: 8, q2: '—', q3: '—', q4: '—', score: '40%' },
  { employee: 'Rahul Verma', goal: 'Cloud Migration', thrustArea: 'Technology', uom: 'Timeline', target: 1, q1: 0.7, q2: '—', q3: '—', q4: '—', score: '70%' },
  { employee: 'Rahul Verma', goal: 'Reduce Deploy Failures', thrustArea: 'Operations', uom: 'Zero-Based', target: 0, q1: 0, q2: '—', q3: '—', q4: '—', score: '100%' },
  { employee: 'Anita Desai', goal: 'SOC 2 Compliance', thrustArea: 'Compliance', uom: 'Numeric', target: 1, q1: 0.5, q2: '—', q3: '—', q4: '—', score: '50%' },
];

const mockCompletion = [
  { name: 'Priya Sharma', q1: true, q2: false, q3: false, q4: false },
  { name: 'Rahul Verma', q1: true, q2: false, q3: false, q4: false },
  { name: 'Anita Desai', q1: true, q2: false, q3: false, q4: false },
  { name: 'Vikram Singh', q1: false, q2: false, q3: false, q4: false },
];

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState('achievement');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Reports & Export</h1>
        <p className="text-sm text-text-secondary mt-1">Generate reports and export data for analysis.</p>
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
                <h2 className="text-lg font-semibold text-text-primary">Achievement Report Preview</h2>
                <button
                  onClick={() => toast.success('CSV download started!')}
                  className="bg-brand text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-brand-dark transition-colors shadow-sm"
                >
                  <Download size={16} />
                  Download CSV
                </button>
              </div>

              <div className="bg-surface rounded-xl border border-border shadow-sm overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border bg-background">
                      <th className="px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Employee</th>
                      <th className="px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Goal</th>
                      <th className="px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Thrust Area</th>
                      <th className="px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">UoM</th>
                      <th className="px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Target</th>
                      <th className="px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Q1</th>
                      <th className="px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Q2</th>
                      <th className="px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Q3</th>
                      <th className="px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Q4</th>
                      <th className="px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {mockReportPreview.map((row, i) => (
                      <tr key={i} className="hover:bg-background/50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-text-primary whitespace-nowrap">{row.employee}</td>
                        <td className="px-4 py-3 text-sm text-text-secondary max-w-[150px] truncate">{row.goal}</td>
                        <td className="px-4 py-3 text-xs text-brand bg-brand-light/50 rounded">{row.thrustArea}</td>
                        <td className="px-4 py-3 text-sm text-text-secondary">{row.uom}</td>
                        <td className="px-4 py-3 text-sm font-medium text-text-primary">{row.target}</td>
                        <td className="px-4 py-3 text-sm text-text-primary">{row.q1}</td>
                        <td className="px-4 py-3 text-sm text-text-secondary">{row.q2}</td>
                        <td className="px-4 py-3 text-sm text-text-secondary">{row.q3}</td>
                        <td className="px-4 py-3 text-sm text-text-secondary">{row.q4}</td>
                        <td className="px-4 py-3 text-sm font-bold text-text-primary">{row.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selectedReport === 'completion' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text-primary">Completion Dashboard</h2>
                <button className="text-sm text-brand font-medium hover:underline">Show incomplete only</button>
              </div>

              <div className="bg-surface rounded-xl border border-border shadow-sm divide-y divide-border">
                {mockCompletion.map((emp, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-4">
                    <div className="h-8 w-8 rounded-full bg-brand-light border border-border flex items-center justify-center">
                      <span className="text-brand font-semibold text-xs">{emp.name.split(' ').map(n => n[0]).join('')}</span>
                    </div>
                    <span className="text-sm font-medium text-text-primary flex-1">{emp.name}</span>
                    <div className="flex gap-2">
                      {[emp.q1, emp.q2, emp.q3, emp.q4].map((done, qi) => (
                        <div
                          key={qi}
                          className={cn(
                            'h-6 w-6 rounded flex items-center justify-center text-xs',
                            done ? 'bg-success-light text-emerald-700' : 'bg-gray-100 text-gray-400'
                          )}
                          title={`Q${qi + 1}: ${done ? 'Completed' : 'Pending'}`}
                        >
                          {done ? '✓' : '—'}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedReport === 'distribution' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-text-primary">Goal Distribution</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { area: 'Sales & Revenue', count: 4, color: 'bg-brand' },
                  { area: 'Technology', count: 3, color: 'bg-info' },
                  { area: 'Operations', count: 2, color: 'bg-warning' },
                  { area: 'People & Culture', count: 2, color: 'bg-success' },
                  { area: 'Customer Experience', count: 1, color: 'bg-purple-500' },
                  { area: 'Compliance', count: 1, color: 'bg-pink-500' },
                ].map((item) => (
                  <div key={item.area} className="bg-surface rounded-xl border border-border p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cn('h-3 w-3 rounded-full', item.color)} />
                      <span className="text-sm font-medium text-text-primary">{item.area}</span>
                    </div>
                    <p className="text-2xl font-bold text-text-primary">{item.count}</p>
                    <p className="text-xs text-text-secondary">goals</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
