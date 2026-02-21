import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { CHART_PALETTE, chartColors } from '../../utils/helpers';
import { useTheme } from '../../context/ThemeContext';

/**
 * Detect outliers using IQR method and overlay alert annotations on charts.
 */
function detectOutliers(values) {
  if (values.length < 3) return [];
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;
  return values.map((v, i) => (v < lower || v > upper) ? i : -1).filter((i) => i >= 0);
}

export default function OutlierAlertChart({ data = [], field = 'groundwaterLevel', label = 'Water Level', unit = 'm' }) {
  const { darkMode } = useTheme();
  const colors = chartColors(darkMode);
  const years = useMemo(() => data.map((d) => d.year.toString()), [data]);
  const values = useMemo(() => data.map((d) => d[field]), [data, field]);

  const outlierIndices = useMemo(() => detectOutliers(values), [values]);

  const chartData = {
    labels: years,
    datasets: [
      {
        label: `${label} (${unit})`,
        data: values,
        borderColor: CHART_PALETTE[0],
        backgroundColor: `${CHART_PALETTE[0]}15`,
        fill: true,
        tension: 0.4,
        pointRadius: values.map((_, i) => outlierIndices.includes(i) ? 10 : 5),
        pointHoverRadius: values.map((_, i) => outlierIndices.includes(i) ? 14 : 8),
        pointBackgroundColor: values.map((_, i) =>
          outlierIndices.includes(i) ? '#ef4444' : CHART_PALETTE[0]
        ),
        pointBorderColor: values.map((_, i) =>
          outlierIndices.includes(i) ? '#fca5a5' : '#fff'
        ),
        pointBorderWidth: values.map((_, i) => outlierIndices.includes(i) ? 3 : 2),
        pointStyle: values.map((_, i) => outlierIndices.includes(i) ? 'crossRot' : 'circle'),
        borderWidth: 3,
      },
      // Outlier markers as separate dataset for legend
      ...(outlierIndices.length > 0 ? [{
        label: 'Anomaly Detected',
        data: values.map((v, i) => outlierIndices.includes(i) ? v : null),
        borderColor: 'transparent',
        backgroundColor: '#ef444480',
        pointRadius: 12,
        pointHoverRadius: 16,
        pointBackgroundColor: '#ef444440',
        pointBorderColor: '#ef4444',
        pointBorderWidth: 3,
        pointStyle: 'crossRot',
        showLine: false,
      }] : []),
    ],
  };

  const options = {
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
        callbacks: {
          afterLabel: (ctx) => {
            if (outlierIndices.includes(ctx.dataIndex) && ctx.datasetIndex === 0) {
              return 'ANOMALY: Unusual value detected!\nThis data point deviates significantly from the trend.';
            }
            return '';
          },
        },
      },
    },
    scales: {
      x: { ticks: { color: colors.textColor }, grid: { color: colors.gridColor } },
      y: {
        ticks: { color: colors.textColor },
        grid: { color: colors.gridColor },
        title: { display: true, text: `${label} (${unit})`, color: colors.textColor },
      },
    },
    animation: { duration: 800, easing: 'easeOutQuart' },
  };

  return (
    <div className="chart-container">
      <div className="flex items-center justify-between mb-1">
        <h3 className="section-title flex items-center gap-2">Outlier Detection — {label}</h3>
        {outlierIndices.length > 0 && (
          <span className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-600 px-2 py-0.5 rounded-full font-bold">
            {outlierIndices.length} anomal{outlierIndices.length > 1 ? 'ies' : 'y'}
          </span>
        )}
      </div>
      <p className="text-[11px] text-gray-400 -mt-3 mb-3">
        {outlierIndices.length > 0
          ? `Red markers indicate statistically abnormal data points (IQR method)`
          : 'No anomalies detected — data is within expected range'}
      </p>
      <div className="h-[300px]">
        <Line data={chartData} options={options} />
      </div>

      {/* Outlier detail cards */}
      {outlierIndices.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {outlierIndices.map((idx) => (
            <div key={idx} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 text-xs">
              <span className="font-bold text-red-600">{years[idx]}:</span>
              <span className="text-gray-600 dark:text-gray-300 ml-1">
                {label} = {values[idx]} {unit} — Critical deviation detected
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
