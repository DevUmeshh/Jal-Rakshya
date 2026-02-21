import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { CHART_PALETTE, chartColors } from '../../utils/helpers';
import { useTheme } from '../../context/ThemeContext';

/**
 * Linear regression helper: returns { slope, intercept }
 */
function linearRegression(xs, ys) {
  const n = xs.length;
  if (n < 2) return { slope: 0, intercept: ys[0] || 0 };
  let sx = 0, sy = 0, sxy = 0, sx2 = 0;
  for (let i = 0; i < n; i++) {
    sx += xs[i]; sy += ys[i]; sxy += xs[i] * ys[i]; sx2 += xs[i] * xs[i];
  }
  const slope = (n * sxy - sx * sy) / (n * sx2 - sx * sx) || 0;
  const intercept = (sy - slope * sx) / n;
  return { slope, intercept };
}

export default function ForecastChart({ data = [], predictions = [], field = 'groundwaterLevel', label = 'Water Level', unit = 'm' }) {
  const { darkMode } = useTheme();
  const colors = chartColors(darkMode);

  const { actualLabels, actualValues, forecastLabels, forecastValues, allLabels } = useMemo(() => {
    const aLabels = data.map((d) => d.year.toString());
    const aValues = data.map((d) => d[field]);

    // Use predictions from backend or compute locally
    let fLabels, fValues;
    if (predictions.length > 0 && predictions[0][field] !== undefined) {
      fLabels = predictions.map((p) => `${p.year}`);
      fValues = predictions.map((p) => p[field]);
    } else {
      const xs = data.map((d) => d.year);
      const ys = data.map((d) => d[field]);
      const { slope, intercept } = linearRegression(xs, ys);
      const lastYear = xs[xs.length - 1] || 2021;
      fLabels = [1, 2, 3, 4, 5].map((i) => `${lastYear + i}`);
      fValues = fLabels.map((_, i) => +(slope * (lastYear + i + 1) + intercept).toFixed(2));
    }

    return {
      actualLabels: aLabels,
      actualValues: aValues,
      forecastLabels: fLabels,
      forecastValues: fValues,
      allLabels: [...aLabels, ...fLabels],
    };
  }, [data, predictions, field]);

  // Guard: if no actual data, render a placeholder instead of crashing
  if (!actualLabels.length) {
    return (
      <div className="chart-container">
        <h3 className="section-title flex items-center gap-2">{label} Forecast</h3>
        <div className="flex items-center justify-center h-[320px] text-slate-400 dark:text-slate-500 text-sm">
          No data in the selected range to generate a forecast.
        </div>
      </div>
    );
  }

  const paddingLength = Math.max(0, actualLabels.length - 1);

  const chartData = {
    labels: allLabels,
    datasets: [
      {
        label: `${label} (Actual)`,
        data: [...actualValues, ...new Array(forecastLabels.length).fill(null)],
        borderColor: CHART_PALETTE[0],
        backgroundColor: `${CHART_PALETTE[0]}20`,
        fill: true,
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 9,
        pointBackgroundColor: CHART_PALETTE[0],
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        borderWidth: 3,
      },
      {
        label: `${label} (Predicted)`,
        data: [...new Array(paddingLength).fill(null), actualValues[actualValues.length - 1], ...forecastValues],
        borderColor: CHART_PALETTE[3],
        backgroundColor: `${CHART_PALETTE[3]}10`,
        fill: true,
        tension: 0.4,
        borderDash: [8, 4],
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: CHART_PALETTE[3],
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        borderWidth: 2.5,
        pointStyle: 'triangle',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      legend: { labels: { color: colors.textColor, usePointStyle: true, padding: 15, font: { size: 11 } } },
      tooltip: {
        backgroundColor: darkMode ? '#1e293b' : '#fff',
        titleColor: darkMode ? '#e2e8f0' : '#1e293b',
        bodyColor: darkMode ? '#cbd5e1' : '#475569',
        borderColor: darkMode ? '#334155' : '#e2e8f0',
        borderWidth: 1, cornerRadius: 10, padding: 12,
        callbacks: {
          label: (ctx) => {
            const isPredicted = ctx.datasetIndex === 1;
            return `${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(2)} ${unit} ${isPredicted ? '(forecast)' : ''}`;
          },
        },
      },
      // Note: annotation plugin removed — chartjs-plugin-annotation is not installed
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
      <h3 className="section-title flex items-center gap-2">{label} Forecast</h3>
      <p className="text-[11px] text-gray-400 -mt-3 mb-3">Solid = actual data | Dashed = linear regression forecast</p>
      <div className="h-[320px]">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
