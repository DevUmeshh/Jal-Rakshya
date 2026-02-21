import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { FiArrowLeft, FiDownload } from 'react-icons/fi';
import {
  fetchWaterData, fetchPredictions, fetchLocations,
} from '../utils/api';
import { useTheme } from '../context/ThemeContext';
import { useLocation } from '../context/LocationContext';
import { CHART_PALETTE, chartColors, formatNumber, getScoreGrade } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { generateReport } from '../utils/pdfReport';

// Advanced analytics sub-components
import AdvancedFilterPanel from '../components/analytics/AdvancedFilterPanel';
import DrillDownChart from '../components/analytics/DrillDownChart';
import TrendIndicators from '../components/analytics/TrendIndicators';
import ForecastChart from '../components/analytics/ForecastChart';
import RiskScoreGauge from '../components/analytics/RiskScoreGauge';
import MultiAxisChart from '../components/analytics/MultiAxisChart';
import LocationComparison from '../components/analytics/LocationComparison';
import SmartInsightPanel from '../components/analytics/SmartInsightPanel';
import DetailedIndexPanel from '../components/analytics/DetailedIndexPanel';
import StoryMode from '../components/analytics/StoryMode';
import OutlierAlertChart from '../components/analytics/OutlierAlertChart';
import TimeSliderAnimation from '../components/analytics/TimeSliderAnimation';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Tooltip, Legend, Filler
);

// ─── DEFAULT FILTERS ────────────────────────────────────────────
const DEFAULT_FILTERS = {
  yearMin: 2016,
  yearMax: 2021,
  usageTypes: ['Agriculture', 'Industrial', 'Household'],
  rainfallMin: 0,
  rainfallMax: 2000,
  selectedLocations: [],
};

export default function Analytics() {
  const { location: paramLoc } = useParams();
  const locationName = decodeURIComponent(paramLoc);
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { selectedLocation, selectLocation } = useLocation();

  // Sync selectedLocation from URL param if not already set
  useEffect(() => {
    if (!selectedLocation && locationName) {
      selectLocation(locationName);
    }
  }, [selectedLocation, locationName, selectLocation]);
  const reportRef = useRef(null);

  const [waterData, setWaterData] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [allLocationNames, setAllLocationNames] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [yearBounds, setYearBounds] = useState({ min: 2016, max: 2021 });
  const [exporting, setExporting] = useState(false);

  const colors = chartColors(darkMode);

  // ─── LOAD DATA ──────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [wRes, pRes, locRes] = await Promise.all([
        fetchWaterData(locationName),
        fetchPredictions(locationName, 5),
        fetchLocations(),
      ]);
      setWaterData(wRes.data || []);
      setPredictions(pRes.predictions || []);
      setAllLocationNames((locRes.data || []).map((l) => l.name));
      selectLocation(locationName);

      if (wRes.data?.length) {
        const yrs = wRes.data.map((d) => d.year);
        const bounds = { min: Math.min(...yrs), max: Math.max(...yrs) };
        setYearBounds(bounds);
        setFilters((f) => ({ ...f, yearMin: bounds.min, yearMax: bounds.max }));
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [locationName, selectLocation]);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── FILTERED DATA ─────────────────────────────────────────────
  const filtered = useMemo(() => {
    return waterData.filter((d) => {
      if (d.year < filters.yearMin || d.year > filters.yearMax) return false;
      if (d.rainfall < filters.rainfallMin || d.rainfall > filters.rainfallMax) return false;
      return true;
    });
  }, [waterData, filters]);

  const years = filtered.map((d) => d.year.toString());
  const latestData = filtered.length > 0 ? filtered[filtered.length - 1] : null;
  const grade = latestData ? getScoreGrade(latestData.waterScore) : { grade: '–', label: '–' };

  // ─── PDF EXPORT ────────────────────────────────────────────────
  const exportPDF = async () => {
    if (!reportRef.current) return;
    toast.loading('Generating professional report...', { id: 'pdf' });
    setExporting(true);
    try {
      // Hide UI-only controls during capture
      const hideEls = reportRef.current.querySelectorAll('[data-no-pdf]');
      hideEls.forEach((el) => { el.style.display = 'none'; });

      await generateReport({
        locationName,
        data: filtered,
        predictions,
        grade,
        darkMode,
        reportRef,
      });

      hideEls.forEach((el) => { el.style.display = ''; });
      toast.success('Report exported successfully!', { id: 'pdf' });
    } catch {
      toast.error('Report export failed', { id: 'pdf' });
    } finally {
      setExporting(false);
    }
  };

  // ─── CHART OPTIONS BASE ────────────────────────────────────────
  const baseOpts = useMemo(() => ({
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
      y: { ticks: { color: colors.textColor }, grid: { color: colors.gridColor } },
    },
    animation: { duration: 700, easing: 'easeOutQuart' },
  }), [colors, darkMode]);

  // ─── CHART DATA ────────────────────────────────────────────────

  // Usage stacked bar (filtered by usage types)
  const usageBarData = useMemo(() => {
    const sets = [];
    if (filters.usageTypes.includes('Agriculture')) {
      sets.push({ label: 'Agricultural (Ml)', data: filtered.map((d) => d.agriculturalUsage), backgroundColor: CHART_PALETTE[2] + 'cc', borderRadius: 6, borderSkipped: false });
    }
    if (filters.usageTypes.includes('Industrial')) {
      sets.push({ label: 'Industrial (Ml)', data: filtered.map((d) => d.industrialUsage), backgroundColor: CHART_PALETTE[4] + 'cc', borderRadius: 6, borderSkipped: false });
    }
    if (filters.usageTypes.includes('Household')) {
      sets.push({ label: 'Household (Ml)', data: filtered.map((d) => d.householdUsage), backgroundColor: CHART_PALETTE[6] + 'cc', borderRadius: 6, borderSkipped: false });
    }
    return { labels: years, datasets: sets };
  }, [filtered, years, filters.usageTypes]);

  // Pie: distribution
  const pieData = useMemo(() => {
    if (!latestData) return null;
    const vals = [], labels = [], bgs = [];
    if (filters.usageTypes.includes('Agriculture')) { vals.push(latestData.agriculturalUsage); labels.push('Agricultural'); bgs.push(CHART_PALETTE[2]); }
    if (filters.usageTypes.includes('Industrial')) { vals.push(latestData.industrialUsage); labels.push('Industrial'); bgs.push(CHART_PALETTE[4]); }
    if (filters.usageTypes.includes('Household')) { vals.push(latestData.householdUsage); labels.push('Household'); bgs.push(CHART_PALETTE[6]); }
    return { labels, datasets: [{ data: vals, backgroundColor: bgs, borderWidth: 3, borderColor: darkMode ? '#1e293b' : '#fff', hoverOffset: 8 }] };
  }, [latestData, filters.usageTypes, darkMode]);

  // Rainfall bar with alert markers
  const rainfallBarData = useMemo(() => {
    const avgRain = filtered.length ? filtered.reduce((s, d) => s + d.rainfall, 0) / filtered.length : 0;
    return {
      labels: years,
      datasets: [
        {
          label: 'Rainfall (mm)',
          data: filtered.map((d) => d.rainfall),
          backgroundColor: filtered.map((d) => d.rainfall < avgRain * 0.8 ? '#ef444499' : `${CHART_PALETTE[1]}cc`),
          borderRadius: 6, borderSkipped: false,
        },
        {
          label: 'Avg Rainfall',
          data: filtered.map(() => avgRain),
          type: 'line',
          borderColor: '#94a3b8',
          borderDash: [6, 3],
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
        },
      ],
    };
  }, [filtered, years]);

  // Always allow render even without explicit selection (URL param is primary)
  if (!selectedLocation && !locationName) return null;

  if (loading) return <LoadingSpinner text="Loading advanced analytics..." />;

  if (error && waterData.length === 0) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center">
        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/30 rounded-xl p-8">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">Unable to Load Analytics</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">{error}</p>
          <div className="flex gap-2 justify-center">
            <button onClick={loadData} className="btn-primary text-sm">Retry</button>
            <button onClick={() => navigate('/')} className="btn-secondary text-sm">
              <FiArrowLeft className="inline mr-1" size={13} /> Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-6 pt-4 pb-6" ref={reportRef}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5"
      >
        <div>
          <button
            onClick={() => navigate(`/dashboard/${encodeURIComponent(locationName)}`)}
            className="text-xs text-slate-400 hover:text-primary-500 mb-1.5 flex items-center gap-1 transition-colors"
            data-no-pdf
          >
            <FiArrowLeft size={12} /> Dashboard
          </button>
          <h1 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white tracking-tight">
            Analytics &mdash; {locationName}
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Forecasting, insights & data analysis
          </p>
        </div>
        <div className="flex flex-wrap gap-2" data-no-pdf>
          <StoryMode data={filtered} predictions={predictions} locationName={locationName} />
          <button onClick={exportPDF} disabled={exporting} className="btn-secondary flex items-center gap-1.5 text-sm">
            <FiDownload size={13} /> {exporting ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </motion.div>

      {/* ───── TREND INDICATORS ───── */}
      <TrendIndicators data={filtered} />

      {/* ───── FILTER PANEL ───── */}
      <div data-no-pdf>
        <AdvancedFilterPanel
          filters={filters}
          onChange={setFilters}
          allLocations={allLocationNames}
          yearBounds={yearBounds}
        />
      </div>

      {/* ───── ROW 1: Risk Gauge + Detailed Index ───── */}
      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <RiskScoreGauge score={latestData?.waterScore || 0} />
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          <DetailedIndexPanel data={latestData} />
        </motion.div>
      </div>

      {/* ───── ROW 2: Forecast + Multi-Axis ───── */}
      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <ForecastChart data={filtered} predictions={predictions} field="groundwaterLevel" label="Water Level" unit="m" />
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
          <MultiAxisChart data={filtered} />
        </motion.div>
      </div>

      {/* ───── ROW 3: Drill-Down + Usage Bar ───── */}
      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <DrillDownChart data={filtered} />
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
          <div className="chart-container">
            <h3 className="section-title flex items-center gap-2">Usage by Category & Year</h3>
            <p className="text-[11px] text-gray-400 -mt-3 mb-3">Filtered by selected usage types</p>
            <div className="h-[300px]">
              <Bar data={usageBarData} options={{
                ...baseOpts,
                scales: {
                  ...baseOpts.scales,
                  y: { ...baseOpts.scales.y, title: { display: true, text: 'Megalitres (Ml)', color: colors.textColor } },
                },
              }} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* ───── ROW 4: Rainfall Alerts + Pie ───── */}
      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <div className="chart-container">
            <h3 className="section-title flex items-center gap-2">Rainfall with Alert Markers</h3>
            <p className="text-[11px] text-gray-400 -mt-3 mb-3">Red bars = below 80% of average (drought risk)</p>
            <div className="h-[300px]">
              <Bar data={rainfallBarData} options={{
                ...baseOpts,
                scales: {
                  ...baseOpts.scales,
                  y: { ...baseOpts.scales.y, title: { display: true, text: 'Rainfall (mm)', color: colors.textColor } },
                },
              }} />
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}>
          {pieData && (
            <div className="chart-container flex flex-col items-center">
              <h3 className="section-title self-start flex items-center gap-2">Water Usage Distribution ({latestData?.year})</h3>
              <div className="h-[300px] w-[300px]">
                <Doughnut data={pieData} options={{
                  responsive: true, maintainAspectRatio: false,
                  cutout: '55%',
                  plugins: {
                    legend: { position: 'bottom', labels: { color: colors.textColor, padding: 15, usePointStyle: true, font: { size: 11 } } },
                  },
                  animation: { animateRotate: true, duration: 1000 },
                }} />
              </div>
              {/* Center label */}
              <div className="relative -mt-[180px] mb-[120px] text-center pointer-events-none">
                <p className="text-2xl font-extrabold text-gray-700 dark:text-gray-200">
                  {((latestData?.agriculturalUsage || 0) + (latestData?.industrialUsage || 0) + (latestData?.householdUsage || 0)).toFixed(0)}
                </p>
                <p className="text-[10px] text-gray-400">Total Ml</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* ───── ROW 5: Smart Insights ───── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mb-4 sm:mb-6">
        <SmartInsightPanel data={filtered} predictions={predictions} />
      </motion.div>

      {/* ───── ROW 5.5: Outlier Detection + Time Slider ───── */}
      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.52 }}>
          <OutlierAlertChart data={filtered} field="groundwaterLevel" label="Water Level" unit="m" />
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.54 }}>
          <TimeSliderAnimation data={filtered} />
        </motion.div>
      </div>

      {/* ───── ROW 6: Location Comparison ───── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }} className="mb-4 sm:mb-6">
        <LocationComparison currentLocation={locationName} allLocations={allLocationNames} />
      </motion.div>

      {/* ───── ROW 7: Prediction table ───── */}
      {predictions.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="bg-white dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/30 rounded-xl overflow-hidden mb-4 sm:mb-6">
          <div className="px-5 pt-4 pb-2">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 tracking-tight">Prediction Table with Confidence Intervals</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">95% confidence bands widen with forecast horizon</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-slate-100 dark:border-slate-700/40 bg-slate-50/60 dark:bg-slate-900/30">
                  <th className="py-2.5 px-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Year</th>
                  <th className="py-2.5 px-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Water Level (m)</th>
                  <th className="py-2.5 px-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Rainfall (mm)</th>
                  <th className="py-2.5 px-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Depletion (%)</th>
                  <th className="py-2.5 px-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Trend</th>
                  <th className="py-2.5 px-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30">
                {predictions.map((p, i) => {
                  const prevLevel = i > 0 ? predictions[i - 1].groundwaterLevel : (latestData?.groundwaterLevel || 0);
                  const trend = p.groundwaterLevel - prevLevel;
                  const confColor = p.confidenceLevel === 'high' ? 'text-green-500 bg-green-50 dark:bg-green-900/20' : p.confidenceLevel === 'medium' ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'text-red-500 bg-red-50 dark:bg-red-900/20';
                  return (
                    <tr key={p.year} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/20 transition-colors">
                      <td className="py-2.5 px-4 font-bold text-primary-600 tabular-nums">{p.year}</td>
                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300 tabular-nums">
                        {formatNumber(p.groundwaterLevel, 2)}
                        {p.groundwaterLevelCI && (
                          <span className="text-[10px] text-slate-400 ml-1">
                            [{formatNumber(p.groundwaterLevelCI.lower, 1)}–{formatNumber(p.groundwaterLevelCI.upper, 1)}]
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300 tabular-nums">
                        {formatNumber(p.rainfall, 1)}
                        {p.rainfallCI && (
                          <span className="text-[10px] text-slate-400 ml-1">
                            [{formatNumber(p.rainfallCI.lower, 0)}–{formatNumber(p.rainfallCI.upper, 0)}]
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300 tabular-nums">
                        {formatNumber(p.depletionRate, 2)}
                        {p.depletionRateCI && (
                          <span className="text-[10px] text-slate-400 ml-1">
                            [{formatNumber(p.depletionRateCI.lower, 1)}–{formatNumber(p.depletionRateCI.upper, 1)}]
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`text-[11px] font-bold ${trend > 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {trend > 0 ? '+' : ''}{trend.toFixed(2)}m
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${confColor}`}>
                          {p.confidenceLevel || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-slate-400 px-5 py-3">
            Predictions based on linear regression with 95% confidence intervals. Bands widen with forecast distance. Indicative only.
          </p>
        </motion.div>
      )}

      {/* Footer */}
      <div className="text-center py-4 text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 border-t border-slate-200/50 dark:border-slate-700/30">
        JalRakshya &mdash; {locationName} &mdash; {new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}
      </div>
    </div>
  );
}
