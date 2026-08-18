import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  changePct?: number;
  changeLabel?: string;
  icon: LucideIcon;
  description?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  changePct,
  changeLabel = 'vs last 30 days',
  icon: Icon,
  description,
}) => {
  const isPositive = changePct !== undefined && changePct >= 0;

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
          <div className="text-2xl md:text-3xl font-bold text-slate-900 mt-1 tracking-tight">{value}</div>
        </div>
        <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        {changePct !== undefined ? (
          <div className="flex items-center gap-1">
            <span
              className={`inline-flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded text-[11px] ${
                isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}
            >
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {isPositive ? `+${changePct}%` : `${changePct}%`}
            </span>
            <span className="text-slate-400 font-normal">{changeLabel}</span>
          </div>
        ) : (
          <span className="text-slate-500">{description || 'Updated real-time'}</span>
        )}
      </div>
    </div>
  );
};
