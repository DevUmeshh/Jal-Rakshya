const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { parseCSV } = require('../utils/csvParser');
const store = require('../dataStore');
const { flushCache } = require('../controllers/waterController');

// On Vercel, use /tmp (read-only filesystem except /tmp); locally use data/
const dataDir = process.env.VERCEL
  ? '/tmp'
  : path.join(__dirname, '../../data');
if (!process.env.VERCEL && !fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Configure multer for CSV upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dataDir),
  filename: (req, file, cb) => cb(null, `upload_${Date.now()}.csv`),
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

/**
 * POST /api/upload/csv
 * Upload and ingest a CSV file into in-memory store
 */
router.post('/csv', upload.single('csvFile'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No CSV file uploaded' });
    }

    const rows = await parseCSV(req.file.path);

    if (!rows.length) {
      return res.status(400).json({ success: false, message: 'CSV file is empty or malformatted' });
    }

    // Add to in-memory store & flush stale cache
    store.addWaterData(rows);
    flushCache();
    const uniqueLocations = [...new Set(rows.map((r) => r.location))];

    res.json({
      success: true,
      message: `CSV processed: ${rows.length} records ingested`,
      details: { totalRows: rows.length, locations: uniqueLocations.length },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
