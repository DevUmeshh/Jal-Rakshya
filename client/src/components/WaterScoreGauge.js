import React from 'react';

export default function WaterScoreGauge({ score, size = 150 }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const dashoffset = circumference - progress;

  const getColor = (s) => {
    if (s >= 70) return '#22c55e';
    if (s >= 40) return '#eab308';
    return '#ef4444';
  };

  const getLabel = (s) => {
    if (s >= 80) return 'Excellent';
    if (s >= 70) return 'Good';
    if (s >= 50) return 'Fair';
    if (s >= 30) return 'Poor';
    return 'Critical';
  };

  const color = getColor(score);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={6}
            className="text-slate-200 dark:text-slate-700"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-800 dark:text-slate-100 tabular-nums">{score}</span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">/100</span>
        </div>
      </div>
      <p className="mt-1.5 text-xs font-semibold" style={{ color }}>
        {getLabel(score)}
      </p>
    </div>
  );
}
