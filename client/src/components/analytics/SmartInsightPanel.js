import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FiAlertCircle, FiInfo, FiTrendingDown, FiTrendingUp, FiCheckCircle } from 'react-icons/fi';

/**
 * Auto-generate data-driven insights from water data trends.
 */
function generateInsights(data, predictions = []) {
  const insights = [];
  if (!data.length) return insights;

  const latest = data[data.length - 1];
  const n = data.length;

  // Water level trend
  if (n >= 2) {
    const prev = data[n - 2];
    const levelChange = latest.groundwaterLevel - prev.groundwaterLevel;
    const pctChange = ((levelChange / prev.groundwaterLevel) * 100).toFixed(1);
    if (levelChange > 0) {
      insights.push({
        type: 'warning',
        icon: <FiTrendingDown />,
        title: 'Water Level Declining',
        text: `Groundwater level increased by ${pctChange}% (deeper) from ${prev.year} to ${latest.year}. Higher values indicate deeper water tables and potential scarcity.`,
      });
    } else if (levelChange < 0) {
      insights.push({
        type: 'success',
        icon: <FiTrendingUp />,
        title: 'Water Level Improving',
        text: `Groundwater level decreased by ${Math.abs(pctChange)}% (shallower) from ${prev.year} to ${latest.year}, indicating improved water availability.`,
      });
    }
  }

  // Rainfall analysis
  if (n >= 2) {
    const avgRainfall = data.reduce((s, d) => s + d.rainfall, 0) / n;
    if (latest.rainfall < avgRainfall * 0.85) {
      insights.push({
        type: 'danger',
        icon: <FiAlertCircle />,
        text: `Rainfall in ${latest.year} (${latest.rainfall}mm) is ${((1 - latest.rainfall / avgRainfall) * 100).toFixed(0)}% below the average (${avgRainfall.toFixed(0)}mm). Low rainfall is strongly affecting groundwater levels.`,
        title: 'Below-Average Rainfall',
      });
    } else if (latest.rainfall > avgRainfall * 1.15) {
      insights.push({
        type: 'success',
        icon: <FiCheckCircle />,
        text: `Rainfall in ${latest.year} (${latest.rainfall}mm) is ${(((latest.rainfall / avgRainfall) - 1) * 100).toFixed(0)}% above average, potentially aiding groundwater recharge.`,
        title: 'Above-Average Rainfall',
      });
    }
  }

  // Depletion analysis
  if (latest.depletionRate >= 5) {
    insights.push({
      type: 'danger',
      icon: <FiAlertCircle />,
      title: 'High Depletion Rate',
      text: `Depletion rate of ${latest.depletionRate}% is critically high. This indicates over-extraction that may lead to severe water scarcity.`,
    });
  } else if (latest.depletionRate >= 3) {
    insights.push({
      type: 'warning',
      icon: <FiAlertCircle />,
      title: 'Moderate Depletion',
      text: `Depletion rate of ${latest.depletionRate}% is moderate. Conservation measures are recommended to prevent further decline.`,
    });
  }

  // Usage pattern analysis
  const totalUsage = (latest.agriculturalUsage || 0) + (latest.industrialUsage || 0) + (latest.householdUsage || 0);
  if (totalUsage > 0) {
    const agriPct = ((latest.agriculturalUsage / totalUsage) * 100).toFixed(0);
    if (agriPct > 60) {
      insights.push({
        type: 'info',
        icon: <FiInfo />,
        title: 'Agriculture-Dominant Usage',
        text: `Agricultural usage accounts for ${agriPct}% of total water consumption. Water levels are decreasing due to increased agricultural usage. Drip irrigation adoption could reduce consumption by 30-50%.`,
      });
    }
  }

  // pH analysis
  if (latest.ph) {
    if (latest.ph < 6.5) {
      insights.push({ type: 'warning', icon: <FiAlertCircle />, title: 'Acidic Water',
        text: `pH level of ${latest.ph} indicates acidic groundwater. This may affect drinking water quality and crop health.` });
    } else if (latest.ph > 8.5) {
      insights.push({ type: 'warning', icon: <FiAlertCircle />, title: 'Alkaline Water',
        text: `pH level of ${latest.ph} indicates alkaline groundwater. Treatment may be needed for domestic use.` });
    }
  }

  // Prediction insight
  if (predictions.length > 0) {
    const lastPred = predictions[predictions.length - 1];
    if (lastPred.groundwaterLevel > latest.groundwaterLevel * 1.1) {
      insights.push({
        type: 'danger',
        icon: <FiTrendingDown />,
        title: 'Declining Forecast',
        text: `Predictions suggest water levels may drop to ${lastPred.groundwaterLevel.toFixed(1)}m by ${lastPred.year}. Immediate conservation action needed.`,
      });
    }
  }

  // Overall score insight
  const score = latest.waterScore || 0;
  if (score >= 70) {
    insights.push({ type: 'success', icon: <FiCheckCircle />, title: 'Good Sustainability',
      text: `Water sustainability score of ${score}/100 indicates healthy groundwater conditions. Continue monitoring to maintain this level.` });
  } else if (score < 40) {
    insights.push({ type: 'danger', icon: <FiAlertCircle />, title: 'Critical Sustainability',
      text: `Water sustainability score of ${score}/100 is critically low. Urgent intervention required to prevent permanent groundwater damage.` });
  }

  return insights;
}

const typeStyles = {
  success: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-l-green-500', icon: 'text-green-500', badge: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  warning: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-l-yellow-500', icon: 'text-yellow-500', badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
  danger: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-l-red-500', icon: 'text-red-500', badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  info: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-l-blue-500', icon: 'text-blue-500', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
};

export default function SmartInsightPanel({ data = [], predictions = [] }) {
  const insights = useMemo(() => generateInsights(data, predictions), [data, predictions]);

  if (!insights.length) return null;

  return (
    <div className="glass-card p-5">
      <h3 className="section-title flex items-center gap-2">Smart Insights</h3>
      <p className="text-[11px] text-gray-400 -mt-3 mb-4">Auto-generated analysis based on data trends</p>

      <div className="space-y-3">
        {insights.map((insight, i) => {
          const style = typeStyles[insight.type] || typeStyles.info;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`${style.bg} ${style.border} border-l-4 rounded-xl p-4 flex gap-3`}
            >
              <div className={`text-xl mt-0.5 ${style.icon}`}>{insight.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{insight.title}</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${style.badge}`}>
                    {insight.type}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{insight.text}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
