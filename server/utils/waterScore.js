/**
 * Water Score Calculation Engine
 * Normalizes groundwater metrics into a 0–100 score.
 */

const THRESHOLDS = {
  waterLevel: { min: 4, max: 20 },    // meters below ground
  rainfall: { min: 500, max: 1500 },   // mm
  depletion: { min: 0, max: 10 },      // percentage
  ph: { ideal: 7.0, range: 1.5 },      // ideal pH ± range
};

/**
 * Normalize a value to 0–100 range
 */
function normalize(value, min, max, invert = false) {
  const clamped = Math.max(min, Math.min(max, value));
  const normalized = ((clamped - min) / (max - min)) * 100;
  return invert ? 100 - normalized : normalized;
}

/**
 * Calculate Water Score (0–100)
 * Higher is better
 */
function calculateWaterScore(data) {
  // Water level: lower is better (closer to surface = more water)
  const waterLevelScore = normalize(
    data.groundwaterLevel,
    THRESHOLDS.waterLevel.min,
    THRESHOLDS.waterLevel.max,
    true // invert: lower depth = better
  );

  // Rainfall: higher is better
  const rainfallScore = normalize(
    data.rainfall,
    THRESHOLDS.rainfall.min,
    THRESHOLDS.rainfall.max,
    false
  );

  // Depletion: lower is better
  const depletionScore = normalize(
    data.depletionRate,
    THRESHOLDS.depletion.min,
    THRESHOLDS.depletion.max,
    true // invert: lower depletion = better
  );

  // pH: closer to 7 is better
  const phDeviation = Math.abs(data.ph - THRESHOLDS.ph.ideal);
  const phScore = normalize(phDeviation, 0, THRESHOLDS.ph.range, true);

  // Weighted average
  const score =
    waterLevelScore * 0.35 +
    rainfallScore * 0.25 +
    depletionScore * 0.30 +
    phScore * 0.10;

  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Get status from score
 */
function getStatus(score) {
  if (score >= 70) return 'Safe';
  if (score >= 40) return 'Warning';
  return 'Critical';
}

/**
 * Get status color
 */
function getStatusColor(score) {
  if (score >= 70) return '#22c55e'; // green
  if (score >= 40) return '#eab308'; // yellow
  return '#ef4444'; // red
}

/**
 * Calculate Water Quality Index (pH-based)
 */
function calculateWQI(ph) {
  const deviation = Math.abs(ph - 7.0);
  if (deviation <= 0.5) return { index: 'Excellent', value: 95 };
  if (deviation <= 1.0) return { index: 'Good', value: 75 };
  if (deviation <= 1.5) return { index: 'Fair', value: 55 };
  return { index: 'Poor', value: 30 };
}

/**
 * Calculate Depletion Index
 */
function calculateDepletionIndex(depletionRate) {
  if (depletionRate <= 2) return { index: 'Sustainable', value: 90 };
  if (depletionRate <= 4) return { index: 'Moderate', value: 65 };
  if (depletionRate <= 6) return { index: 'Concerning', value: 40 };
  return { index: 'Critical', value: 15 };
}

/**
 * Calculate Sustainability Score
 */
function calculateSustainabilityScore(data) {
  const rechargeCapacity = normalize(data.rainfall, 500, 1500, false) * 0.4;
  const extractionImpact = normalize(data.depletionRate, 0, 10, true) * 0.35;
  const qualityFactor = normalize(Math.abs(data.ph - 7.0), 0, 1.5, true) * 0.25;
  return Math.round(rechargeCapacity + extractionImpact + qualityFactor);
}

/**
 * Simple linear regression for prediction
 */
function linearRegression(points) {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (const { x, y } of points) {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

/**
 * Predict future values using linear regression with confidence intervals.
 */
function predictFuture(historicalData, yearsAhead = 3) {
  const waterLevelPoints = historicalData.map((d) => ({
    x: d.year,
    y: d.groundwaterLevel,
  }));
  const rainfallPoints = historicalData.map((d) => ({
    x: d.year,
    y: d.rainfall,
  }));
  const depletionPoints = historicalData.map((d) => ({
    x: d.year,
    y: d.depletionRate,
  }));

  const wlReg = linearRegression(waterLevelPoints);
  const rfReg = linearRegression(rainfallPoints);
  const dpReg = linearRegression(depletionPoints);

  // Calculate residual standard errors for confidence intervals
  const wlResiduals = calcResidualStdError(waterLevelPoints, wlReg);
  const rfResiduals = calcResidualStdError(rainfallPoints, rfReg);
  const dpResiduals = calcResidualStdError(depletionPoints, dpReg);

  const lastYear = Math.max(...historicalData.map((d) => d.year));
  const predictions = [];

  for (let i = 1; i <= yearsAhead; i++) {
    const year = lastYear + i;
    // Confidence widens with distance from data
    const confidenceMultiplier = 1.96 * Math.sqrt(1 + 1 / historicalData.length + (i * i) / (historicalData.length * 3));

    const wlPred = +(wlReg.slope * year + wlReg.intercept).toFixed(2);
    const rfPred = +(rfReg.slope * year + rfReg.intercept).toFixed(1);
    const dpPred = +(dpReg.slope * year + dpReg.intercept).toFixed(2);

    predictions.push({
      year,
      groundwaterLevel: Math.max(0, wlPred),
      groundwaterLevelCI: {
        lower: Math.max(0, +(wlPred - wlResiduals * confidenceMultiplier).toFixed(2)),
        upper: +(wlPred + wlResiduals * confidenceMultiplier).toFixed(2),
      },
      rainfall: Math.max(0, rfPred),
      rainfallCI: {
        lower: Math.max(0, +(rfPred - rfResiduals * confidenceMultiplier).toFixed(1)),
        upper: +(rfPred + rfResiduals * confidenceMultiplier).toFixed(1),
      },
      depletionRate: Math.max(0, dpPred),
      depletionRateCI: {
        lower: Math.max(0, +(dpPred - dpResiduals * confidenceMultiplier).toFixed(2)),
        upper: +(dpPred + dpResiduals * confidenceMultiplier).toFixed(2),
      },
      confidenceLevel: i <= 1 ? 'high' : i <= 2 ? 'medium' : 'low',
    });
  }

  return predictions;
}

/**
 * Calculate residual standard error from regression
 */
function calcResidualStdError(points, reg) {
  if (points.length < 3) return 0;
  const residuals = points.map(p => {
    const predicted = reg.slope * p.x + reg.intercept;
    return (p.y - predicted) ** 2;
  });
  const sse = residuals.reduce((a, b) => a + b, 0);
  return Math.sqrt(sse / (points.length - 2));
}

module.exports = {
  calculateWaterScore,
  getStatus,
  getStatusColor,
  calculateWQI,
  calculateDepletionIndex,
  calculateSustainabilityScore,
  predictFuture,
  normalize,
  linearRegression,
};
