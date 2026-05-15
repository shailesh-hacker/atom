'use client';

import { Check, X, Edit2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const mockTeamGoals = [
  {
    id: '1',
    employee: 'John Doe',
    title: 'Increase Sales by 20%',
    status: 'SUBMITTED',
    weightage: 30,
    target: 1000000,
    uom: 'NUMERIC',
  },
  {
    id: '2',
    employee: 'Jane Smith',
    title: 'Complete 5 Training Modules',
    status: 'APPROVED',
    weightage: 20,
    target: 5,
    uom: 'NUMERIC',
  },
  {
    id: '3',
    employee: 'Bob Wilson',
    title: 'Improve System Uptime',
    status: 'SUBMITTED',
    weightage: 50,
    target: 99.9,
    uom: 'PERCENTAGE',
  }
];

export default function TeamTable() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Employee</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Goal Title</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Weightage</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mockTeamGoals.map((goal) => (
              <tr key={goal.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                      {goal.employee.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="font-bold text-slate-900">{goal.employee}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-slate-600 font-medium">{goal.title}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-slate-900 font-bold">{goal.weightage}%</span>
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                    goal.status === 'APPROVED' ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"
                  )}>
                    {goal.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 rounded-lg hover:bg-green-100 text-green-600 transition-colors" title="Approve">
                      <Check size={16} />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition-colors" title="Return">
                      <X size={16} />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors" title="Edit">
                      <Edit2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
