const NodeCache = require('node-cache');
const {
  calculateWaterScore, getStatus,
  predictFuture,
} = require('../utils/waterScore');
const { generateAlerts, generateGovUpdates, generateDistrictAlerts, generateDistrictGovUpdates } = require('../utils/alertEngine');
const store = require('../dataStore');

// Cache with 5-minute TTL
const cache = new NodeCache({ stdTTL: 300 });

/** Flush all cached responses (call after data mutations like CSV upload) */
exports.flushCache = () => cache.flushAll();

/**
 * GET /api/water/:location
 */
exports.getWaterDataByLocation = (req, res, next) => {
  try {
    const { location } = req.params;
    const cacheKey = `water_${location}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const data = store.getWaterByLocation(location);
    if (!data.length) {
      return res.status(404).json({ success: false, message: `No data found for location: ${location}` });
    }

    const enriched = data.map((d) => store.enrichRecord(d));
    const response = { success: true, data: enriched, count: enriched.length };
    cache.set(cacheKey, response);
    res.json(response);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/water/:location/latest
 */
exports.getLatestData = (req, res, next) => {
  try {
    const { location } = req.params;
    const data = store.getLatestByLocation(location);
    if (!data) {
      return res.status(404).json({ success: false, message: `No data found for location: ${location}` });
    }
    const enriched = store.enrichRecord(data);
    res.json({ success: true, data: enriched });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/water/:location/alerts
 * Now passes full history for trend-based alerts
 */
exports.getAlerts = (req, res, next) => {
  try {
    const { location } = req.params;
    const latest = store.getLatestByLocation(location);
    if (!latest) {
      return res.status(404).json({ success: false, message: 'No data found' });
    }
    const history = store.getWaterByLocation(location);
    const alerts = generateAlerts(latest, history);
    res.json({ success: true, alerts, count: alerts.length });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/water/district-alerts
 * District-wide alerts aggregated from all locations
 */
exports.getDistrictAlerts = (req, res, next) => {
  try {
    const cached = cache.get('district-alerts');
    if (cached) return res.json(cached);

    const overview = store.getOverviewData();
    const alerts = generateDistrictAlerts(overview);
    const result = { success: true, alerts, count: alerts.length };
    cache.set('district-alerts', result);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/water/district-gov-updates
 * District-wide government updates (not location-specific)
 */
exports.getDistrictGovUpdates = (req, res, next) => {
  try {
    const cached = cache.get('district-gov-updates');
    if (cached) return res.json(cached);

    const overview = store.getOverviewData();
    const updates = generateDistrictGovUpdates(overview);
    const result = { success: true, updates };
    cache.set('district-gov-updates', result);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/water/:location/gov-updates
 */
exports.getGovUpdates = (req, res, next) => {
  try {
    const { location } = req.params;
    const data = store.getWaterByLocation(location);
    if (!data.length) {
      return res.status(404).json({ success: false, message: 'No data found' });
    }
    const updates = generateGovUpdates(data);
    res.json({ success: true, updates });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/water/:location/predictions
 */
exports.getPredictions = (req, res, next) => {
  try {
    const { location } = req.params;
    const yearsAhead = parseInt(req.query.years) || 3;
    const data = store.getWaterByLocation(location);

    if (data.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Need at least 2 years of data for predictions',
      });
    }

    const predictions = predictFuture(data, yearsAhead);
    res.json({ success: true, predictions, basedOn: data.length });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/water/:location/summary
 */
exports.getLocationSummary = (req, res, next) => {
  try {
    const { location } = req.params;
    const summary = store.getLocationSummary(location);
    if (!summary) {
      return res.status(404).json({ success: false, message: `No data found for location: ${location}` });
    }
    res.json({ success: true, summary });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/water/:location/yearly-changes
 */
exports.getYearlyChanges = (req, res, next) => {
  try {
    const { location } = req.params;
    const changes = store.getYearlyChanges(location);
    res.json({ success: true, changes, count: changes.length });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/water/compare?loc1=X&loc2=Y
 */
exports.compareLocations = (req, res, next) => {
  try {
    const { loc1, loc2 } = req.query;
    if (!loc1 || !loc2) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both loc1 and loc2 query parameters',
      });
    }

    const data1 = store.getWaterByLocation(loc1);
    const data2 = store.getWaterByLocation(loc2);

    const enrich = (arr) => arr.map((d) => {
      const score = calculateWaterScore(d);
      return { ...d, waterScore: score, status: getStatus(score) };
    });

    res.json({
      success: true,
      comparison: {
        location1: { name: loc1, data: enrich(data1) },
        location2: { name: loc2, data: enrich(data2) },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/water/overview/all
 */
exports.getAllOverview = (req, res, next) => {
  try {
    const cacheKey = 'all_overview';
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const overview = store.getOverviewData();
    const response = { success: true, data: overview, count: overview.length };
    cache.set(cacheKey, response);
    res.json(response);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/water/stats/district
 */
exports.getDistrictStats = (req, res, next) => {
  try {
    const stats = store.getEnhancedDistrictStats();
    res.json({ success: true, stats });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/water/rankings
 */
exports.getRankings = (req, res, next) => {
  try {
    const cacheKey = 'rankings';
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const rankings = store.getRankings();
    const response = { success: true, rankings, count: rankings.length };
    cache.set(cacheKey, response);
    res.json(response);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/water/search-suggestions?q=...
 */
exports.getSearchSuggestions = (req, res, next) => {
  try {
    const { q } = req.query;
    const suggestions = store.getSearchSuggestions(q || '');
    res.json({ success: true, suggestions });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/water/heatmap-data
 */
exports.getHeatmapData = (req, res, next) => {
  try {
    const cacheKey = 'heatmap_data';
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const data = store.getHeatmapData();
    const response = { success: true, data, count: data.length };
    cache.set(cacheKey, response);
    res.json(response);
  } catch (err) {
    next(err);
  }
};
