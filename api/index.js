/**
 * Vercel Serverless Function Entry Point
 * Wraps the entire Express app as a single serverless function
 */
const app = require('../server/server');

// Ensure CSV data is loaded on cold start
module.exports = async (req, res) => {
  await app._ensureData();
  return app(req, res);
};
