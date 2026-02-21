import React, { useState } from 'react';
import { FiChevronUp, FiChevronDown } from 'react-icons/fi';

export default function DataTable({ data = [] }) {
  const [sortField, setSortField] = useState('year');
  const [sortAsc, setSortAsc] = useState(true);

  const columns = [
    { key: 'year', label: 'Year' },
    { key: 'groundwaterLevel', label: 'Water Level (m)' },
    { key: 'rainfall', label: 'Rainfall (mm)' },
    { key: 'depletionRate', label: 'Depletion (%)' },
    { key: 'consumption', label: 'Consumption (Ml)' },
    { key: 'ph', label: 'pH' },
    { key: 'scarcityLevel', label: 'Scarcity' },
    { key: 'waterScore', label: 'Score' },
    { key: 'status', label: 'Status' },
  ];

  const sorted = [...data].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    if (typeof aVal === 'number') return sortAsc ? aVal - bVal : bVal - aVal;
    return sortAsc
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  const handleSort = (key) => {
    if (sortField === key) setSortAsc(!sortAsc);
    else { setSortField(key); setSortAsc(true); }
  };

  const statusBadge = (status) => {
    const map = {
      Safe: 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400',
      Warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
      Critical: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400',
    };
    return (
      <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${map[status] || ''}`}>
        {status}
      </span>
    );
  };

  const scarcityBadge = (level) => {
    const map = {
      Low: 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400',
      Moderate: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
      High: 'bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400',
      Severe: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400',
      Extreme: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    };
    return (
      <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${map[level] || ''}`}>
        {level}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/30 rounded-xl overflow-hidden">
      <div className="px-5 pt-4 pb-2">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 tracking-tight">Year-wise Data</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-slate-100 dark:border-slate-700/40 bg-slate-50/60 dark:bg-slate-900/30">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="py-2.5 px-3 text-left text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none whitespace-nowrap"
                  onClick={() => handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {sortField === col.key && (
                      sortAsc ? <FiChevronUp size={11} /> : <FiChevronDown size={11} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30">
            {sorted.map((row) => (
              <tr
                key={`${row.location || row.year}-${row.year}`}
                className="hover:bg-slate-50/60 dark:hover:bg-slate-700/20 transition-colors"
              >
                <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200 tabular-nums">{row.year}</td>
                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 tabular-nums">{row.groundwaterLevel}</td>
                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 tabular-nums">{row.rainfall}</td>
                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 tabular-nums">{row.depletionRate}</td>
                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 tabular-nums">{row.consumption}</td>
                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 tabular-nums">{row.ph}</td>
                <td className="py-2.5 px-3">{scarcityBadge(row.scarcityLevel)}</td>
                <td className="py-2.5 px-3">
                  <span className="font-bold text-slate-800 dark:text-slate-100 tabular-nums">{row.waterScore}</span>
                </td>
                <td className="py-2.5 px-3">{statusBadge(row.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sorted.length === 0 && (
        <p className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">No data available</p>
      )}
    </div>
  );
}
