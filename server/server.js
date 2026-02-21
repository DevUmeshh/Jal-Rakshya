require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { loadData } = require('./dataStore');

const waterRoutes = require('./routes/waterRoutes');
const locationRoutes = require('./routes/locationRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// API Routes
app.use('/api/water', waterRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve static files in production (skip on Vercel — it handles static files)
if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Load CSV data into memory, then start server
const PORT = process.env.PORT || 5000;

// Track whether data is loaded (for serverless cold starts)
let dataLoaded = false;
app._ensureData = async () => {
  if (!dataLoaded) {
    await loadData();
    dataLoaded = true;
  }
};

// Only listen when run directly (not when imported by Vercel)
if (require.main === module) {
  loadData()
    .then(() => {
      dataLoaded = true;
      app.listen(PORT, () => {
        console.log(`🚀 JalRakshya Server running on port ${PORT}`);
        console.log(`📊 API available at http://localhost:${PORT}/api`);
      });
    })
    .catch((err) => {
      console.error('❌ Startup error:', err.message);
      process.exit(1);
    });
}

module.exports = app;
