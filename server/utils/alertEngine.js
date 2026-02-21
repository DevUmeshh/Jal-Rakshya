/**
 * Dynamic Alert Engine
 * Generates context-aware alerts based on groundwater data thresholds.
 * Now supports trend-based alerts when full history is provided.
 */

const { calculateWaterScore } = require('./waterScore');

const ALERT_THRESHOLDS = {
  criticalWaterLevel: 15,       // meters - critical depth
  warningWaterLevel: 12,        // meters - warning depth
  highDepletion: 5,             // percentage
  criticalDepletion: 7,         // percentage
  lowRainfall: 700,             // mm
  criticalRainfall: 600,        // mm
  highPH: 8.0,
  lowPH: 6.5,
  highConsumption: 500,         // Ml
};

/**
 * Generate alerts for a given data record.
 * @param {Object} data - Latest water data record
 * @param {Array} [history] - Optional full history array for trend-based alerts
 */
function generateAlerts(data, history) {
  const alerts = [];
  const timestamp = new Date().toISOString();

  // Water Level Alerts
  if (data.groundwaterLevel >= ALERT_THRESHOLDS.criticalWaterLevel) {
    alerts.push({
      type: 'critical',
      category: 'Water Level',
      title: '🚨 Critical Water Level',
      message: `Groundwater level at ${data.groundwaterLevel}m depth in ${data.location}. Immediate action required.`,
      value: data.groundwaterLevel,
      threshold: ALERT_THRESHOLDS.criticalWaterLevel,
      recommendation: 'Implement water rationing and emergency recharge measures.',
      timestamp,
    });
  } else if (data.groundwaterLevel >= ALERT_THRESHOLDS.warningWaterLevel) {
    alerts.push({
      type: 'warning',
      category: 'Water Level',
      title: '⚠️ Low Water Table',
      message: `Water table at ${data.groundwaterLevel}m in ${data.location}. Monitor closely.`,
      value: data.groundwaterLevel,
      threshold: ALERT_THRESHOLDS.warningWaterLevel,
      recommendation: 'Increase monitoring frequency. Consider water conservation measures.',
      timestamp,
    });
  }

  // Depletion Alerts
  if (data.depletionRate >= ALERT_THRESHOLDS.criticalDepletion) {
    alerts.push({
      type: 'critical',
      category: 'Depletion',
      title: '🚨 Over-extraction Detected',
      message: `Groundwater depletion rate at ${data.depletionRate}% in ${data.location}. Aquifer stress is severe.`,
      value: data.depletionRate,
      threshold: ALERT_THRESHOLDS.criticalDepletion,
      recommendation: 'Restrict bore-well usage. Implement mandatory rainwater harvesting.',
      timestamp,
    });
  } else if (data.depletionRate >= ALERT_THRESHOLDS.highDepletion) {
    alerts.push({
      type: 'warning',
      category: 'Depletion',
      title: '⚠️ High Depletion Rate',
      message: `Depletion rate ${data.depletionRate}% in ${data.location}. Extraction exceeds recharge.`,
      value: data.depletionRate,
      threshold: ALERT_THRESHOLDS.highDepletion,
      recommendation: 'Promote water-efficient irrigation. Review extraction permits.',
      timestamp,
    });
  }

  // Rainfall Alerts
  if (data.rainfall <= ALERT_THRESHOLDS.criticalRainfall) {
    alerts.push({
      type: 'critical',
      category: 'Rainfall',
      title: '🚨 Drought Risk',
      message: `Rainfall only ${data.rainfall}mm in ${data.location}. Severe drought conditions likely.`,
      value: data.rainfall,
      threshold: ALERT_THRESHOLDS.criticalRainfall,
      recommendation: 'Activate drought contingency plans. Arrange water tanker supply.',
      timestamp,
    });
  } else if (data.rainfall <= ALERT_THRESHOLDS.lowRainfall) {
    alerts.push({
      type: 'warning',
      category: 'Rainfall',
      title: '⚠️ Below Normal Rainfall',
      message: `Rainfall ${data.rainfall}mm in ${data.location}, below expected levels.`,
      value: data.rainfall,
      threshold: ALERT_THRESHOLDS.lowRainfall,
      recommendation: 'Monitor reservoir levels. Advise farmers on drought-resistant crops.',
      timestamp,
    });
  }

  // pH Alerts
  if (data.ph >= ALERT_THRESHOLDS.highPH || data.ph <= ALERT_THRESHOLDS.lowPH) {
    alerts.push({
      type: 'warning',
      category: 'Water Quality',
      title: '⚠️ pH Imbalance',
      message: `pH level ${data.ph} in ${data.location}. Water quality may be affected.`,
      value: data.ph,
      threshold: `${ALERT_THRESHOLDS.lowPH}-${ALERT_THRESHOLDS.highPH}`,
      recommendation: 'Test for contaminants. Advise water treatment before consumption.',
      timestamp,
    });
  }

  // Consumption Alert
  if (data.consumption >= ALERT_THRESHOLDS.highConsumption) {
    alerts.push({
      type: 'info',
      category: 'Consumption',
      title: 'ℹ️ High Water Consumption',
      message: `Total consumption ${data.consumption} Ml in ${data.location}. Above district average.`,
      value: data.consumption,
      threshold: ALERT_THRESHOLDS.highConsumption,
      recommendation: 'Review industrial and agricultural water permits. Promote efficiency.',
      timestamp,
    });
  }

  // Scarcity Level Alert
  if (data.scarcityLevel === 'Severe' || data.scarcityLevel === 'Extreme') {
    alerts.push({
      type: 'critical',
      category: 'Scarcity',
      title: `🚨 ${data.scarcityLevel} Water Scarcity`,
      message: `${data.location} classified as ${data.scarcityLevel} water scarcity zone.`,
      value: data.scarcityLevel,
      recommendation: 'Prioritize for government water supply augmentation schemes.',
      timestamp,
    });
  }

  // ===== TREND-BASED ALERTS (require history) =====
  if (history && history.length >= 3) {
    const sorted = [...history].sort((a, b) => a.year - b.year);

    // Consecutive decline in water level (rising depth) for 3+ years
    let consecutiveRise = 0;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].groundwaterLevel > sorted[i - 1].groundwaterLevel) {
        consecutiveRise++;
      } else {
        consecutiveRise = 0;
      }
    }
    if (consecutiveRise >= 3) {
      const totalRise = sorted[sorted.length - 1].groundwaterLevel - sorted[sorted.length - 1 - consecutiveRise].groundwaterLevel;
      alerts.push({
        type: 'warning',
        category: 'Trend',
        title: '📉 Sustained Water Level Decline',
        message: `Water level in ${data.location} has been dropping for ${consecutiveRise} consecutive years (${totalRise.toFixed(1)}m increase in depth).`,
        value: consecutiveRise,
        recommendation: 'Long-term recharge intervention needed. Consider artificial recharge structures.',
        timestamp,
      });
    }

    // Steady depletion increase over 3+ years
    let consecutiveDepIncrease = 0;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].depletionRate > sorted[i - 1].depletionRate) {
        consecutiveDepIncrease++;
      } else {
        consecutiveDepIncrease = 0;
      }
    }
    if (consecutiveDepIncrease >= 3) {
      alerts.push({
        type: 'critical',
        category: 'Trend',
        title: '📊 Accelerating Depletion Trend',
        message: `Depletion rate in ${data.location} has increased for ${consecutiveDepIncrease} consecutive years. Current: ${data.depletionRate}%.`,
        value: consecutiveDepIncrease,
        recommendation: 'Urgent policy intervention needed. Restrict new extraction permits.',
        timestamp,
      });
    }

    // Declining rainfall pattern
    let consecutiveRainfallDrop = 0;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].rainfall < sorted[i - 1].rainfall) {
        consecutiveRainfallDrop++;
      } else {
        consecutiveRainfallDrop = 0;
      }
    }
    if (consecutiveRainfallDrop >= 3) {
      alerts.push({
        type: 'warning',
        category: 'Trend',
        title: '🌧️ Declining Rainfall Pattern',
        message: `Rainfall in ${data.location} has decreased for ${consecutiveRainfallDrop} consecutive years. Long-term drought risk elevated.`,
        value: consecutiveRainfallDrop,
        recommendation: 'Plan for drought resilience. Increase water storage capacity.',
        timestamp,
      });
    }

    // Overall score deterioration
    const scores = sorted.map(d => calculateWaterScore(d));
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));
    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    if (avgSecond < avgFirst - 10) {
      alerts.push({
        type: 'warning',
        category: 'Trend',
        title: '⚡ Overall Water Health Declining',
        message: `Water health score in ${data.location} has declined significantly (avg ${Math.round(avgFirst)} → ${Math.round(avgSecond)}) over the monitoring period.`,
        value: Math.round(avgSecond - avgFirst),
        recommendation: 'Comprehensive water management review recommended for this location.',
        timestamp,
      });
    }
  }

  return alerts;
}

/**
 * Generate government-style updates
 */
function generateGovUpdates(locationData) {
  const latest = locationData[locationData.length - 1];
  if (!latest) return [];

  const updates = [
    {
      id: 1,
      title: 'Groundwater Status Report',
      body: `Current groundwater level in ${latest.location} stands at ${latest.groundwaterLevel}m. Depletion rate: ${latest.depletionRate}%. Classification: ${latest.scarcityLevel}.`,
      date: new Date().toLocaleDateString('en-IN'),
      source: 'Central Ground Water Board',
      priority: latest.scarcityLevel === 'Severe' || latest.scarcityLevel === 'Extreme' ? 'high' : 'normal',
    },
    {
      id: 2,
      title: 'Rainfall Monitoring Update',
      body: `Annual rainfall recorded: ${latest.rainfall}mm. ${latest.rainfall < 700 ? 'Below normal levels. Drought alert issued.' : 'Within normal range.'}`,
      date: new Date().toLocaleDateString('en-IN'),
      source: 'India Meteorological Department',
      priority: latest.rainfall < 700 ? 'high' : 'normal',
    },
    {
      id: 3,
      title: 'Water Quality Assessment',
      body: `pH level: ${latest.ph}. ${latest.ph >= 6.5 && latest.ph <= 8.0 ? 'Water quality is within acceptable BIS standards.' : 'Water quality needs attention.'}`,
      date: new Date().toLocaleDateString('en-IN'),
      source: 'State Pollution Control Board',
      priority: 'normal',
    },
    {
      id: 4,
      title: 'Usage Distribution Report',
      body: `Agricultural: ${latest.agriculturalUsage} Ml | Industrial: ${latest.industrialUsage} Ml | Household: ${latest.householdUsage} Ml. Total consumption: ${latest.consumption} Ml.`,
      date: new Date().toLocaleDateString('en-IN'),
      source: 'Nashik District Water Authority',
      priority: 'normal',
    },
    {
      id: 5,
      title: 'Jal Shakti Abhiyan Advisory',
      body: `Under the National Jal Jeevan Mission, ${latest.location} is ${latest.scarcityLevel === 'High' || latest.scarcityLevel === 'Severe' ? 'marked for priority intervention. Community rainwater harvesting programs recommended.' : 'under regular monitoring. Continue existing conservation measures.'}`,
      date: new Date().toLocaleDateString('en-IN'),
      source: 'Ministry of Jal Shakti',
      priority: latest.scarcityLevel === 'High' || latest.scarcityLevel === 'Severe' ? 'high' : 'normal',
    },
  ];

  return updates;
}

/**
 * Generate district-wide alerts by aggregating top critical alerts across all locations
 */
function generateDistrictAlerts(overviewData) {
  const alerts = [];
  const timestamp = new Date().toISOString();

  if (!overviewData || !overviewData.length) return alerts;

  // Count critical/warning locations
  const criticalLocs = overviewData.filter(d => d.status === 'Critical');
  const warningLocs = overviewData.filter(d => d.status === 'Warning');
  const avgDepletion = overviewData.reduce((s, d) => s + (d.depletionRate || 0), 0) / overviewData.length;
  const avgRainfall = overviewData.reduce((s, d) => s + (d.rainfall || 0), 0) / overviewData.length;
  const avgWaterLevel = overviewData.reduce((s, d) => s + (d.groundwaterLevel || 0), 0) / overviewData.length;
  const lowRainfallLocs = overviewData.filter(d => (d.rainfall || 0) < 700);
  const highDepletionLocs = overviewData.filter(d => (d.depletionRate || 0) >= 5);

  // District-wide critical count
  if (criticalLocs.length > 0) {
    alerts.push({
      type: 'critical',
      category: 'District Overview',
      title: '\uD83D\uDEA8 Critical Zones Detected',
      message: `${criticalLocs.length} out of ${overviewData.length} monitoring stations are in Critical status across Nashik District.`,
      value: criticalLocs.length,
      threshold: 0,
      recommendation: `Priority locations: ${criticalLocs.slice(0, 3).map(d => d.location).join(', ')}${criticalLocs.length > 3 ? ` and ${criticalLocs.length - 3} more` : ''}.`,
      timestamp,
    });
  }

  // District-wide warning count
  if (warningLocs.length > 5) {
    alerts.push({
      type: 'warning',
      category: 'District Overview',
      title: '\u26A0\uFE0F Widespread Warning Status',
      message: `${warningLocs.length} stations are under Warning status. District-wide water conservation advisory in effect.`,
      value: warningLocs.length,
      threshold: 5,
      recommendation: 'Increase monitoring frequency at warning-level stations.',
      timestamp,
    });
  }

  // Average depletion alert
  if (avgDepletion >= ALERT_THRESHOLDS.highDepletion) {
    alerts.push({
      type: avgDepletion >= ALERT_THRESHOLDS.criticalDepletion ? 'critical' : 'warning',
      category: 'Depletion',
      title: '\uD83D\uDCC9 High District Depletion Rate',
      message: `Average groundwater depletion across Nashik District is ${avgDepletion.toFixed(1)}%. ${highDepletionLocs.length} stations exceed 5% depletion.`,
      value: avgDepletion,
      threshold: ALERT_THRESHOLDS.highDepletion,
      recommendation: 'District-level water recharge programs need acceleration.',
      timestamp,
    });
  }

  // Rainfall deficit
  if (avgRainfall < ALERT_THRESHOLDS.lowRainfall) {
    alerts.push({
      type: avgRainfall < ALERT_THRESHOLDS.criticalRainfall ? 'critical' : 'warning',
      category: 'Rainfall',
      title: '\uD83C\uDF27\uFE0F District Rainfall Deficit',
      message: `Average rainfall is ${avgRainfall.toFixed(0)}mm — ${lowRainfallLocs.length} stations report below-normal rainfall.`,
      value: avgRainfall,
      threshold: ALERT_THRESHOLDS.lowRainfall,
      recommendation: 'Activate drought mitigation protocols for affected talukas.',
      timestamp,
    });
  }

  // Water level warning
  if (avgWaterLevel >= ALERT_THRESHOLDS.warningWaterLevel) {
    alerts.push({
      type: avgWaterLevel >= ALERT_THRESHOLDS.criticalWaterLevel ? 'critical' : 'warning',
      category: 'Water Level',
      title: '\uD83D\uDCA7 Deep Water Table Alert',
      message: `Average groundwater depth across the district is ${avgWaterLevel.toFixed(1)}m. Multiple areas require intervention.`,
      value: avgWaterLevel,
      threshold: ALERT_THRESHOLDS.warningWaterLevel,
      recommendation: 'Prioritize artificial recharge projects in deep water-table zones.',
      timestamp,
    });
  }

  // Info: overall health
  const avgScore = overviewData.reduce((s, d) => s + (d.waterScore || 50), 0) / overviewData.length;
  alerts.push({
    type: 'info',
    category: 'District Health',
    title: '\uD83D\uDCCA District Water Health Index',
    message: `Average water health score across ${overviewData.length} stations: ${avgScore.toFixed(0)}/100. Safe: ${overviewData.filter(d => d.status === 'Safe').length} | Warning: ${warningLocs.length} | Critical: ${criticalLocs.length}.`,
    value: avgScore,
    recommendation: 'Continue monitoring. Review individual station reports for detailed insights.',
    timestamp,
  });

  return alerts;
}

/**
 * Generate district-wide government updates (not location-specific)
 */
function generateDistrictGovUpdates(overviewData) {
  if (!overviewData || !overviewData.length) return [];

  const n = overviewData.length;
  const criticalCount = overviewData.filter(d => d.status === 'Critical').length;
  const warningCount = overviewData.filter(d => d.status === 'Warning').length;
  const safeCount = overviewData.filter(d => d.status === 'Safe').length;
  const avgDepletion = (overviewData.reduce((s, d) => s + (d.depletionRate || 0), 0) / n).toFixed(1);
  const avgRainfall = (overviewData.reduce((s, d) => s + (d.rainfall || 0), 0) / n).toFixed(0);
  const avgWaterLevel = (overviewData.reduce((s, d) => s + (d.groundwaterLevel || 0), 0) / n).toFixed(1);
  const avgPH = (overviewData.reduce((s, d) => s + (d.ph || 7), 0) / n).toFixed(1);
  const today = new Date().toLocaleDateString('en-IN');

  return [
    {
      id: 1,
      title: 'Nashik District Groundwater Status',
      body: `Across ${n} monitoring stations: ${safeCount} Safe, ${warningCount} Warning, ${criticalCount} Critical. Average water table depth: ${avgWaterLevel}m. District depletion rate: ${avgDepletion}%.`,
      date: today,
      source: 'Central Ground Water Board',
      priority: criticalCount > 10 ? 'high' : 'normal',
    },
    {
      id: 2,
      title: 'District Rainfall Summary',
      body: `Average annual rainfall across Nashik District: ${avgRainfall}mm. ${avgRainfall < 700 ? 'Below normal — drought advisory active for affected talukas.' : 'Within normal range for the region.'}`,
      date: today,
      source: 'India Meteorological Department',
      priority: avgRainfall < 700 ? 'high' : 'normal',
    },
    {
      id: 3,
      title: 'Water Quality Report — District Average',
      body: `Average pH across all stations: ${avgPH}. ${avgPH >= 6.5 && avgPH <= 8.0 ? 'District water quality is within BIS acceptable limits.' : 'Some areas show pH outside acceptable range — monitoring advised.'}`,
      date: today,
      source: 'State Pollution Control Board',
      priority: 'normal',
    },
    {
      id: 4,
      title: 'Jal Jeevan Mission — Nashik Progress',
      body: `${criticalCount + warningCount} stations require priority intervention under the National Jal Jeevan Mission. Community rainwater harvesting and recharge programs are being expanded across the district.`,
      date: today,
      source: 'Ministry of Jal Shakti',
      priority: criticalCount > 5 ? 'high' : 'normal',
    },
    {
      id: 5,
      title: 'Conservation Advisory',
      body: `Nashik District water conservation drive ongoing. Citizens advised to reduce non-essential water usage. Report water wastage to local gram panchayat offices.`,
      date: today,
      source: 'Nashik District Collector Office',
      priority: 'normal',
    },
  ];
}

module.exports = { generateAlerts, generateGovUpdates, generateDistrictAlerts, generateDistrictGovUpdates, ALERT_THRESHOLDS };
