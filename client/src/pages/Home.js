import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiMapPin, FiDroplet, FiTrendingUp, FiShield, FiArrowRight, FiDatabase, FiCpu, FiBarChart2 } from 'react-icons/fi';
import { useLocation } from '../context/LocationContext';
import { fetchLocations, fetchDistrictStats, fetchAllOverview, fetchAlerts, fetchGovUpdates, fetchSearchSuggestions, fetchDistrictAlerts, fetchDistrictGovUpdates } from '../utils/api';
import MapComponent from '../components/MapComponent';
import AlertPanel from '../components/AlertPanel';
import GovUpdates from '../components/GovUpdates';
import toast from 'react-hot-toast';

export default function Home() {
  const navigate = useNavigate();
  const { selectedLocation, selectLocation, setAllLocations } = useLocation();

  const [locations, setLocations] = useState([]);
  const [search, setSearch] = useState(selectedLocation || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [overviewData, setOverviewData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [govUpdates, setGovUpdatesData] = useState([]);
  const [exploredLocation, setExploredLocation] = useState(selectedLocation || '');
  const dropdownRef = useRef(null);
  const debounceRef = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [navigating, setNavigating] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(value), 200);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [locRes, statRes, ovRes, dAlertRes, dGovRes] = await Promise.all([
          fetchLocations(),
          fetchDistrictStats(),
          fetchAllOverview(),
          fetchDistrictAlerts(),
          fetchDistrictGovUpdates(),
        ]);
        setLocations(locRes.data || []);
        setAllLocations(locRes.data || []);
        setStats(statRes.stats);
        setOverviewData(ovRes.data || []);
        setAlerts(dAlertRes.alerts || []);
        setGovUpdatesData(dGovRes.updates || []);
      } catch (err) {
        toast.error('Failed to load locations. Is the server running?');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [setAllLocations]);

  useEffect(() => {
    const loc = exploredLocation;
    if (!loc) return;
    let cancelled = false;
    (async () => {
      try {
        const [alertRes, govRes] = await Promise.all([
          fetchAlerts(loc),
          fetchGovUpdates(loc),
        ]);
        if (!cancelled) {
          setAlerts(alertRes.alerts || []);
          setGovUpdatesData(govRes.updates || []);
        }
      } catch {
        // Keep existing district-wide data on error
      }
    })();
    return () => { cancelled = true; };
  }, [exploredLocation]);

  const mapMarkers = useMemo(() => {
    return overviewData.map((loc) => ({
      position: { lat: loc.coordinates?.latitude, lng: loc.coordinates?.longitude },
      location: loc.location,
      groundwaterLevel: loc.groundwaterLevel,
      rainfall: loc.rainfall,
      status: loc.status,
      waterScore: loc.waterScore,
      scarcityLevel: loc.scarcityLevel,
      depletionRate: loc.depletionRate,
      ph: loc.ph,
      consumption: loc.consumption,
      perCapitaUsage: loc.perCapitaUsage,
    }));
  }, [overviewData]);

  const filtered = useMemo(() => {
    if (!debouncedSearch.trim()) return locations.slice(0, 15);
    return locations.filter((l) =>
      l.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [debouncedSearch, locations]);

  // Fetch smart search suggestions with preview data
  useEffect(() => {
    if (!debouncedSearch.trim() || debouncedSearch.length < 1) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchSearchSuggestions(debouncedSearch);
        if (!cancelled) setSuggestions(res.suggestions || []);
      } catch {
        if (!cancelled) setSuggestions([]);
      }
    })();
    return () => { cancelled = true; };
  }, [debouncedSearch]);

  const navTimerRef = useRef(null);

  const handleNavigateWithTransition = useCallback((name) => {
    selectLocation(name);
    setNavigatingTo(name);
    setNavigating(true);
    if (navTimerRef.current) clearTimeout(navTimerRef.current);
    navTimerRef.current = setTimeout(() => {
      navigate(`/dashboard/${encodeURIComponent(name)}`);
    }, 2000);
  }, [navigate, selectLocation]);

  // Cleanup navigation timer on unmount
  useEffect(() => {
    return () => { if (navTimerRef.current) clearTimeout(navTimerRef.current); };
  }, []);

  const handleSelect = (name) => {
    setSearch(name);
    setExploredLocation(name);
    setShowDropdown(false);
  };

  const handleExplore = (name) => {
    if (!name) return;
    // Verify the location exists in our list
    const found = locations.find((l) => l.name.toLowerCase() === name.toLowerCase());
    const finalName = found ? found.name : name;
    setSearch(finalName);
    setExploredLocation(finalName);
    setShowDropdown(false);
    handleNavigateWithTransition(finalName);
  };

  const features = [
    { icon: <FiMapPin size={20} />, title: 'Location Intelligence', desc: 'Monitor 315+ locations across Nashik district with precise geospatial mapping.' },
    { icon: <FiDroplet size={20} />, title: 'Water Level Tracking', desc: 'Real-time groundwater depth, rainfall, and depletion metrics at a glance.' },
    { icon: <FiTrendingUp size={20} />, title: 'Predictive Analytics', desc: 'Linear regression-based forecasting for future water availability trends.' },
    { icon: <FiShield size={20} />, title: 'Smart Alerts', desc: 'Automated warnings for drought risk, over-extraction, and quality issues.' },
    { icon: <FiDatabase size={20} />, title: 'Historical Data', desc: '6 years of comprehensive data (2016-2021) for deep trend analysis.' },
    { icon: <FiCpu size={20} />, title: 'AI Insights', desc: 'Machine-generated smart insights and risk assessment for every location.' },
  ];

  return (
    <div className="min-h-screen">
      {/* Fullscreen Loading Transition */}
      <AnimatePresence>
        {navigating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-primary-600 via-primary-700 to-teal-700"
          >
            {/* Animated water ripple rings */}
            <div className="relative flex items-center justify-center mb-8">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0.5, opacity: 0.8 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.5,
                    ease: 'easeOut',
                  }}
                  className="absolute w-16 h-16 rounded-full border-2 border-white/40"
                />
              ))}
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: [0.8, 1.1, 0.8] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                className="relative z-10 bg-white/20 backdrop-blur-sm rounded-full p-5"
              >
                <FiDroplet className="text-white" size={32} />
              </motion.div>
            </div>

            {/* Loading text */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Diving into Data
              </h2>
              <p className="text-white/70 text-sm sm:text-base">
                Loading insights for <span className="font-semibold text-white">{navigatingTo}</span>
              </p>
            </motion.div>

            {/* Progress bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 w-64 h-1.5 bg-white/20 rounded-full overflow-hidden"
            >
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.8, ease: 'easeInOut' }}
                className="h-full bg-white rounded-full"
              />
            </motion.div>

            {/* Floating particles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={`particle-${i}`}
                initial={{
                  x: Math.random() * 300 - 150,
                  y: Math.random() * 300 - 150,
                  opacity: 0,
                  scale: 0,
                }}
                animate={{
                  y: [null, -200 - Math.random() * 100],
                  opacity: [0, 0.6, 0],
                  scale: [0, 1, 0.5],
                }}
                transition={{
                  duration: 2 + Math.random(),
                  repeat: Infinity,
                  delay: Math.random() * 1.5,
                  ease: 'easeOut',
                }}
                className="absolute w-2 h-2 rounded-full bg-white/30"
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero */}
      <section className="relative pt-24 pb-14 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-24 left-1/4 w-64 h-64 bg-primary-500/[0.06] rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-teal-500/[0.05] rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-1.5 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 px-3 py-1 rounded-md text-xs font-semibold tracking-wide uppercase mb-5">
              <FiDroplet size={12} /> Nashik District
            </span>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight leading-[1.15]">
              JalRakshya
            </h1>
            <p className="text-lg sm:text-xl font-medium text-slate-500 dark:text-slate-400 mb-4">
              Intelligent Groundwater Monitoring
            </p>

            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed">
              Actionable groundwater insights for citizens and policymakers.
              Interactive dashboards, smart alerts, and predictive analytics.
            </p>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="max-w-lg mx-auto relative"
            ref={dropdownRef}
          >
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 rounded-xl p-1.5 shadow-sm focus-within:ring-2 focus-within:ring-primary-400/40 transition-shadow">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { handleSearchChange(e.target.value); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Search location..."
                  className="w-full pl-9 pr-3 py-2.5 bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none text-sm"
                  role="combobox"
                  aria-expanded={showDropdown}
                  aria-haspopup="listbox"
                  aria-autocomplete="list"
                />
              </div>
              <button
                onClick={() => { if (search.trim()) handleExplore(search.trim()); }}
                className="btn-primary flex items-center gap-1.5 text-sm py-2.5 px-4"
              >
                <FiMapPin size={14} /> Explore
              </button>
            </div>

            {showDropdown && filtered.length > 0 && (
              <div className="absolute z-50 w-full mt-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-xl max-h-72 overflow-y-auto shadow-lg" role="listbox">
                {(suggestions.length > 0 ? suggestions : filtered).map((loc) => {
                  const name = loc.name || loc;
                  const hasMeta = loc.waterScore !== undefined;
                  const trendIcon = loc.trend === 'improving' ? '↗' : loc.trend === 'declining' ? '↘' : '→';
                  const trendColor = loc.trend === 'improving' ? 'text-green-500' : loc.trend === 'declining' ? 'text-red-500' : 'text-slate-400';
                  const statusColor = loc.status === 'Safe' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : loc.status === 'Warning' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : loc.status === 'Critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-slate-100 text-slate-600';
                  return (
                    <button
                      key={name}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors flex items-center gap-3 border-b border-slate-100 dark:border-slate-700/30 last:border-0 focus:bg-slate-50 dark:focus:bg-slate-700/40 outline-none"
                      onClick={() => handleSelect(name)}
                      role="option"
                    >
                      <FiMapPin className="text-primary-500 flex-shrink-0" size={13} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-800 dark:text-slate-200">{name}</p>
                        <p className="text-[11px] text-slate-400">{loc.district || 'Nashik'}, Maharashtra</p>
                      </div>
                      {hasMeta && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-xs font-bold ${trendColor}`}>{trendIcon}</span>
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{loc.waterScore}</span>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${statusColor}`}>{loc.status}</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Stats */}
          {stats && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="max-w-2xl mx-auto mt-10"
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard value={stats.totalLocations} label="Locations" color="text-primary-600 dark:text-primary-400" />
                <StatCard value={stats.safeCount} label="Safe" color="text-green-600 dark:text-green-400" />
                <StatCard value={stats.warningCount} label="Warning" color="text-amber-600 dark:text-amber-400" />
                <StatCard value={stats.criticalCount} label="Critical" color="text-red-600 dark:text-red-400" />
              </div>

              {/* District Trend & Top/Bottom Locations */}
              {stats.districtTrend && (
                <div className="mt-4 grid sm:grid-cols-2 gap-3">
                  {/* District trend badge */}
                  <div className="bg-white dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/30 rounded-lg p-3">
                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">District Trend</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold ${stats.districtTrend === 'improving' ? 'text-green-500' : stats.districtTrend === 'declining' ? 'text-red-500' : 'text-slate-500'}`}>
                        {stats.districtTrend === 'improving' ? '↗' : stats.districtTrend === 'declining' ? '↘' : '→'}
                      </span>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 capitalize">{stats.districtTrend}</span>
                    </div>
                    {stats.trendDistribution && (
                      <div className="flex gap-3 mt-2 text-[10px] text-slate-500">
                        <span><span className="text-green-500 font-bold">{stats.trendDistribution.improving}</span> improving</span>
                        <span><span className="text-slate-400 font-bold">{stats.trendDistribution.stable}</span> stable</span>
                        <span><span className="text-red-500 font-bold">{stats.trendDistribution.declining}</span> declining</span>
                      </div>
                    )}
                  </div>

                  {/* Best 5 locations */}
                  {stats.best5 && (
                    <div className="bg-white dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/30 rounded-lg p-3">
                      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Top 5 Locations</p>
                      <div className="space-y-1">
                        {stats.best5.map((loc, i) => (
                          <button key={loc.location} onClick={() => handleExplore(loc.location)} className="w-full flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-700/30 rounded px-1.5 py-1 transition-colors">
                            <span className="text-[11px] text-slate-700 dark:text-slate-300 truncate">
                              <span className="font-bold text-primary-500 mr-1">#{i + 1}</span>{loc.location}
                            </span>
                            <span className={`text-[10px] font-bold ${loc.status === 'Safe' ? 'text-green-500' : loc.status === 'Warning' ? 'text-amber-500' : 'text-red-500'}`}>
                              {loc.score}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </section>

      {/* Alerts & Gov Updates — Always visible (district-wide or location-specific) */}
      <section className="px-4 mb-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {exploredLocation ? (
                  <>
                    <FiMapPin className="inline mr-1 text-primary-500" size={13} />
                    Insights for <span className="font-semibold text-slate-800 dark:text-slate-200">{exploredLocation}</span>
                  </>
                ) : (
                  <>
                    <FiShield className="inline mr-1 text-primary-500" size={13} />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Nashik District</span> — Alerts & Updates
                  </>
                )}
              </p>
              {exploredLocation && (
                <button
                  onClick={() => navigate(`/dashboard/${encodeURIComponent(exploredLocation)}`)}
                  className="btn-secondary text-xs flex items-center gap-1"
                >
                  Dashboard <FiArrowRight size={12} />
                </button>
              )}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <AlertPanel alerts={alerts} />
              <GovUpdates updates={govUpdates} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Map */}
      <section className="py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="text-center mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">
                Live Groundwater Map
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {stats?.totalLocations ?? '...'} monitoring stations across Nashik District. Click a marker for details.
              </p>
            </div>
            <div className="h-[300px] sm:h-[400px] lg:h-[500px] rounded-xl overflow-hidden border border-slate-200/60 dark:border-slate-700/30 shadow-sm">
              <MapComponent
                center={{ lat: 20.0, lng: 73.78 }}
                zoom={10}
                markers={mapMarkers}
                height="500px"
                showAllOverview
                onMarkerClick={(m) => {
                  if (m.location) navigate(`/dashboard/${encodeURIComponent(m.location)}`);
                }}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">
              Platform Capabilities
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Everything you need for groundwater monitoring and analysis.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/30 rounded-xl p-5 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600/40 transition-all duration-200"
              >
                <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 flex items-center justify-center mb-3">
                  {f.icon}
                </div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">{f.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 px-4 border-y border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-lg sm:text-xl font-bold text-center text-slate-800 dark:text-slate-100 mb-8">
            How It Works
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Search Location', desc: 'Find your area from 315+ monitoring stations.', icon: <FiSearch size={18} /> },
              { step: '2', title: 'Explore Dashboard', desc: 'View KPIs, maps, water scores, and historical data.', icon: <FiBarChart2 size={18} /> },
              { step: '3', title: 'Get Insights', desc: 'Access analytics, alerts, and recommendations.', icon: <FiTrendingUp size={18} /> },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 mb-3">
                  {item.icon}
                </div>
                <div className="text-[10px] font-bold text-primary-500 mb-1 uppercase tracking-widest">Step {item.step}</div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">{item.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Locations */}
      <section className="py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-lg sm:text-xl font-bold text-center text-slate-800 dark:text-slate-100 mb-6">
            Popular Locations
          </h2>
          {loading ? (
            <div className="flex justify-center py-8"><div className="spinner" /></div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {locations.slice(0, 20).map((loc) => (
                <button
                  key={loc.name}
                  onClick={() => handleSelect(loc.name)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/30 hover:border-primary-300 dark:hover:border-primary-700/40 hover:shadow-sm transition-all duration-150 group text-left"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{loc.name}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">Nashik</p>
                  </div>
                  <FiArrowRight className="text-slate-300 dark:text-slate-600 group-hover:text-primary-500 transition-colors flex-shrink-0 ml-1" size={13} />
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200/60 dark:border-slate-800/60">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="bg-primary-600 rounded-lg p-1.5">
                <FiDroplet className="text-white" size={14} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">JalRakshya</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Groundwater Intelligence</p>
              </div>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500">
                &copy; {new Date().getFullYear()} JalRakshya &mdash; Decision Support System
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                Nashik District Groundwater Survey &middot; 315 Stations
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* Animated Stat Counter */
function StatCard({ value, label, color }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || !value) return;
    const target = Number(value);
    const duration = 1000;
    const step = Math.ceil(target / (duration / 30));
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(current);
    }, 30);
    return () => clearInterval(timer);
  }, [inView, value]);

  return (
    <div ref={ref} className="bg-white dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/30 rounded-lg p-3 text-center">
      <p className={`text-xl sm:text-2xl font-bold tabular-nums ${color}`}>{count}</p>
      <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{label}</p>
    </div>
  );
}
