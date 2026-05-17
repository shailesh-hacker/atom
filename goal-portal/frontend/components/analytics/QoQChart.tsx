'use client';

import { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  BarChart,
  Bar,
} from 'recharts';

interface QoQChartData {
  quarter: string;
  averageScore: number;
  completedGoals: number;
}

interface QoQChartProps {
  data: QoQChartData[];
  title?: string;
  subtitle?: string;
}

export default function QoQChart({
  data,
  title = 'Quarter-over-Quarter Analytics',
  subtitle = 'Goal achievement scores and completed volumes',
}: QoQChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="bg-surface rounded-xl border border-border p-6 shadow-sm h-[400px] flex items-center justify-center">
        <p className="text-xs text-text-secondary animate-pulse">Loading charts...</p>
      </div>
    );
  }

  // Clean, minimalist custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface border border-border rounded-lg p-3 shadow-lg text-xs space-y-1.5">
          <p className="font-semibold text-text-primary mb-1">{label}</p>
          {payload.map((p: any) => (
            <div key={p.name} className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: p.color }}
              />
              <span className="text-text-secondary">{p.name}:</span>
              <span className="font-bold text-text-primary">
                {p.name === 'Average Score' ? `${Math.round(p.value)}%` : p.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-surface rounded-xl border border-border p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-text-primary">{title}</h3>
          <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>
        </div>

        {/* Legend Indicators */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-brand" />
            <span className="text-text-secondary font-medium">Average Score</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded bg-emerald-500" />
            <span className="text-text-secondary font-medium">Completed Goals</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart 1: Average Score Trend (Line) */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Average Progress Score (%)</p>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="quarter"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} />
                <Line
                  type="monotone"
                  dataKey="averageScore"
                  name="Average Score"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  dot={{ r: 4, stroke: '#4f46e5', strokeWidth: 2, fill: '#ffffff' }}
                  activeDot={{ r: 6, fill: '#4f46e5' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Completed Goals Volume (Bar) */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Completed Goals Volume</p>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="quarter"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', opacity: 0.5 }} />
                <Bar
                  dataKey="completedGoals"
                  name="Completed Goals"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
