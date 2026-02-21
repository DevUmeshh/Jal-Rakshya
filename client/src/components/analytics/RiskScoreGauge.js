import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Animated Gauge/Speedometer component for Water Risk Score.
 * Score:
 *   0–40 = Critical (Red)
 *  40–70 = Moderate (Yellow)
 *  70–100 = Good (Green)
 */
export default function RiskScoreGauge({ score = 0, size = 220, label = 'Water Sustainability Score' }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const canvasRef = useRef(null);

  useEffect(() => {
    let frame;
    const target = Math.min(100, Math.max(0, score));
    const duration = 1200;
    const start = performance.now();
    const from = 0;

    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = from + (target - from) * eased;
      setAnimatedScore(current);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = size;
    const h = size * 0.65;
    const cx = w / 2;
    const cy = h - 15;
    const r = w / 2 - 25;

    canvas.width = w * 2;
    canvas.height = h * 2;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(2, 2);
    ctx.clearRect(0, 0, w, h);

    // Draw arc segments
    const startAngle = Math.PI;
    const endAngle = 2 * Math.PI;

    const segments = [
      { start: 0, end: 0.4, color: '#ef4444' },   // Critical
      { start: 0.4, end: 0.7, color: '#eab308' },  // Moderate
      { start: 0.7, end: 1.0, color: '#22c55e' },   // Good
    ];

    // Background track
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.strokeStyle = 'rgba(148,163,184,0.15)';
    ctx.lineWidth = 18;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Segment arcs
    segments.forEach(({ start, end, color }) => {
      ctx.beginPath();
      const a1 = startAngle + start * Math.PI;
      const a2 = startAngle + end * Math.PI;
      ctx.arc(cx, cy, r, a1, a2);
      ctx.strokeStyle = color + '40';
      ctx.lineWidth = 18;
      ctx.lineCap = 'butt';
      ctx.stroke();
    });

    // Active arc (filled portion)
    const activeEnd = startAngle + (animatedScore / 100) * Math.PI;
    const getColor = (s) => s >= 70 ? '#22c55e' : s >= 40 ? '#eab308' : '#ef4444';
    const activeColor = getColor(animatedScore);

    // Glow
    ctx.save();
    ctx.shadowColor = activeColor;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, activeEnd);
    ctx.strokeStyle = activeColor;
    ctx.lineWidth = 18;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();

    // Needle
    const needleAngle = startAngle + (animatedScore / 100) * Math.PI;
    const needleLen = r - 8;
    const nx = cx + needleLen * Math.cos(needleAngle);
    const ny = cy + needleLen * Math.sin(needleAngle);

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(nx, ny);
    ctx.strokeStyle = activeColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Needle center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, 2 * Math.PI);
    ctx.fillStyle = activeColor;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();

    // Labels
    ctx.font = '10px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText('0', cx - r - 5, cy + 14);
    ctx.fillText('100', cx + r + 5, cy + 14);
    ctx.fillText('40', cx - r * Math.cos(0.4 * Math.PI) - 2, cy - r * Math.sin(0.4 * Math.PI) - 4);
    ctx.fillText('70', cx - r * Math.cos(0.7 * Math.PI) + 2, cy - r * Math.sin(0.7 * Math.PI) - 4);
  }, [animatedScore, size]);

  const getColor = (s) => s >= 70 ? '#22c55e' : s >= 40 ? '#eab308' : '#ef4444';
  const getLabel = (s) => s >= 70 ? 'Good' : s >= 40 ? 'Moderate' : 'Critical';
  const color = getColor(score);

  return (
    <div className="chart-container flex flex-col items-center py-6">
      <h3 className="section-title self-start">{label}</h3>
      <div className="relative mt-2">
        <canvas ref={canvasRef} />
        <div
          className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center"
          style={{ width: size }}
        >
          <motion.p
            key={score}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl font-extrabold"
            style={{ color }}
          >
            {Math.round(animatedScore)}
          </motion.p>
          <p className="text-xs text-gray-400 font-medium">/100</p>
        </div>
      </div>

      {/* Status badges */}
      <div className="flex items-center gap-3 mt-4">
        <span
          className="px-4 py-1.5 rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: color, boxShadow: `0 4px 14px ${color}40` }}
        >
          {getLabel(score)}
        </span>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-[10px] text-gray-400">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> 0–40 Critical</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" /> 40–70 Moderate</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> 70–100 Good</span>
      </div>
    </div>
  );
}
