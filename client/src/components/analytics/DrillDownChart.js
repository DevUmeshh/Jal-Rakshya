import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bar } from 'react-chartjs-2';
import { FiArrowLeft, FiZoomIn } from 'react-icons/fi';
import { CHART_PALETTE, chartColors } from '../../utils/helpers';
import { useTheme } from '../../context/ThemeContext';

/**
 * DrillDownChart — multi-level drill-down on usage data.
 * Level 0: Total usage per year
 * Level 1: Category breakdown for a chosen year
 * Level 2: Per-capita / raw details for a chosen category
 */
export default function DrillDownChart({ data = [] }) {
  const { darkMode } = useTheme();
  const colors = chartColors(darkMode);

  const [drillLevel, setDrillLevel] = useState(0);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedCat, setSelectedCat] = useState(null);

  const years = useMemo(() => data.map((d) => d.year.toString()), [data]);

  // Level 0: Total usage bar per year
  const totalUsageData = useMemo(() => ({
    labels: years,
    datasets: [{
      label: 'Total Water Usage (Ml)',
      data: data.map((d) => (d.agriculturalUsage || 0) + (d.industrialUsage || 0) + (d.householdUsage || 0)),
      backgroundColor: data.map((_, i) => `${CHART_PALETTE[i % CHART_PALETTE.length]}cc`),
      borderRadius: 8,
      borderSkipped: false,
    }],
  }), [data, years]);

  // Level 1: Category breakdown for selected year
  const yearData = useMemo(() => {
    if (!selectedYear) return null;
    const row = data.find((d) => d.year.toString() === selectedYear);
    if (!row) return null;
    return {
      labels: ['Agricultural', 'Industrial', 'Household'],
      datasets: [{
        label: `Usage Breakdown — ${selectedYear}`,
        data: [row.agriculturalUsage, row.industrialUsage, row.householdUsage],
        backgroundColor: [CHART_PALETTE[2] + 'cc', CHART_PALETTE[4] + 'cc', CHART_PALETTE[6] + 'cc'],
        borderRadius: 8,
        borderSkipped: false,
      }],
    };
  }, [data, selectedYear]);

  // Level 2: Detail for selected category over all years
  const categoryDetailData = useMemo(() => {
    if (!selectedCat) return null;
    const fieldMap = { Agricultural: 'agriculturalUsage', Industrial: 'industrialUsage', Household: 'householdUsage' };
    const field = fieldMap[selectedCat];
    return {
      labels: years,
      datasets: [
        {
          label: `${selectedCat} Usage (Ml)`,
          data: data.map((d) => d[field] || 0),
          backgroundColor: CHART_PALETTE[4] + 'cc',
          borderRadius: 8,
          borderSkipped: false,
        },
        {
          label: 'Per Capita Usage (L)',
          data: data.map((d) => d.perCapitaUsage || 0),
          backgroundColor: CHART_PALETTE[1] + '80',
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    };
  }, [data, selectedCat, years]); // years is now memoized

  const chartData = drillLevel === 0 ? totalUsageData : drillLevel === 1 ? yearData : categoryDetailData;
  const title = drillLevel === 0 ? 'Total Water Usage by Year' :
    drillLevel === 1 ? `Usage Breakdown — ${selectedYear}` :
    `${selectedCat} Usage Trend (All Years)`;
  const subtitle = drillLevel === 0 ? 'Click a bar to drill into category breakdown' :
    drillLevel === 1 ? 'Click a category to see detailed trend' :
    'Deepest level — click Back to go up';

  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (_, elements) => {
      if (!elements.length) return;
      const idx = elements[0].index;
      if (drillLevel === 0) {
        setSelectedYear(years[idx]);
        setDrillLevel(1);
      } else if (drillLevel === 1) {
        const cats = ['Agricultural', 'Industrial', 'Household'];
        setSelectedCat(cats[idx]);
        setDrillLevel(2);
      }
    },
    plugins: {
      legend: { labels: { color: colors.textColor, usePointStyle: true, padding: 12, font: { size: 11 } } },
      tooltip: {
        backgroundColor: darkMode ? '#1e293b' : '#fff',
        titleColor: darkMode ? '#e2e8f0' : '#1e293b',
        bodyColor: darkMode ? '#cbd5e1' : '#475569',
        borderColor: darkMode ? '#334155' : '#e2e8f0',
        borderWidth: 1, cornerRadius: 10, padding: 12,
        callbacks: {
          afterBody: () => drillLevel < 2 ? ['', 'Click to drill down'] : [],
        },
      },
    },
    scales: {
      x: { ticks: { color: colors.textColor }, grid: { color: colors.gridColor } },
      y: { ticks: { color: colors.textColor }, grid: { color: colors.gridColor },
        title: { display: true, text: 'Megalitres (Ml)', color: colors.textColor } },
    },
    animation: { duration: 600, easing: 'easeInOutQuart' },
  };

  const goBack = () => {
    if (drillLevel === 2) { setSelectedCat(null); setDrillLevel(1); }
    else if (drillLevel === 1) { setSelectedYear(null); setDrillLevel(0); }
  };

  return (
    <div className="chart-container">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="section-title mb-0 flex items-center gap-2">
            <FiZoomIn className="text-primary-500" />
            {title}
          </h3>
          <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>
        </div>
        {drillLevel > 0 && (
          <button onClick={goBack} className="btn-secondary text-xs flex items-center gap-1 py-1.5 px-3">
            <FiArrowLeft size={12} /> Back
          </button>
        )}
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-[10px] mb-3">
        <span
          className={`px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
            drillLevel === 0 ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 font-bold' : 'text-gray-400 hover:text-primary-500'
          }`}
          onClick={() => { setDrillLevel(0); setSelectedYear(null); setSelectedCat(null); }}
        >Total</span>
        {drillLevel >= 1 && (
          <>
            <span className="text-gray-300">›</span>
            <span
              className={`px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
                drillLevel === 1 ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 font-bold' : 'text-gray-400 hover:text-primary-500'
              }`}
              onClick={() => { setDrillLevel(1); setSelectedCat(null); }}
            >{selectedYear}</span>
          </>
        )}
        {drillLevel >= 2 && (
          <>
            <span className="text-gray-300">›</span>
            <span className="px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 font-bold">
              {selectedCat}
            </span>
          </>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={drillLevel + (selectedYear || '') + (selectedCat || '')}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.3 }}
          className="h-[300px]"
        >
          {chartData && <Bar data={chartData} options={baseOptions} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
