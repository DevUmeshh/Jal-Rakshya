import React from 'react';
import { motion } from 'framer-motion';

function IndexBar({ label, value, text, icon, max = 100 }) {
  const pct = Math.min(100, Math.max(0, ((value || 0) / max) * 100));
  const color = pct >= 70 ? 'from-green-400 to-green-600' :
    pct >= 40 ? 'from-yellow-400 to-yellow-600' : 'from-red-400 to-red-600';
  const textColor = pct >= 70 ? 'text-green-600' : pct >= 40 ? 'text-yellow-600' : 'text-red-600';
  const bgColor = pct >= 70 ? 'bg-green-50 dark:bg-green-900/20' :
    pct >= 40 ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-red-50 dark:bg-red-900/20';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`${bgColor} rounded-xl p-4 transition-all duration-300`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">{label}</span>
        </div>
        <div className="text-right">
          <span className={`text-lg font-extrabold ${textColor}`}>{value || 0}</span>
          <span className="text-xs text-gray-400 ml-0.5">/{max}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-full bg-gradient-to-r ${color} rounded-full relative`}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" style={{ animationDuration: '3s' }} />
        </motion.div>
      </div>

      {/* Status text */}
      <div className="flex items-center justify-between mt-2">
        <span className={`text-[10px] font-bold uppercase ${textColor}`}>{text}</span>
        <span className="text-[10px] text-gray-400">{pct.toFixed(0)}%</span>
      </div>
    </motion.div>
  );
}

export default function DetailedIndexPanel({ data }) {
  if (!data) return null;

  const wqiVal = data.wqi?.value || 0;
  const wqiText = data.wqi?.index || 'N/A';
  const deplVal = data.depletionIndex?.value || 0;
  const deplText = data.depletionIndex?.index || 'N/A';
  const sustVal = data.sustainabilityScore || 0;
  const sustText = sustVal >= 60 ? 'Sustainable' : sustVal >= 35 ? 'At Risk' : 'Critical';

  // Composite score
  const composite = Math.round((wqiVal + (100 - deplVal) + sustVal) / 3);
  const compositeText = composite >= 70 ? 'Healthy' : composite >= 40 ? 'Moderate' : 'Poor';
  const compositeColor = composite >= 70 ? 'text-green-600' : composite >= 40 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="section-title flex items-center gap-2 mb-0">Detailed Index Panel</h3>
          <p className="text-[11px] text-gray-400">Comprehensive water quality & sustainability indices</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-400 uppercase">Composite</p>
          <p className={`text-2xl font-extrabold ${compositeColor}`}>{composite}</p>
          <p className={`text-[10px] font-bold ${compositeColor}`}>{compositeText}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <IndexBar
          label="Water Quality"
          value={wqiVal}
          text={wqiText}
          icon=""
          max={100}
        />
        <IndexBar
          label="Depletion Index"
          value={100 - deplVal}
          text={deplText}
          icon=""
          max={100}
        />
        <IndexBar
          label="Sustainability"
          value={sustVal}
          text={sustText}
          icon=""
          max={100}
        />
      </div>

      {/* Additional metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        {[
          { label: 'pH Level', value: data.ph ?? '—', icon: '', status: data.ph != null ? (data.ph >= 6.5 && data.ph <= 8.5 ? 'Normal' : 'Abnormal') : 'N/A' },
          { label: 'Depletion %', value: data.depletionRate?.toFixed(1) ?? '—', icon: '', status: data.depletionRate != null ? (data.depletionRate < 3 ? 'Low' : data.depletionRate < 5 ? 'Medium' : 'High') : 'N/A' },
          { label: 'Scarcity', value: data.scarcityLevel || '—', icon: '', status: data.scarcityLevel || 'N/A' },
          { label: 'Score', value: data.waterScore ?? '—', icon: '', status: data.status || 'N/A' },
        ].map(({ label, value, icon, status }) => (
          <div key={label} className="glass-card-sm p-3 text-center">
            <p className="text-lg mb-1">{icon}</p>
            <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{value || '—'}</p>
            <p className="text-[10px] text-gray-400">{label}</p>
            <p className="text-[9px] font-semibold text-gray-500 mt-0.5">{status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
