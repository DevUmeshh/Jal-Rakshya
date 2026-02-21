/**
 * Utility helpers for JalRakshya frontend
 */

export function getStatusClass(status) {
  switch (status) {
    case 'Safe':
      return 'status-safe';
    case 'Warning':
      return 'status-warning';
    case 'Critical':
      return 'status-critical';
    default:
      return 'status-warning';
  }
}

export function getMarkerColor(status) {
  switch (status) {
    case 'Safe':
      return '#22c55e';
    case 'Warning':
      return '#eab308';
    case 'Critical':
      return '#ef4444';
    default:
      return '#6b7280';
  }
}

export function getScarcityColor(level) {
  const map = {
    Low: '#22c55e',
    Moderate: '#eab308',
    High: '#f97316',
    Severe: '#ef4444',
    Extreme: '#991b1b',
  };
  return map[level] || '#6b7280';
}

export function formatNumber(num, decimals = 1) {
  if (num === undefined || num === null) return '–';
  return Number(num).toFixed(decimals);
}

export function getScoreGrade(score) {
  if (score >= 80) return { grade: 'A', label: 'Excellent' };
  if (score >= 70) return { grade: 'B', label: 'Good' };
  if (score >= 50) return { grade: 'C', label: 'Fair' };
  if (score >= 30) return { grade: 'D', label: 'Poor' };
  return { grade: 'F', label: 'Critical' };
}

export function chartColors(darkMode) {
  return {
    gridColor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    textColor: darkMode ? '#cbd5e1' : '#475569',
    bgColor: darkMode ? '#1e293b' : '#ffffff',
  };
}

export const CHART_PALETTE = [
  '#3b82f6', // blue
  '#14b8a6', // teal
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#22c55e', // green
  '#06b6d4', // cyan
];
