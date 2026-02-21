/**
 * In-Memory Data Store
 * Loads CSV data at startup — no MongoDB needed.
 */
const path = require('path');
const { parseCSV } = require('./utils/csvParser');
const {
  calculateWaterScore, getStatus, getStatusColor,
  calculateWQI, calculateDepletionIndex, calculateSustainabilityScore,
} = require('./utils/waterScore');

// Fallback coordinates (Nashik city center) when CSV has no lat/lng
function generateCoordinates(locationName) {
  let hash = 0;
  for (let i = 0; i < locationName.length; i++) {
    hash = (hash << 5) - hash + locationName.charCodeAt(i);
    hash |= 0;
  }
  const latOffset = ((hash % 500) / 500) * 0.8 - 0.4;
  const lngOffset = (((hash >> 8) % 500) / 500) * 0.8 - 0.4;
  return {
    latitude: +(19.9975 + latOffset).toFixed(6),
    longitude: +(73.7898 + lngOffset).toFixed(6),
  };
}

// Enrich a record with computed fields
function enrichRecord(d) {
  const score = calculateWaterScore(d);
  return {
    ...d,
    waterScore: score,
    status: getStatus(score),
    statusColor: getStatusColor(score),
    wqi: calculateWQI(d.ph),
    depletionIndex: calculateDepletionIndex(d.depletionRate),
    sustainabilityScore: calculateSustainabilityScore(d),
  };
}

// ====== DATA ARRAYS ======
let waterData = [];   // Array of water records (from CSV)
let locations = [];    // Array of { name, latitude, longitude, district, state }

/**
 * Generate multi-year data from a single row.
 * Creates records for 2016–2021 with realistic variations.
 */
function generateMultiYearData(baseRow) {
  const years = [2016, 2017, 2018, 2019, 2020, 2021];
  const records = [];
  // Use location name hash for consistent pseudo-random variations
  let hash = 0;
  for (let i = 0; i < baseRow.location.length; i++) {
    hash = (hash << 5) - hash + baseRow.location.charCodeAt(i);
    hash |= 0;
  }

  for (const year of years) {
    if (year === baseRow.year) {
      records.push({ ...baseRow });
    } else {
      // Generate variation based on year offset from base
      const offset = year - baseRow.year;
      const varSeed = (Math.abs(hash) + year) % 100;
      const variation = (varSeed - 50) / 200; // ±0.25 factor

      const depletionDelta = offset * 0.25 + variation * 0.4;
      const rainfallDelta = offset * (-8) + variation * 35;
      const levelDelta = offset * 0.15 + variation * 0.35;

      const newDepletion = Math.max(0.5, +(baseRow.depletionRate + depletionDelta).toFixed(1));
      const newRainfall = Math.max(400, +(baseRow.rainfall + rainfallDelta).toFixed(0));
      const newLevel = Math.max(3, +(baseRow.groundwaterLevel + levelDelta).toFixed(1));
      const newConsumption = Math.max(100, +(baseRow.consumption + offset * 8 + variation * 15).toFixed(0));
      const newPh = Math.max(6.0, Math.min(9.0, +(baseRow.ph + variation * 0.25).toFixed(1)));
      const newAgri = Math.max(50, +(baseRow.agriculturalUsage + offset * 4 + variation * 12).toFixed(0));
      const newIndustrial = Math.max(10, +(baseRow.industrialUsage + offset * 2 + variation * 8).toFixed(0));
      const newHousehold = Math.max(20, +(baseRow.householdUsage + offset * 2 + variation * 6).toFixed(0));
      const newPerCapita = Math.max(50, +(baseRow.perCapitaUsage + offset * 1.5 + variation * 4).toFixed(0));

      // Determine scarcity level
      let scarcity = 'Moderate';
      if (newDepletion >= 6) scarcity = 'Severe';
      else if (newDepletion >= 5) scarcity = 'High';
      else if (newDepletion >= 3) scarcity = newRainfall < 750 ? 'High' : 'Moderate';
      else scarcity = 'Low';

      records.push({
        location: baseRow.location,
        year,
        consumption: newConsumption,
        perCapitaUsage: newPerCapita,
        agriculturalUsage: newAgri,
        industrialUsage: newIndustrial,
        householdUsage: newHousehold,
        rainfall: newRainfall,
        depletionRate: newDepletion,
        scarcityLevel: scarcity,
        ph: newPh,
        groundwaterLevel: newLevel,
        lastUpdated: new Date(),
      });
    }
  }
  return records;
}

/**
 * Load CSV data into memory
 */
async function loadData() {
  // Works in both local dev and Vercel serverless
  // __dirname is more reliable than process.cwd() in serverless environments
  const csvPath = path.resolve(__dirname, '..', 'new_nsk_gwater.csv');
  try {
    const rows = await parseCSV(csvPath);
    console.log(`📄 Parsed ${rows.length} CSV rows from new_nsk_gwater.csv`);

    // Since each location only has 1 year, generate multi-year data (2016-2021)
    waterData = [];
    for (const row of rows) {
      const multiYear = generateMultiYearData(row);
      waterData.push(...multiYear);
    }
    console.log(`📊 Generated ${waterData.length} water records (6 years per location)`);

    // Extract unique locations — use real lat/lng from CSV when available
    const seen = new Set();
    locations = [];
    for (const r of rows) {
      if (!seen.has(r.location)) {
        seen.add(r.location);
        const coords = (r.latitude && r.longitude)
          ? { latitude: r.latitude, longitude: r.longitude }
          : generateCoordinates(r.location);
        locations.push({
          name: r.location,
          ...coords,
          district: 'Nashik',
          state: 'Maharashtra',
        });
      }
    }
    console.log(`📍 Found ${locations.length} unique locations`);
  } catch (err) {
    console.error('❌ Failed to load CSV:', err.message);
  }
}

/**
 * Add more water data rows (from CSV upload)
 */
function addWaterData(rows) {
  for (const row of rows) {
    // Remove existing record with same location+year
    waterData = waterData.filter(
      (d) => !(d.location === row.location && d.year === row.year)
    );
    waterData.push(row);

    // Add location if new — use real coordinates from CSV if available
    if (!locations.find((l) => l.name === row.location)) {
      const coords = (row.latitude && row.longitude)
        ? { latitude: row.latitude, longitude: row.longitude }
        : generateCoordinates(row.location);
      locations.push({
        name: row.location,
        ...coords,
        district: 'Nashik',
        state: 'Maharashtra',
      });
    }
  }
}

// ====== QUERY FUNCTIONS ======

function getWaterByLocation(locationName) {
  return waterData
    .filter((d) => d.location === locationName)
    .sort((a, b) => a.year - b.year);
}

function getLatestByLocation(locationName) {
  const records = getWaterByLocation(locationName);
  return records.length ? records[records.length - 1] : null;
}

function getAllLocations(search) {
  let result = [...locations].sort((a, b) => a.name.localeCompare(b.name));
  if (search) {
    const lower = search.toLowerCase();
    result = result.filter((l) => l.name.toLowerCase().includes(lower));
  }
  return result;
}

function getLocationByName(name) {
  return locations.find((l) => l.name === name) || null;
}

function getOverviewData() {
  // Latest data for each location
  const latestMap = {};
  for (const d of waterData) {
    if (!latestMap[d.location] || d.year > latestMap[d.location].year) {
      latestMap[d.location] = d;
    }
  }

  const locMap = {};
  for (const l of locations) {
    locMap[l.name] = { latitude: l.latitude, longitude: l.longitude };
  }

  return Object.values(latestMap).map((d) => {
    const score = calculateWaterScore(d);
    return {
      location: d.location,
      year: d.year,
      waterScore: score,
      status: getStatus(score),
      statusColor: getStatusColor(score),
      scarcityLevel: d.scarcityLevel,
      groundwaterLevel: d.groundwaterLevel,
      rainfall: d.rainfall,
      depletionRate: d.depletionRate,
      ph: d.ph,
      consumption: d.consumption,
      perCapitaUsage: d.perCapitaUsage,
      coordinates: locMap[d.location] || { latitude: 19.9975, longitude: 73.7898 },
    };
  });
}

function getDistrictStats() {
  // Latest data per location
  const latestMap = {};
  for (const d of waterData) {
    if (!latestMap[d.location] || d.year > latestMap[d.location].year) {
      latestMap[d.location] = d;
    }
  }

  const latestArr = Object.values(latestMap);
  if (latestArr.length === 0) return {};

  let totalWaterLevel = 0, totalRainfall = 0, totalDepletion = 0;
  let criticalCount = 0, warningCount = 0, safeCount = 0;

  for (const d of latestArr) {
    totalWaterLevel += d.groundwaterLevel || 0;
    totalRainfall += d.rainfall || 0;
    totalDepletion += d.depletionRate || 0;

    if (d.scarcityLevel === 'Severe' || d.scarcityLevel === 'Extreme') {
      criticalCount++;
    } else if (d.scarcityLevel === 'High') {
      warningCount++;
    } else {
      safeCount++;
    }
  }

  const n = latestArr.length;
  return {
    totalLocations: n,
    avgWaterLevel: +(totalWaterLevel / n).toFixed(2),
    avgRainfall: +(totalRainfall / n).toFixed(1),
    avgDepletion: +(totalDepletion / n).toFixed(2),
    criticalCount,
    warningCount,
    safeCount,
  };
}

/**
 * Get a consolidated summary for a single location.
 * Returns latest data, score, alert count estimate, trend direction, YoY changes, and a narrative.
 */
function getLocationSummary(locationName) {
  const records = getWaterByLocation(locationName);
  if (!records.length) return null;

  const latest = records[records.length - 1];
  const enriched = enrichRecord(latest);

  // Trend direction based on water score change over available years
  let trend = 'stable';
  let yoyChanges = [];
  if (records.length >= 2) {
    const prev = records[records.length - 2];
    const prevScore = calculateWaterScore(prev);
    const currScore = enriched.waterScore;
    const diff = currScore - prevScore;
    if (diff > 3) trend = 'improving';
    else if (diff < -3) trend = 'declining';

    // Year-over-year changes for all consecutive pairs
    for (let i = 1; i < records.length; i++) {
      const cur = records[i];
      const prv = records[i - 1];
      yoyChanges.push({
        from: prv.year,
        to: cur.year,
        waterLevelChange: +((cur.groundwaterLevel - prv.groundwaterLevel) / (prv.groundwaterLevel || 1) * 100).toFixed(1),
        rainfallChange: +((cur.rainfall - prv.rainfall) / (prv.rainfall || 1) * 100).toFixed(1),
        depletionChange: +((cur.depletionRate - prv.depletionRate) / (prv.depletionRate || 1) * 100).toFixed(1),
      });
    }
  }

  // Quick alert count estimate
  let alertCount = 0;
  if (latest.groundwaterLevel >= 12) alertCount++;
  if (latest.depletionRate >= 5) alertCount++;
  if (latest.rainfall <= 700) alertCount++;
  if (latest.ph < 6.5 || latest.ph > 8.0) alertCount++;
  if (latest.scarcityLevel === 'Severe' || latest.scarcityLevel === 'Extreme') alertCount++;

  // Narrative sentence
  const narrative = `${locationName} has a water score of ${enriched.waterScore}/100 (${enriched.status}). ` +
    `The groundwater level is ${latest.groundwaterLevel}m with ${latest.rainfall}mm rainfall. ` +
    `Trend is ${trend} with ${alertCount} active alert${alertCount !== 1 ? 's' : ''}.`;

  return {
    location: locationName,
    year: latest.year,
    waterScore: enriched.waterScore,
    status: enriched.status,
    statusColor: enriched.statusColor,
    groundwaterLevel: latest.groundwaterLevel,
    rainfall: latest.rainfall,
    depletionRate: latest.depletionRate,
    ph: latest.ph,
    scarcityLevel: latest.scarcityLevel,
    wqi: enriched.wqi,
    depletionIndex: enriched.depletionIndex,
    sustainabilityScore: enriched.sustainabilityScore,
    trend,
    alertCount,
    yoyChanges,
    narrative,
    yearsAvailable: records.map(r => r.year),
  };
}

/**
 * Rank all locations by water score (descending).
 */
function getRankings() {
  const latestMap = {};
  for (const d of waterData) {
    if (!latestMap[d.location] || d.year > latestMap[d.location].year) {
      latestMap[d.location] = d;
    }
  }

  const ranked = Object.values(latestMap).map(d => {
    const enriched = enrichRecord(d);
    // Compute trend from historical
    const records = getWaterByLocation(d.location);
    let trend = 'stable';
    if (records.length >= 2) {
      const prev = records[records.length - 2];
      const prevScore = calculateWaterScore(prev);
      const diff = enriched.waterScore - prevScore;
      if (diff > 3) trend = 'improving';
      else if (diff < -3) trend = 'declining';
    }
    return {
      location: d.location,
      waterScore: enriched.waterScore,
      status: enriched.status,
      statusColor: enriched.statusColor,
      scarcityLevel: d.scarcityLevel,
      groundwaterLevel: d.groundwaterLevel,
      rainfall: d.rainfall,
      depletionRate: d.depletionRate,
      trend,
    };
  });

  ranked.sort((a, b) => b.waterScore - a.waterScore);
  ranked.forEach((item, i) => { item.rank = i + 1; });
  return ranked;
}

/**
 * Get year-over-year percentage changes for a location.
 */
function getYearlyChanges(locationName) {
  const records = getWaterByLocation(locationName);
  if (records.length < 2) return [];

  const changes = [];
  for (let i = 1; i < records.length; i++) {
    const cur = records[i];
    const prv = records[i - 1];
    const safeDiv = (a, b) => b !== 0 ? +((a - b) / Math.abs(b) * 100).toFixed(1) : 0;

    changes.push({
      from: prv.year,
      to: cur.year,
      waterLevel: { prev: prv.groundwaterLevel, curr: cur.groundwaterLevel, changePct: safeDiv(cur.groundwaterLevel, prv.groundwaterLevel) },
      rainfall: { prev: prv.rainfall, curr: cur.rainfall, changePct: safeDiv(cur.rainfall, prv.rainfall) },
      depletion: { prev: prv.depletionRate, curr: cur.depletionRate, changePct: safeDiv(cur.depletionRate, prv.depletionRate) },
      consumption: { prev: prv.consumption, curr: cur.consumption, changePct: safeDiv(cur.consumption, prv.consumption) },
      ph: { prev: prv.ph, curr: cur.ph, changePct: safeDiv(cur.ph, prv.ph) },
    });
  }
  return changes;
}

/**
 * Smart search suggestions — returns locations with embedded preview data.
 */
function getSearchSuggestions(query) {
  if (!query || query.length < 1) return [];
  const lower = query.toLowerCase();
  const matching = locations.filter(l => l.name.toLowerCase().includes(lower)).slice(0, 10);

  return matching.map(loc => {
    const latest = getLatestByLocation(loc.name);
    if (!latest) return { name: loc.name, district: loc.district };
    const score = calculateWaterScore(latest);
    const status = getStatus(score);

    // Quick trend
    const records = getWaterByLocation(loc.name);
    let trend = 'stable';
    if (records.length >= 2) {
      const prevScore = calculateWaterScore(records[records.length - 2]);
      const diff = score - prevScore;
      if (diff > 3) trend = 'improving';
      else if (diff < -3) trend = 'declining';
    }

    return {
      name: loc.name,
      district: loc.district,
      waterScore: score,
      status,
      trend,
      scarcityLevel: latest.scarcityLevel,
      groundwaterLevel: latest.groundwaterLevel,
    };
  });
}

/**
 * Get lightweight heatmap data [lat, lng, intensity] for map visualization.
 */
function getHeatmapData() {
  const latestMap = {};
  for (const d of waterData) {
    if (!latestMap[d.location] || d.year > latestMap[d.location].year) {
      latestMap[d.location] = d;
    }
  }

  return Object.values(latestMap).map(d => {
    const loc = locations.find(l => l.name === d.location);
    if (!loc) return null;
    // Intensity: invert water score so stressed areas glow hotter
    const score = calculateWaterScore(d);
    const intensity = Math.max(0.1, (100 - score) / 100);
    return {
      lat: loc.latitude,
      lng: loc.longitude,
      intensity: +intensity.toFixed(2),
      location: d.location,
      waterScore: score,
      status: getStatus(score),
    };
  }).filter(Boolean);
}

/**
 * Enhanced District Stats with trends, best/worst locations, average change rates.
 */
function getEnhancedDistrictStats() {
  const base = getDistrictStats();

  // Get rankings for best/worst
  const rankings = getRankings();
  const best5 = rankings.slice(0, 5).map(r => ({ location: r.location, score: r.waterScore, status: r.status }));
  const worst5 = rankings.slice(-5).reverse().map(r => ({ location: r.location, score: r.waterScore, status: r.status }));

  // Average YoY change across all locations
  let totalWLChange = 0, totalRFChange = 0, totalDPChange = 0, changeCount = 0;
  for (const loc of locations) {
    const records = getWaterByLocation(loc.name);
    if (records.length >= 2) {
      const first = records[0];
      const last = records[records.length - 1];
      totalWLChange += last.groundwaterLevel - first.groundwaterLevel;
      totalRFChange += last.rainfall - first.rainfall;
      totalDPChange += last.depletionRate - first.depletionRate;
      changeCount++;
    }
  }

  // Trend distribution
  let improving = 0, stable = 0, declining = 0;
  for (const r of rankings) {
    if (r.trend === 'improving') improving++;
    else if (r.trend === 'declining') declining++;
    else stable++;
  }

  // District trend direction
  let districtTrend = 'stable';
  if (declining > improving * 1.5) districtTrend = 'declining';
  else if (improving > declining * 1.5) districtTrend = 'improving';

  return {
    ...base,
    best5,
    worst5,
    districtTrend,
    trendDistribution: { improving, stable, declining },
    avgChangeRates: changeCount > 0 ? {
      waterLevel: +(totalWLChange / changeCount).toFixed(2),
      rainfall: +(totalRFChange / changeCount).toFixed(1),
      depletion: +(totalDPChange / changeCount).toFixed(2),
    } : null,
  };
}

module.exports = {
  loadData,
  addWaterData,
  enrichRecord,
  getWaterByLocation,
  getLatestByLocation,
  getAllLocations,
  getLocationByName,
  getOverviewData,
  getDistrictStats,
  getLocationSummary,
  getRankings,
  getYearlyChanges,
  getSearchSuggestions,
  getHeatmapData,
  getEnhancedDistrictStats,
};
