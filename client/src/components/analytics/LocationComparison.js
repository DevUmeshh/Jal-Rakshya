import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Line, Bar } from 'react-chartjs-2';
import { FiRepeat } from 'react-icons/fi';
import { CHART_PALETTE, chartColors } from '../../utils/helpers';
import { useTheme } from '../../context/ThemeContext';
import { compareLocations as compareAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const METRICS = ['waterScore', 'groundwaterLevel', 'rainfall', 'depletionRate'];
const METRIC_LABELS = { waterScore: 'Water Score', groundwaterLevel: 'Water Level (m)', rainfall: 'Rainfall (mm)', depletionRate: 'Depletion (%)' };

export default function LocationComparison({ currentLocation, allLocations = [] }) {
  const { darkMode } = useTheme();
  const colors = chartColors(darkMode);
  const [compareLoc, setCompareLoc] = useState('');
  const [compData, setCompData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chartType, setChartType] = useState('line');

  const handleCompare = useCallback(async () => {
    if (!compareLoc) return;
    setLoading(true);
    try {
      const res = await compareAPI(currentLocation, compareLoc);
      setCompData(res.comparison);
      toast.success(`Comparing with ${compareLoc}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentLocation, compareLoc]);

  const [selectedMetric, setSelectedMetric] = useState('waterScore');

  const lineChartData = useMemo(() => {
    if (!compData) return null;
    const labels = compData.location1.data.map((d) => d.year.toString());
    return {
      labels,
      datasets: [
        {
          label: compData.location1.name,
          data: compData.location1.data.map((d) => d[selectedMetric]),
          borderColor: CHART_PALETTE[0],
          backgroundColor: `${CHART_PALETTE[0]}15`,
          fill: true, tension: 0.4, pointRadius: 6, pointHoverRadius: 9,
          pointBackgroundColor: CHART_PALETTE[0], pointBorderColor: '#fff', pointBorderWidth: 2, borderWidth: 3,
        },
        {
          label: compData.location2.name,
          data: compData.location2.data.map((d) => d[selectedMetric]),
          borderColor: CHART_PALETTE[3],
          backgroundColor: `${CHART_PALETTE[3]}15`,
          fill: true, tension: 0.4, pointRadius: 6, pointHoverRadius: 9,
          pointBackgroundColor: CHART_PALETTE[3], pointBorderColor: '#fff', pointBorderWidth: 2, borderWidth: 3,
        },
      ],
    };
  }, [compData, selectedMetric]);

  const barChartData = useMemo(() => {
    if (!compData) return null;
    const loc1Latest = compData.location1.data[compData.location1.data.length - 1] || {};
    const loc2Latest = compData.location2.data[compData.location2.data.length - 1] || {};
    return {
      labels: METRICS.map((m) => METRIC_LABELS[m]),
      datasets: [
        {
          label: compData.location1.name,
          data: METRICS.map((m) => loc1Latest[m] || 0),
          backgroundColor: `${CHART_PALETTE[0]}cc`,
          borderRadius: 6,
        },
        {
          label: compData.location2.name,
          data: METRICS.map((m) => loc2Latest[m] || 0),
          backgroundColor: `${CHART_PALETTE[3]}cc`,
          borderRadius: 6,
        },
      ],
    };
  }, [compData]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      legend: { labels: { color: colors.textColor, usePointStyle: true, padding: 14, font: { size: 11 } } },
      tooltip: {
        backgroundColor: darkMode ? '#1e293b' : '#fff',
        titleColor: darkMode ? '#e2e8f0' : '#1e293b',
        bodyColor: darkMode ? '#cbd5e1' : '#475569',
        borderColor: darkMode ? '#334155' : '#e2e8f0',
        borderWidth: 1, cornerRadius: 10, padding: 12,
      },
    },
    scales: {
      x: { ticks: { color: colors.textColor }, grid: { color: colors.gridColor } },
      y: { ticks: { color: colors.textColor }, grid: { color: colors.gridColor },
        title: { display: true, text: METRIC_LABELS[selectedMetric] || '', color: colors.textColor } },
    },
    animation: { duration: 600 },
  };

  return (
    <div className="glass-card p-5">
      <h3 className="section-title flex items-center gap-2"><FiRepeat className="text-primary-500" /> Location vs Location</h3>
      <p className="text-[11px] text-gray-400 -mt-3 mb-4">Compare {currentLocation} with another location</p>

      <div className="flex flex-wrap items-end gap-3 mb-5">
        <div className="flex-1 min-w-[180px]">
          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Compare with:</label>
          <select
            value={compareLoc}
            onChange={(e) => setCompareLoc(e.target.value)}
            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Select location...</option>
            {allLocations.filter((n) => n !== currentLocation).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <button onClick={handleCompare} className="btn-primary text-sm py-2" disabled={!compareLoc || loading}>
          {loading ? 'Loading...' : 'Compare'}
        </button>
      </div>

      {compData && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {/* Controls */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
              <button onClick={() => setChartType('line')} className={`text-xs px-3 py-1.5 rounded-md transition-colors ${chartType === 'line' ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm font-bold' : 'text-gray-500'}`}>Line</button>
              <button onClick={() => setChartType('bar')} className={`text-xs px-3 py-1.5 rounded-md transition-colors ${chartType === 'bar' ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm font-bold' : 'text-gray-500'}`}>Bar</button>
            </div>
            {chartType === 'line' && (
              <div className="flex gap-1">
                {METRICS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedMetric(m)}
                    className={`text-[10px] px-2.5 py-1 rounded-full transition-colors ${
                      selectedMetric === m
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 font-bold ring-1 ring-primary-300'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-primary-500'
                    }`}
                  >
                    {METRIC_LABELS[m]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-[300px]">
            {chartType === 'line' && lineChartData && <Line data={lineChartData} options={chartOptions} />}
            {chartType === 'bar' && barChartData && <Bar data={barChartData} options={chartOptions} />}
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            {[compData.location1, compData.location2].map((loc, i) => {
              const latest = loc.data[loc.data.length - 1] || {};
              return (
                <div key={loc.name} className={`glass-card-sm p-4 border-l-4 ${i === 0 ? 'border-l-blue-500' : 'border-l-red-500'}`}>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">{loc.name}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-gray-400">Score:</span> <span className="font-bold">{latest.waterScore}</span></div>
                    <div><span className="text-gray-400">Level:</span> <span className="font-bold">{latest.groundwaterLevel}m</span></div>
                    <div><span className="text-gray-400">Rain:</span> <span className="font-bold">{latest.rainfall}mm</span></div>
                    <div><span className="text-gray-400">Depl.:</span> <span className="font-bold">{latest.depletionRate}%</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
