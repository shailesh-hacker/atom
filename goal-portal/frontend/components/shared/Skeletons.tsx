'use client';

export function SkeletonCard() {
  return (
    <div className="bg-surface rounded-xl border border-border p-6 space-y-4 animate-pulse">
      <div className="flex justify-between">
        <div className="skeleton h-5 w-24" />
        <div className="skeleton h-5 w-16" />
      </div>
      <div className="skeleton h-5 w-3/4" />
      <div className="skeleton h-4 w-full" />
      <div className="skeleton h-4 w-1/2" />
      <div className="border-t border-border pt-4 flex gap-4">
        <div className="skeleton h-4 w-20" />
        <div className="skeleton h-4 w-20" />
        <div className="skeleton h-4 w-20" />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4"><div className="skeleton h-4 w-24" /></td>
      <td className="px-6 py-4"><div className="skeleton h-4 w-40" /></td>
      <td className="px-6 py-4"><div className="skeleton h-4 w-20" /></td>
      <td className="px-6 py-4"><div className="skeleton h-4 w-16" /></td>
      <td className="px-6 py-4"><div className="skeleton h-4 w-16" /></td>
    </tr>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-background">
            <th className="px-6 py-3"><div className="skeleton h-3 w-20" /></th>
            <th className="px-6 py-3"><div className="skeleton h-3 w-24" /></th>
            <th className="px-6 py-3"><div className="skeleton h-3 w-16" /></th>
            <th className="px-6 py-3"><div className="skeleton h-3 w-16" /></th>
            <th className="px-6 py-3"><div className="skeleton h-3 w-16" /></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
