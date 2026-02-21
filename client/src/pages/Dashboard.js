import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiDroplet, FiCloudRain, FiTrendingDown, FiActivity,
  FiAward, FiBarChart2, FiArrowLeft, FiSearch, FiMapPin,
} from 'react-icons/fi';
import { useLocation } from '../context/LocationContext';
import {
  fetchWaterData, fetchLatestData, fetchLocationByName, fetchLocationSummary,
} from '../utils/api';
import KPICard from '../components/KPICard';
import MapComponent from '../components/MapComponent';
import DataTable from '../components/DataTable';
import WaterScoreGauge from '../components/WaterScoreGauge';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { location: paramLoc } = useParams();
  const locationName = decodeURIComponent(paramLoc);
  const navigate = useNavigate();
  const { selectedLocation, selectLocation } = useLocation();

  // Sync selectedLocation from URL param if not already set
  useEffect(() => {
    if (!selectedLocation && locationName) {
      selectLocation(locationName);
    }
  }, [selectedLocation, locationName, selectLocation]);

  const [waterData, setWaterData] = useState([]);
  const [latest, setLatest] = useState(null);
  const [locInfo, setLocInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [wRes, lRes, locRes, sumRes] = await Promise.all([
        fetchWaterData(locationName),
        fetchLatestData(locationName),
        fetchLocationByName(locationName).catch(() => null),
        fetchLocationSummary(locationName).catch(() => null),
      ]);
      setWaterData(wRes.data || []);
      setLatest(lRes.data || null);
      setLocInfo(locRes?.data || null);
      setSummary(sumRes?.summary || null);
      selectLocation(locationName);
    } catch (err) {
      setError(err.message);
      toast.error(`Failed to load data for ${locationName}`);
    } finally {
      setLoading(false);
    }
  }, [locationName, selectLocation]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Hooks must be called unconditionally (before any early returns)
  const trendMap = useMemo(() => {
    if (waterData.length < 2) return {};
    const curr = waterData[waterData.length - 1];
    const prev = waterData[waterData.length - 2];
    const calc = (field) => {
      if (!prev[field]) return undefined;
      return ((curr[field] - prev[field]) / prev[field]) * 100;
    };
    return {
      groundwaterLevel: calc('groundwaterLevel'),
      rainfall: calc('rainfall'),
      depletionRate: calc('depletionRate'),
    };
  }, [waterData]);

  const trend = (field) => trendMap[field];

  const mapCenter = locInfo
    ? { lat: locInfo.latitude, lng: locInfo.longitude }
    : { lat: 19.9975, lng: 73.7898 };

  // Always allow render even without explicit selection (URL param is primary)
  if (loading) return <LoadingSpinner text={`Loading dashboard for ${locationName}...`} />;

  if (error) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center">
        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/30 rounded-xl p-8">
          <FiSearch className="text-3xl text-slate-400 dark:text-slate-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">No Data Found</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">{error}</p>
          <button onClick={() => navigate('/')} className="btn-primary text-sm">
            <FiArrowLeft className="inline mr-1.5" size={14} /> Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 pt-4 pb-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5"
      >
        <div>
          <button
            onClick={() => navigate('/')}
            className="text-xs text-slate-400 hover:text-primary-500 mb-1.5 flex items-center gap-1 transition-colors"
          >
            <FiArrowLeft size={12} /> Home
          </button>
          <div className="flex items-center gap-2">
            <FiMapPin className="text-primary-500" size={18} />
            <h1 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white tracking-tight">
              {locationName}
            </h1>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 ml-7">
            Nashik District, Maharashtra
          </p>
        </div>
        <button
          onClick={() => navigate(`/analytics/${encodeURIComponent(locationName)}`)}
          className="btn-primary flex items-center gap-1.5 text-sm py-2 px-4"
        >
          <FiBarChart2 size={14} /> Analytics
        </button>
      </motion.div>

      {/* Summary Narrative Banner */}
      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-5 bg-gradient-to-r from-primary-50 to-teal-50 dark:from-primary-950/20 dark:to-teal-950/20 border border-primary-200/50 dark:border-primary-800/30 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
              summary.trend === 'improving' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
              summary.trend === 'declining' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
              'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}>
              {summary.trend === 'improving' ? '↗' : summary.trend === 'declining' ? '↘' : '→'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{summary.narrative}</p>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  Trend: <span className={summary.trend === 'improving' ? 'text-green-600' : summary.trend === 'declining' ? 'text-red-600' : 'text-slate-600'}>{summary.trend}</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  Active Alerts: <span className={summary.alertCount > 2 ? 'text-red-600' : 'text-slate-600'}>{summary.alertCount}</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  Years: {summary.yearsAvailable?.join(', ')}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* KPI Cards */}
      {latest && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5"
        >
          <KPICard
            icon={<FiDroplet size={18} />}
            title="Water Level"
            value={latest.groundwaterLevel}
            unit="m"
            color="blue"
            subtitle="Depth below ground"
            trend={trend('groundwaterLevel')}
            invertTrend
          />
          <KPICard
            icon={<FiCloudRain size={18} />}
            title="Rainfall"
            value={latest.rainfall}
            unit="mm"
            color="cyan"
            subtitle="Annual rainfall"
            trend={trend('rainfall')}
          />
          <KPICard
            icon={<FiTrendingDown size={18} />}
            title="Depletion"
            value={latest.depletionRate}
            unit="%"
            color="red"
            subtitle="Groundwater depletion"
            trend={trend('depletionRate')}
            invertTrend
          />
          <KPICard
            icon={<FiActivity size={18} />}
            title="pH Level"
            value={latest.ph}
            unit=""
            color="purple"
            subtitle={latest.wqi?.index || ''}
          />
          <KPICard
            icon={<FiAward size={18} />}
            title="Water Score"
            value={latest.waterScore}
            unit="/100"
            color={latest.waterScore >= 70 ? 'green' : latest.waterScore >= 40 ? 'amber' : 'red'}
            subtitle={latest.status}
          />
        </motion.div>
      )}

      {/* Map + Status + Score */}
      <div className="grid lg:grid-cols-3 gap-4 mb-5">
        {/* Map */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 h-[300px] sm:h-[400px] rounded-xl overflow-hidden border border-slate-200/60 dark:border-slate-700/30"
        >
          <MapComponent
            center={mapCenter}
            zoom={13}
            singleMarker={
              latest
                ? {
                    location: locationName,
                    groundwaterLevel: latest.groundwaterLevel,
                    rainfall: latest.rainfall,
                    depletionRate: latest.depletionRate,
                    ph: latest.ph,
                    status: latest.status,
                    waterScore: latest.waterScore,
                    scarcityLevel: latest.scarcityLevel,
                  }
                : null
            }
            isDashboard
          />
        </motion.div>

        {/* Score + Status panel */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/30 rounded-xl p-5 flex flex-col items-center justify-center gap-3"
        >
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Water Health Score
          </p>
          {latest && (
            <>
              <WaterScoreGauge score={latest.waterScore} size={140} />
              <span
                className={`px-3 py-1 rounded-md text-xs font-bold ${
                  latest.status === 'Safe'
                    ? 'status-safe'
                    : latest.status === 'Warning'
                    ? 'status-warning'
                    : 'status-critical'
                }`}
              >
                {latest.status} Zone
              </span>

              <div className="w-full space-y-2.5 mt-1">
                <IndexBar label="Water Quality (pH)" value={latest.wqi?.value} text={latest.wqi?.index} />
                <IndexBar label="Depletion Index" value={latest.depletionIndex?.value} text={latest.depletionIndex?.index} />
                <IndexBar label="Sustainability" value={latest.sustainabilityScore} text={latest.sustainabilityScore >= 60 ? 'Sustainable' : 'At Risk'} />
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Data Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <DataTable data={waterData} />
      </motion.div>

      {/* Quick Summary */}
      {latest && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-4 py-3 px-4 bg-slate-50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/20 rounded-lg text-center"
        >
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">{waterData.length}</span> records &middot;
            {waterData.length > 0 && <> {waterData[0]?.year}&ndash;{waterData[waterData.length - 1]?.year} &middot;</>}
            {' '}{locationName}
          </p>
        </motion.div>
      )}
    </div>
  );
}

function IndexBar({ label, value, text }) {
  const [width, setWidth] = useState(0);
  const color =
    value >= 70 ? 'bg-green-500' : value >= 40 ? 'bg-amber-500' : 'bg-red-500';

  useEffect(() => {
    const t = setTimeout(() => setWidth(Math.min(100, value || 0)), 300);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div>
      <div className="flex items-center justify-between text-[11px] mb-1">
        <span className="text-slate-500 dark:text-slate-400">{label}</span>
        <span className="font-semibold text-slate-700 dark:text-slate-300">{text}</span>
      </div>
      <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
