import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFilter, FiX, FiChevronDown, FiChevronUp, FiRefreshCw } from 'react-icons/fi';

const USAGE_TYPES = ['Agriculture', 'Industrial', 'Household'];

export default function AdvancedFilterPanel({ filters, onChange, allLocations = [], yearBounds = { min: 2016, max: 2021 } }) {
  const [expanded, setExpanded] = useState(true);
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => { setLocalFilters(filters); }, [filters]);

  const update = (key, val) => {
    const next = { ...localFilters, [key]: val };
    setLocalFilters(next);
    onChange(next);
  };

  const reset = () => {
    const def = {
      yearMin: yearBounds.min,
      yearMax: yearBounds.max,
      usageTypes: [...USAGE_TYPES],
      rainfallMin: 0,
      rainfallMax: 2000,
      selectedLocations: [],
    };
    setLocalFilters(def);
    onChange(def);
  };

  const toggleUsage = (type) => {
    const types = localFilters.usageTypes.includes(type)
      ? localFilters.usageTypes.filter((t) => t !== type)
      : [...localFilters.usageTypes, type];
    update('usageTypes', types);
  };

  const activeCount = () => {
    let c = 0;
    if (localFilters.yearMin > yearBounds.min || localFilters.yearMax < yearBounds.max) c++;
    if (localFilters.usageTypes.length < 3) c++;
    if (localFilters.rainfallMin > 0 || localFilters.rainfallMax < 2000) c++;
    if (localFilters.selectedLocations?.length) c++;
    return c;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card mb-6 overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 group"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600">
            <FiFilter size={16} />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Interactive Filters
              {activeCount() > 0 && (
                <span className="ml-2 bg-primary-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {activeCount()} active
                </span>
              )}
            </p>
            <p className="text-[11px] text-gray-400">Control all charts dynamically</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeCount() > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); reset(); }}
              className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <FiRefreshCw size={12} /> Reset
            </button>
          )}
          {expanded ? <FiChevronUp className="text-gray-400" /> : <FiChevronDown className="text-gray-400" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Year Range */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Year Range
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={yearBounds.min}
                    max={yearBounds.max}
                    value={localFilters.yearMin}
                    onChange={(e) => update('yearMin', Math.min(+e.target.value, localFilters.yearMax))}
                    className="flex-1 accent-primary-500 h-1.5"
                  />
                  <span className="text-xs font-bold text-primary-600 w-10 text-center">{localFilters.yearMin}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={yearBounds.min}
                    max={yearBounds.max}
                    value={localFilters.yearMax}
                    onChange={(e) => update('yearMax', Math.max(+e.target.value, localFilters.yearMin))}
                    className="flex-1 accent-primary-500 h-1.5"
                  />
                  <span className="text-xs font-bold text-primary-600 w-10 text-center">{localFilters.yearMax}</span>
                </div>
                <p className="text-[10px] text-gray-400 text-center">
                  {localFilters.yearMin} — {localFilters.yearMax}
                </p>
              </div>

              {/* Usage Type Filter */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Usage Type
                </label>
                <div className="flex flex-col gap-1.5">
                  {USAGE_TYPES.map((t) => (
                    <button
                      key={t}
                      onClick={() => toggleUsage(t)}
                      className={`text-xs px-3 py-2 rounded-lg font-medium transition-all duration-200 text-left ${
                        localFilters.usageTypes.includes(t)
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 ring-1 ring-primary-300 dark:ring-primary-700'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {localFilters.usageTypes.includes(t) ? '✓ ' : '  '}{t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rainfall Range */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Rainfall Range (mm)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={2000}
                    value={localFilters.rainfallMin}
                    onChange={(e) => update('rainfallMin', Math.max(0, +e.target.value))}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs"
                    placeholder="Min"
                  />
                  <span className="text-gray-400 text-xs">—</span>
                  <input
                    type="number"
                    min={0}
                    max={2000}
                    value={localFilters.rainfallMax}
                    onChange={(e) => update('rainfallMax', Math.min(2000, +e.target.value))}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs"
                    placeholder="Max"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={2000}
                    value={localFilters.rainfallMin}
                    onChange={(e) => update('rainfallMin', Math.min(+e.target.value, localFilters.rainfallMax))}
                    className="flex-1 accent-cyan-500 h-1.5"
                  />
                </div>
              </div>

              {/* Location Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Compare Locations
                </label>
                <select
                  multiple
                  value={localFilters.selectedLocations || []}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, (o) => o.value);
                    update('selectedLocations', selected);
                  }}
                  className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-xs h-[90px] overflow-y-auto"
                >
                  {allLocations.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                {(localFilters.selectedLocations?.length > 0) && (
                  <div className="flex flex-wrap gap-1">
                    {localFilters.selectedLocations.map((l) => (
                      <span
                        key={l}
                        className="inline-flex items-center gap-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-[10px] px-2 py-0.5 rounded-full"
                      >
                        {l}
                        <FiX
                          size={10}
                          className="cursor-pointer hover:text-red-500"
                          onClick={() => update('selectedLocations', localFilters.selectedLocations.filter((x) => x !== l))}
                        />
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
