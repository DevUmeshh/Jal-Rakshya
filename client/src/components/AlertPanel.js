import React from 'react';
import { FiAlertTriangle, FiAlertCircle, FiInfo } from 'react-icons/fi';

const typeConfig = {
  critical: {
    bg: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/40',
    icon: <FiAlertTriangle className="text-red-500 text-lg flex-shrink-0" />,
    badge: 'bg-red-500 text-white',
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800/40',
    icon: <FiAlertCircle className="text-yellow-500 text-lg flex-shrink-0" />,
    badge: 'bg-yellow-500 text-white',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/40',
    icon: <FiInfo className="text-blue-500 text-lg flex-shrink-0" />,
    badge: 'bg-blue-500 text-white',
  },
};

export default function AlertPanel({ alerts = [] }) {
  if (!alerts.length) {
    return (
      <div className="glass-card p-5">
        <h3 className="section-title">Alerts</h3>
        <div className="flex items-center justify-center py-8 text-slate-400 dark:text-slate-500 text-sm">
          <FiInfo className="mr-2" size={15} /> No active alerts at this time
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title mb-0">Alerts</h3>
        <span className="text-xs bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-md font-semibold">
          {alerts.length} active
        </span>
      </div>
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
        {alerts.map((alert, i) => {
          const config = typeConfig[alert.type] || typeConfig.info;
          return (
            <div
              key={`${alert.type}-${alert.title}-${i}`}
              className={`flex gap-3 p-3.5 rounded-xl border ${config.bg} animate-slide-up`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {config.icon}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                    {alert.title}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${config.badge} uppercase font-bold`}>
                    {alert.type}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  {alert.message}
                </p>
                {alert.recommendation && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1.5 italic">
                    Tip: {alert.recommendation}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
