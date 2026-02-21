import React from 'react';
import { Line } from 'react-chartjs-2';
import { CHART_PALETTE, chartColors } from '../../utils/helpers';
import { useTheme } from '../../context/ThemeContext';

export default function MultiAxisChart({ data = [] }) {
  const { darkMode } = useTheme();
  const colors = chartColors(darkMode);
  const years = data.map((d) => d.year.toString());

  const chartData = {
    labels: years,
    datasets: [
      {
        label: 'Rainfall (mm)',
        data: data.map((d) => d.rainfall),
        borderColor: CHART_PALETTE[1],
        backgroundColor: `${CHART_PALETTE[1]}15`,
        fill: true,
        tension: 0.4,
        yAxisID: 'y',
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: CHART_PALETTE[1],
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        borderWidth: 3,
      },
      {
        label: 'Water Level (m)',
        data: data.map((d) => d.groundwaterLevel),
        borderColor: CHART_PALETTE[0],
        backgroundColor: `${CHART_PALETTE[0]}15`,
        fill: true,
        tension: 0.4,
        yAxisID: 'y1',
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: CHART_PALETTE[0],
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        borderWidth: 3,
      },
      {
        label: 'Depletion Rate (%)',
        data: data.map((d) => d.depletionRate),
        borderColor: CHART_PALETTE[3],
        backgroundColor: 'transparent',
        borderDash: [5, 3],
        tension: 0.4,
        yAxisID: 'y1',
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBackgroundColor: CHART_PALETTE[3],
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      legend: {
        labels: { color: colors.textColor, usePointStyle: true, padding: 15, font: { size: 11 } },
      },
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
      y: {
        type: 'linear',
        position: 'left',
        ticks: { color: CHART_PALETTE[1] },
        grid: { color: colors.gridColor },
        title: { display: true, text: 'Rainfall (mm)', color: CHART_PALETTE[1], font: { weight: 'bold' } },
      },
      y1: {
        type: 'linear',
        position: 'right',
        ticks: { color: CHART_PALETTE[0] },
        grid: { drawOnChartArea: false },
        title: { display: true, text: 'Water Level (m) / Depletion (%)', color: CHART_PALETTE[0], font: { weight: 'bold' } },
      },
    },
    animation: { duration: 800, easing: 'easeOutQuart' },
  };

  return (
    <div className="chart-container">
      <h3 className="section-title flex items-center gap-2">Multi-Axis: Rainfall vs Water Level</h3>
      <p className="text-[11px] text-gray-400 -mt-3 mb-3">Dual Y-axis comparison of key parameters</p>
      <div className="h-[320px]">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
