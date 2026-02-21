import React from 'react';

export default function KPICard({ icon, title, value, unit, subtitle, color = 'blue', trend, invertTrend = false }) {
  const colorMap = {
    blue: { icon: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    teal: { icon: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/30' },
    amber: { icon: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30' },
    red: { icon: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30' },
    green: { icon: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/30' },
    purple: { icon: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/30' },
    cyan: { icon: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-950/30' },
  };

  const c = colorMap[color] || colorMap.blue;

  return (
    <div className="kpi-card">
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-lg ${c.bg}`}>
          <div className={c.icon}>{icon}</div>
        </div>
        {trend !== undefined && trend !== null && (() => {
          const isPositive = trend > 0;
          const isGood = invertTrend ? !isPositive : isPositive;
          return (
            <span
              className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${
                isGood
                  ? 'bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400'
                  : 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'
              }`}
            >
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
            </span>
          );
        })()}
      </div>
      <div className="mt-1.5">
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
          {title}
        </p>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</span>
          {unit && <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{unit}</span>}
        </div>
        {subtitle && (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
