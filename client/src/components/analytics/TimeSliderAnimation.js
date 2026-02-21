import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Bar } from 'react-chartjs-2';
import { FiPlay, FiPause, FiSkipBack, FiSkipForward } from 'react-icons/fi';
import { CHART_PALETTE, chartColors } from '../../utils/helpers';
import { useTheme } from '../../context/ThemeContext';

export default function TimeSliderAnimation({ data = [] }) {
  const { darkMode } = useTheme();
  const colors = chartColors(darkMode);
  const [activeIndex, setActiveIndex] = useState(data.length - 1);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef(null);

  const activeData = data[activeIndex] || {};
  const year = activeData.year || '—';

  const play = useCallback(() => {
    setPlaying(true);
    setActiveIndex(0);
  }, []);

  const pause = useCallback(() => {
    setPlaying(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (!playing) return;
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        if (prev >= data.length - 1) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1500);
    return () => clearInterval(intervalRef.current);
  }, [playing, data.length]);

  const barData = {
    labels: ['Agricultural', 'Industrial', 'Household', 'Water Level (×10)', 'Rainfall (÷10)', 'Depletion (×10)'],
    datasets: [{
      label: `Year ${year}`,
      data: [
        activeData.agriculturalUsage || 0,
        activeData.industrialUsage || 0,
        activeData.householdUsage || 0,
        (activeData.groundwaterLevel || 0) * 10,
        (activeData.rainfall || 0) / 10,
        (activeData.depletionRate || 0) * 10,
      ],
      backgroundColor: CHART_PALETTE.slice(0, 6).map((c) => c + 'cc'),
      borderRadius: 8,
      borderSkipped: false,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
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
      y: { ticks: { color: colors.textColor, font: { size: 11 } }, grid: { display: false } },
    },
    animation: { duration: 500, easing: 'easeOutQuart' },
  };

  return (
    <div className="chart-container">
      <h3 className="section-title flex items-center gap-2">Timeline Animator</h3>
      <p className="text-[11px] text-gray-400 -mt-3 mb-4">Slide through time to see data evolve</p>

      {/* Timeline controls */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          disabled={activeIndex === 0}
        >
          <FiSkipBack size={14} className="text-gray-500" />
        </button>

        <button
          onClick={playing ? pause : play}
          className={`p-2.5 rounded-xl text-white transition-all ${playing ? 'bg-red-500 hover:bg-red-600' : 'bg-primary-500 hover:bg-primary-600'} shadow-md`}
        >
          {playing ? <FiPause size={16} /> : <FiPlay size={16} />}
        </button>

        <button
          onClick={() => setActiveIndex(Math.min(data.length - 1, activeIndex + 1))}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          disabled={activeIndex === data.length - 1}
        >
          <FiSkipForward size={14} className="text-gray-500" />
        </button>

        <div className="flex-1 mx-2">
          <input
            type="range"
            min={0}
            max={data.length - 1}
            value={activeIndex}
            onChange={(e) => { setActiveIndex(+e.target.value); setPlaying(false); }}
            className="w-full accent-primary-500 h-2"
          />
        </div>

        <motion.span
          key={year}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-xl font-extrabold text-primary-600 min-w-[50px] text-center"
        >
          {year}
        </motion.span>
      </div>

      {/* Year dots */}
      <div className="flex items-center justify-center gap-2 mb-4">
        {data.map((d, i) => (
          <button
            key={d.year}
            onClick={() => { setActiveIndex(i); setPlaying(false); }}
            className={`w-8 h-8 rounded-full text-xs font-bold transition-all duration-300 ${
              i === activeIndex
                ? 'bg-primary-500 text-white scale-110 shadow-lg shadow-primary-500/30'
                : i < activeIndex
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
            }`}
          >
            {d.year.toString().slice(-2)}
          </button>
        ))}
      </div>

      {/* Animated chart */}
      <motion.div
        key={activeIndex}
        initial={{ opacity: 0.5, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        className="h-[260px]"
      >
        <Bar data={barData} options={options} />
      </motion.div>

      {/* KPI Row */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        {[
          { label: 'Water Level', value: activeData.groundwaterLevel, unit: 'm', borderClass: 'border-blue-500' },
          { label: 'Rainfall', value: activeData.rainfall, unit: 'mm', borderClass: 'border-cyan-500' },
          { label: 'Depletion', value: activeData.depletionRate, unit: '%', borderClass: 'border-red-500' },
        ].map(({ label, value, unit, borderClass }) => (
          <motion.div
            key={label}
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className={`glass-card-sm p-3 text-center border-t-2 ${borderClass}`}
          >
            <p className="text-[10px] text-gray-400 uppercase">{label}</p>
            <p className="text-lg font-bold text-gray-700 dark:text-gray-200">
              {value !== undefined ? Number(value).toFixed(1) : '—'}<span className="text-xs text-gray-400 ml-1">{unit}</span>
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
