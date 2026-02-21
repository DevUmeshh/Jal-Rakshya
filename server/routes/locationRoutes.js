const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/locationController');

router.get('/', ctrl.getAllLocations);
router.get('/:name', ctrl.getLocationByName);

module.exports = router;
