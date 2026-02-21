import React from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiTrendingDown, FiMinus } from 'react-icons/fi';

function TrendBadge({ label, current, previous, unit = '', invert = false, icon }) {
  if (current == null || previous == null) return null;
  if (previous === 0) return null; // Can't calculate % change from zero
  const change = ((current - previous) / Math.abs(previous)) * 100;
  const isUp = change > 0;
  const isNeutral = Math.abs(change) < 1;
  // For depletion, up is bad => invert color
  const isGood = invert ? !isUp : isUp;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.04 }}
      className="glass-card-sm p-4 flex items-center gap-4 group cursor-default"
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg ${
        isNeutral
          ? 'bg-gray-100 dark:bg-gray-800 text-gray-400'
          : isGood
          ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
          : 'bg-red-100 dark:bg-red-900/30 text-red-500'
      }`}>
        {icon || (isNeutral ? <FiMinus /> : isUp ? <FiTrendingUp /> : <FiTrendingDown />)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium truncate">{label}</p>
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="text-xl font-bold text-gray-800 dark:text-gray-100">
            {typeof current === 'number' ? current.toFixed(1) : current}
          </span>
          <span className="text-xs text-gray-400">{unit}</span>
        </div>
      </div>
      <div className={`text-right ${
        isNeutral ? 'text-gray-400' : isGood ? 'text-green-600' : 'text-red-500'
      }`}>
        <div className="flex items-center gap-1 text-sm font-bold">
          {isNeutral ? '—' : isUp ? '↑' : '↓'}
          {!isNeutral && <span>{Math.abs(change).toFixed(1)}%</span>}
        </div>
        <p className="text-[10px] text-gray-400">vs prev year</p>
      </div>
    </motion.div>
  );
}

export default function TrendIndicators({ data = [] }) {
  if (data.length < 2) return null;
  const curr = data[data.length - 1];
  const prev = data[data.length - 2];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <TrendBadge label="Water Level" current={curr.groundwaterLevel} previous={prev.groundwaterLevel} unit="m" invert />
      <TrendBadge label="Rainfall" current={curr.rainfall} previous={prev.rainfall} unit="mm" />
      <TrendBadge label="Depletion Rate" current={curr.depletionRate} previous={prev.depletionRate} unit="%" invert />
      <TrendBadge label="pH Level" current={curr.ph} previous={prev.ph} unit="" />
    </div>
  );
}
