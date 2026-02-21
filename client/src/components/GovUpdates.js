import React from 'react';
import { FiExternalLink, FiFileText } from 'react-icons/fi';

export default function GovUpdates({ updates = [] }) {
  const priorityBadge = (p) =>
    p === 'high' ? (
      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 font-bold uppercase">
        Priority
      </span>
    ) : null;

  return (
    <div className="glass-card p-5">
      <h3 className="section-title flex items-center gap-1.5">
        <FiFileText size={14} className="text-slate-400" /> Government Updates
      </h3>
      <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
        {updates.map((u) => (
          <div
            key={u.id}
            className="p-3.5 bg-white dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/30 rounded-lg hover:border-primary-300 dark:hover:border-primary-700/40 transition-colors"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-100 leading-tight">
                {u.title}
              </h4>
              {priorityBadge(u.priority)}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-2">
              {u.body}
            </p>
            <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
              <span className="flex items-center gap-1">
                <FiExternalLink size={10} />
                {u.source}
              </span>
              <span>{u.date}</span>
            </div>
          </div>
        ))}
        {!updates.length && (
          <p className="text-center py-6 text-sm text-slate-400 dark:text-slate-500">
            No government updates available
          </p>
        )}
      </div>
    </div>
  );
}
