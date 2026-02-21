import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBookOpen, FiX, FiAlertTriangle, FiTrendingDown, FiCheckCircle, FiDroplet } from 'react-icons/fi';

/**
 * Story Mode — "Explain Data" button that shows a narrative summary panel
 * with key trends, risk level, and recommendations.
 */
export default function StoryMode({ data = [], predictions = [], locationName = '' }) {
  const [open, setOpen] = useState(false);

  const story = useMemo(() => {
    if (!data.length) return null;
    const latest = data[data.length - 1];
    const first = data[0];
    const n = data.length;

    // Calculate trends
    const levelTrend = n >= 2 ? latest.groundwaterLevel - first.groundwaterLevel : 0;
    const rainfallTrend = n >= 2 ? latest.rainfall - first.rainfall : 0;
    const deplTrend = n >= 2 ? latest.depletionRate - first.depletionRate : 0;

    const score = latest.waterScore || 0;
    const riskLevel = score >= 70 ? 'Low' : score >= 40 ? 'Moderate' : 'High';
    const riskColor = score >= 70 ? 'green' : score >= 40 ? 'yellow' : 'red';

    // Build narrative sections
    const sections = [];

    // Summary
    sections.push({
      icon: <FiDroplet />,
      title: 'Overview',
      content: `Analysis of ${n} years of groundwater data (${first.year}–${latest.year}) for ${locationName}. Current water sustainability score is ${score}/100 (${latest.status}).`,
    });

    // Key trends
    const trends = [];
    if (levelTrend > 0) trends.push(`Water table has deepened by ${Math.abs(levelTrend).toFixed(1)}m, indicating declining groundwater availability.`);
    else if (levelTrend < 0) trends.push(`Water table has risen by ${Math.abs(levelTrend).toFixed(1)}m, showing improved recharge.`);
    if (rainfallTrend < -30) trends.push(`Rainfall has declined by ${Math.abs(rainfallTrend).toFixed(0)}mm over the period, contributing to water stress.`);
    else if (rainfallTrend > 30) trends.push(`Rainfall has increased by ${rainfallTrend.toFixed(0)}mm, supporting groundwater recharge.`);
    if (deplTrend > 0.5) trends.push(`Depletion rate has increased by ${deplTrend.toFixed(1)}%, signaling over-extraction.`);

    if (trends.length) {
      sections.push({ icon: <FiTrendingDown />, title: 'Key Trends', content: trends.join(' ') });
    }

    // Risk assessment
    const risks = [];
    if (latest.depletionRate >= 5) risks.push('Severe groundwater depletion exceeding 5% annual rate.');
    if (latest.rainfall < 700) risks.push('Low annual rainfall below 700mm limiting natural recharge.');
    if (latest.ph < 6.5 || latest.ph > 8.5) risks.push(`pH level of ${latest.ph} outside safe range (6.5–8.5).`);
    const totalUsage = (latest.agriculturalUsage || 0) + (latest.industrialUsage || 0) + (latest.householdUsage || 0);
    if (totalUsage > 0 && latest.agriculturalUsage / totalUsage > 0.6) {
      risks.push(`Agriculture accounts for ${((latest.agriculturalUsage / totalUsage) * 100).toFixed(0)}% of water usage.`);
    }

    if (risks.length) {
      sections.push({ icon: <FiAlertTriangle />, title: 'Risk Factors', content: risks.join(' ') });
    }

    // Recommendations
    const recs = [];
    if (latest.depletionRate >= 4) recs.push('Implement immediate water extraction limits and enforce well registration.');
    if (latest.rainfall < 750) recs.push('Invest in rainwater harvesting infrastructure and artificial recharge pits.');
    if (totalUsage > 0 && latest.agriculturalUsage / totalUsage > 0.5) {
      recs.push('Promote micro-irrigation (drip/sprinkler) to reduce agricultural water consumption by 30–50%.');
    }
    recs.push('Establish community-based groundwater monitoring committees.');
    if (score < 50) recs.push('Declare water-stressed zone and activate government water conservation schemes.');
    recs.push('Continue regular water quality testing and public awareness campaigns.');

    sections.push({ icon: <FiCheckCircle />, title: 'Recommendations', content: recs.join(' ') });

    // Prediction summary
    if (predictions.length) {
      const lastPred = predictions[predictions.length - 1];
      sections.push({
        icon: <FiTrendingDown />,
        title: 'Future Outlook',
        content: `Based on linear regression, by ${lastPred.year} the water level may reach ${lastPred.groundwaterLevel?.toFixed(1)}m with rainfall around ${lastPred.rainfall?.toFixed(0)}mm. ${
          lastPred.groundwaterLevel > latest.groundwaterLevel * 1.05
            ? 'The declining trend requires urgent intervention.'
            : 'The situation appears relatively stable if conservation continues.'
        }`,
      });
    }

    return { sections, riskLevel, riskColor, score };
  }, [data, predictions, locationName]);

  if (!data.length) return null;

  return (
    <>
      {/* Trigger button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className="btn-primary flex items-center gap-2 shadow-lg"
      >
        <FiBookOpen size={16} /> Explain Data
      </motion.button>

      {/* Modal overlay */}
      <AnimatePresence>
        {open && story && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card w-full max-w-2xl max-h-[85vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    Data Story — {locationName}
                  </h2>
                  <p className="text-xs text-gray-400">AI-generated narrative analysis</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
                    story.riskColor === 'green' ? 'bg-green-500' :
                    story.riskColor === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}>
                    Risk: {story.riskLevel}
                  </span>
                  <button
                    onClick={() => setOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <FiX size={18} className="text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-5 space-y-5">
                {story.sections.map((section, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 flex-shrink-0 mt-0.5">
                      {section.icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">{section.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{section.content}</p>
                    </div>
                  </motion.div>
                ))}

                {/* Score summary */}
                <div className="bg-gradient-to-r from-primary-50 to-teal-50 dark:from-primary-900/20 dark:to-teal-900/20 rounded-xl p-5 text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Overall Assessment</p>
                  <p className="text-4xl font-extrabold text-primary-600">{story.score}<span className="text-lg text-gray-400">/100</span></p>
                  <p className="text-sm text-gray-500 mt-1">
                    {story.score >= 70 ? 'Groundwater conditions are currently healthy. Maintain monitoring.' :
                     story.score >= 40 ? 'Groundwater is under moderate stress. Conservation measures recommended.' :
                     'Groundwater is in critical condition. Immediate action required.'}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 text-center">
                <p className="text-[10px] text-gray-400">
                  Generated on {new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })} | JalRakshya Story Engine
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
