import React from 'react';

export const SkeletonBox: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => (
  <div className={`bg-slate-200/80 animate-pulse rounded-lg ${className}`} />
);

export const MetricCardSkeleton: React.FC = () => (
  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
    <div className="flex items-center justify-between">
      <SkeletonBox className="h-3 w-24" />
      <SkeletonBox className="h-8 w-8 rounded-lg" />
    </div>
    <SkeletonBox className="h-8 w-20" />
    <SkeletonBox className="h-3 w-32" />
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
    <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
      <SkeletonBox className="h-4 w-32" />
      <SkeletonBox className="h-8 w-24" />
    </div>
    <div className="p-4 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-2 border-b border-slate-100 last:border-none">
          <SkeletonBox className="h-4 w-1/4" />
          <SkeletonBox className="h-4 w-1/6" />
          <SkeletonBox className="h-4 w-1/6" />
          <SkeletonBox className="h-4 w-1/8" />
        </div>
      ))}
    </div>
  </div>
);

export const ChartSkeleton: React.FC = () => (
  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
    <div className="flex justify-between items-center">
      <SkeletonBox className="h-4 w-36" />
      <SkeletonBox className="h-6 w-24" />
    </div>
    <div className="h-48 bg-slate-50 border border-slate-100 rounded-xl flex items-end justify-between p-4 gap-2">
      {Array.from({ length: 12 }).map((_, i) => (
        <SkeletonBox
          key={i}
          className={`w-full rounded-t-md`}
          style={{ height: `${Math.floor(Math.random() * 60) + 30}%` } as any}
        />
      ))}
    </div>
  </div>
);
