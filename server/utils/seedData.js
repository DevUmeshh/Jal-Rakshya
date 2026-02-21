/**
 * Seed Script: Parse CSV and populate MongoDB
 * Run: npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const WaterData = require('../models/WaterData');
const Location = require('../models/Location');
const { parseCSV } = require('./csvParser');

// Approximate coordinates for Nashik-district locations
// Nashik city center: 19.9975, 73.7898
function generateCoordinates(locationName) {
  // Seed-based pseudo-random offset so each location has consistent coords
  let hash = 0;
  for (let i = 0; i < locationName.length; i++) {
    hash = (hash << 5) - hash + locationName.charCodeAt(i);
    hash |= 0;
  }
  const latOffset = ((hash % 500) / 500) * 0.8 - 0.4;    // ±0.4 degrees
  const lngOffset = (((hash >> 8) % 500) / 500) * 0.8 - 0.4;
  return {
    latitude: +(19.9975 + latOffset).toFixed(6),
    longitude: +(73.7898 + lngOffset).toFixed(6),
  };
}

async function seed() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jalrakshya';
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await WaterData.deleteMany({});
    await Location.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Parse CSV
    const csvPath = path.join(__dirname, '../../new_nsk_gwater.csv');
    const rows = await parseCSV(csvPath);
    console.log(`📄 Parsed ${rows.length} rows from CSV`);

    // Extract unique locations
    const uniqueLocations = [...new Set(rows.map((r) => r.location))];
    console.log(`📍 Found ${uniqueLocations.length} unique locations`);

    // Create location documents — use real lat/lng from CSV when available
    const locationDocs = uniqueLocations.map((name) => {
      const row = rows.find((r) => r.location === name);
      const coords = (row && row.latitude && row.longitude)
        ? { latitude: row.latitude, longitude: row.longitude }
        : generateCoordinates(name);
      return {
        name,
        ...coords,
        district: 'Nashik',
        state: 'Maharashtra',
      };
    });

    await Location.insertMany(locationDocs);
    console.log(`✅ Inserted ${locationDocs.length} locations`);

    // Insert water data (in batches of 100)
    const batchSize = 100;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      await WaterData.insertMany(batch, { ordered: false }).catch((err) => {
        // Handle duplicate key errors gracefully
        if (err.code !== 11000) throw err;
        console.log(`⚠️  Some duplicates skipped in batch ${Math.floor(i / batchSize) + 1}`);
      });
    }
    console.log(`✅ Inserted ${rows.length} water data records`);

    console.log('\n🎉 Database seeded successfully!');
    console.log(`   Locations: ${uniqueLocations.length}`);
    console.log(`   Records:   ${rows.length}`);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

seed();
