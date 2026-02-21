const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/waterController');

// Overview, stats & global endpoints (MUST come before /:location params)
router.get('/overview/all', ctrl.getAllOverview);
router.get('/stats/district', ctrl.getDistrictStats);
router.get('/compare', ctrl.compareLocations);
router.get('/rankings', ctrl.getRankings);
router.get('/search-suggestions', ctrl.getSearchSuggestions);
router.get('/heatmap-data', ctrl.getHeatmapData);
router.get('/district-alerts', ctrl.getDistrictAlerts);
router.get('/district-gov-updates', ctrl.getDistrictGovUpdates);

// Location-specific
router.get('/:location', ctrl.getWaterDataByLocation);
router.get('/:location/latest', ctrl.getLatestData);
router.get('/:location/alerts', ctrl.getAlerts);
router.get('/:location/gov-updates', ctrl.getGovUpdates);
router.get('/:location/predictions', ctrl.getPredictions);
router.get('/:location/summary', ctrl.getLocationSummary);
router.get('/:location/yearly-changes', ctrl.getYearlyChanges);

module.exports = router;
