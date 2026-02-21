const store = require('../dataStore');

/**
 * GET /api/locations
 */
exports.getAllLocations = (req, res, next) => {
  try {
    const { search, page = 1, limit = 200 } = req.query;
    const all = store.getAllLocations(search);
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const start = (pageNum - 1) * limitNum;
    const paginated = all.slice(start, start + limitNum);

    res.json({
      success: true,
      data: paginated,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: all.length,
        pages: Math.ceil(all.length / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/locations/:name
 */
exports.getLocationByName = (req, res, next) => {
  try {
    const location = store.getLocationByName(req.params.name);
    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }
    res.json({ success: true, data: location });
  } catch (err) {
    next(err);
  }
};
