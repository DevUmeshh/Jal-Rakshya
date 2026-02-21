const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

/**
 * Parse a CSV file and return rows as an array of objects
 */
function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    const fullPath = path.resolve(filePath);

    if (!fs.existsSync(fullPath)) {
      return reject(new Error(`CSV file not found: ${fullPath}`));
    }

    fs.createReadStream(fullPath)
      .pipe(csv())
      .on('data', (row) => {
        const cleaned = {
          location: (row['Location'] || '').trim(),
          year: parseInt(row['Year'], 10),
          consumption: parseFloat(row['Consumption (Ml)']) || 0,
          perCapitaUsage: parseFloat(row['Per Capita Water Usage (l/d)']) || 0,
          agriculturalUsage: parseFloat(row['Agricultural Water Usage (Ml)']) || 0,
          industrialUsage: parseFloat(row['Industrial Water Usage (Ml)']) || 0,
          householdUsage: parseFloat(row['Household Water Usage (Ml)']) || 0,
          rainfall: parseFloat(row['Rainfall (mm)']) || 0,
          depletionRate: parseFloat(row['Groundwater Depletion Rate (%)']) || 0,
          scarcityLevel: (row['Water Scarcity Level'] || 'Moderate').trim(),
          ph: parseFloat(row['pH']) || 7.0,
          groundwaterLevel: parseFloat(row['Groundwater Level (m)']) || 0,
          latitude: parseFloat(row['Latitude']) || null,
          longitude: parseFloat(row['Longitude']) || null,
          lastUpdated: new Date(),
        };

        if (cleaned.location && !isNaN(cleaned.year)) {
          results.push(cleaned);
        }
      })
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
}

module.exports = { parseCSV };
