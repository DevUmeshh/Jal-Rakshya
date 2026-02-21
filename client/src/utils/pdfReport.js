/**
 * JalRakshya — Professional PDF Report Generator
 * Generates a multi-page, branded analytics report with:
 *   • Cover page with location & date
 *   • KPI summary section
 *   • High-quality chart captures (individual sections)
 *   • Natively rendered prediction table
 *   • Page headers, footers & page numbers
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// ── Brand Colours ────────────────────────────────────────────────
const BRAND = {
  primary:    [59, 130, 246],   // #3B82F6  indigo-500
  primaryDk:  [30,  64, 175],   // #1E40AF  indigo-800
  dark:       [15,  23,  42],   // #0F172A  slate-900
  slate700:   [51,  65,  85],   // #334155  slate-700
  slate500:   [100, 116, 139],  // #64748B  slate-500
  slate300:   [203, 213, 225],  // #CBD5E1  slate-300
  slate100:   [241, 245, 249],  // #F1F5F9  slate-100
  white:      [255, 255, 255],
  green:      [34,  197, 94],   // #22C55E
  amber:      [245, 158, 11],   // #F59E0B
  red:        [239, 68,  68],   // #EF4444
};

// ── Layout constants (A4 portrait in mm) ─────────────────────────
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 16;
const CONTENT_W = PAGE_W - MARGIN * 2;
const HEADER_H = 14;
const FOOTER_H = 12;
const SAFE_TOP = MARGIN + HEADER_H + 4;
const SAFE_BOTTOM = PAGE_H - MARGIN - FOOTER_H;

// ── Helpers ──────────────────────────────────────────────────────


function setFont(pdf, style = 'normal', size = 10) {
  pdf.setFont('helvetica', style);
  pdf.setFontSize(size);
}

function drawRect(pdf, x, y, w, h, color, radius = 0) {
  pdf.setFillColor(...color);
  if (radius > 0) {
    pdf.roundedRect(x, y, w, h, radius, radius, 'F');
  } else {
    pdf.rect(x, y, w, h, 'F');
  }
}

function drawLine(pdf, x1, y1, x2, y2, color = BRAND.slate300, width = 0.3) {
  pdf.setDrawColor(...color);
  pdf.setLineWidth(width);
  pdf.line(x1, y1, x2, y2);
}

// ── Page header (every page except cover) ────────────────────────
function drawPageHeader(pdf, locationName) {
  drawRect(pdf, 0, 0, PAGE_W, MARGIN + HEADER_H, BRAND.white);
  drawLine(pdf, MARGIN, MARGIN + HEADER_H, PAGE_W - MARGIN, MARGIN + HEADER_H, BRAND.slate300, 0.4);

  setFont(pdf, 'bold', 8);
  pdf.setTextColor(...BRAND.primary);
  pdf.text('JALRAKSHYA', MARGIN, MARGIN + 5);

  setFont(pdf, 'normal', 7);
  pdf.setTextColor(...BRAND.slate500);
  pdf.text(`Groundwater Analytics Report  |  ${locationName}`, MARGIN + 28, MARGIN + 5);

  setFont(pdf, 'normal', 7);
  pdf.setTextColor(...BRAND.slate500);
  const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  pdf.text(dateStr, PAGE_W - MARGIN, MARGIN + 5, { align: 'right' });
}

// ── Page footer ──────────────────────────────────────────────────
function drawPageFooter(pdf, pageNum, totalPages) {
  const y = PAGE_H - MARGIN - 2;
  drawLine(pdf, MARGIN, y, PAGE_W - MARGIN, y, BRAND.slate300, 0.3);

  setFont(pdf, 'normal', 7);
  pdf.setTextColor(...BRAND.slate500);
  pdf.text('JalRakshya - Nashik District Groundwater Monitoring', MARGIN, y + 5);
  pdf.text(`Page ${pageNum} of ${totalPages}`, PAGE_W - MARGIN, y + 5, { align: 'right' });
}

// ── Cover page ───────────────────────────────────────────────────
function drawCoverPage(pdf, locationName, data, grade) {
  // Full-height dark header band
  drawRect(pdf, 0, 0, PAGE_W, 135, BRAND.dark);

  // Accent bar
  drawRect(pdf, MARGIN, 38, 50, 3, BRAND.primary, 1.5);

  // Title
  setFont(pdf, 'bold', 28);
  pdf.setTextColor(...BRAND.white);
  pdf.text('JalRakshya', MARGIN, 58);

  setFont(pdf, 'normal', 12);
  pdf.setTextColor(...BRAND.slate300);
  pdf.text('Groundwater Analytics Report', MARGIN, 68);

  // Location
  setFont(pdf, 'bold', 18);
  pdf.setTextColor(...BRAND.white);
  pdf.text(locationName, MARGIN, 92);

  // District line
  setFont(pdf, 'normal', 10);
  pdf.setTextColor(...BRAND.slate500);
  pdf.text('Nashik District, Maharashtra, India', MARGIN, 102);

  // Date & period
  const dateStr = new Date().toLocaleDateString('en-IN', { dateStyle: 'long' });
  setFont(pdf, 'normal', 9);
  pdf.setTextColor(...BRAND.slate500);
  pdf.text(`Generated on ${dateStr}`, MARGIN, 118);

  if (data.length > 0) {
    const yearRange = `Data Period: ${data[0].year} – ${data[data.length - 1].year}  (${data.length} records)`;
    pdf.text(yearRange, MARGIN, 126);
  }

  // ── Summary card below dark band ──
  const cardY = 148;
  drawRect(pdf, MARGIN, cardY, CONTENT_W, 56, BRAND.slate100, 4);
  drawRect(pdf, MARGIN, cardY, CONTENT_W, 2, BRAND.primary);

  setFont(pdf, 'bold', 11);
  pdf.setTextColor(...BRAND.dark);
  pdf.text('Report Summary', MARGIN + 8, cardY + 14);

  setFont(pdf, 'normal', 9);
  pdf.setTextColor(...BRAND.slate700);

  const latestData = data.length > 0 ? data[data.length - 1] : null;
  const summaryLines = [
    `Water Quality Grade: ${grade.grade} (${grade.label})`,
    latestData ? `Latest Water Level: ${latestData.groundwaterLevel?.toFixed(2)} m  |  Rainfall: ${latestData.rainfall?.toFixed(1)} mm` : '',
    latestData ? `Water Score: ${latestData.waterScore?.toFixed(1)} / 100  |  Depletion Rate: ${latestData.depletionRate?.toFixed(2)}%` : '',
    `This report contains trend analysis, forecasts, risk assessment, and actionable insights.`,
  ].filter(Boolean);

  summaryLines.forEach((line, i) => {
    pdf.text(line, MARGIN + 8, cardY + 24 + i * 7);
  });

  // ── Table of contents ──
  const tocY = 220;
  setFont(pdf, 'bold', 11);
  pdf.setTextColor(...BRAND.dark);
  pdf.text('Contents', MARGIN, tocY);
  drawLine(pdf, MARGIN, tocY + 2, MARGIN + 25, tocY + 2, BRAND.primary, 0.8);

  setFont(pdf, 'normal', 9);
  pdf.setTextColor(...BRAND.slate700);
  const tocItems = [
    '1.  Key Performance Indicators',
    '2.  Trend Indicators & Risk Assessment',
    '3.  Water Level & Rainfall Charts',
    '4.  Usage Analysis (Agricultural, Industrial, Household)',
    '5.  Forecasted Predictions',
    '6.  Smart Insights & Recommendations',
  ];
  tocItems.forEach((item, i) => {
    pdf.text(item, MARGIN + 4, tocY + 12 + i * 7);
  });

  // Bottom legal line
  setFont(pdf, 'normal', 7);
  pdf.setTextColor(...BRAND.slate500);
  pdf.text(
    'Confidential — For authorized use only. Data sourced from Central Ground Water Board (CGWB) & Maharashtra Groundwater Survey.',
    PAGE_W / 2, PAGE_H - 20, { align: 'center' }
  );
}

// ── KPI Section ──────────────────────────────────────────────────
function drawKPISection(pdf, data, startY) {
  let y = startY;
  const latestData = data.length > 0 ? data[data.length - 1] : null;
  if (!latestData) return y;

  setFont(pdf, 'bold', 13);
  pdf.setTextColor(...BRAND.dark);
  pdf.text('1. Key Performance Indicators', MARGIN, y);
  drawLine(pdf, MARGIN, y + 2, MARGIN + 60, y + 2, BRAND.primary, 0.8);
  y += 10;

  // KPI Cards (2x3 grid)
  const kpis = [
    { label: 'Water Level', value: `${latestData.groundwaterLevel?.toFixed(2)} m`, color: BRAND.primary },
    { label: 'Rainfall', value: `${latestData.rainfall?.toFixed(1)} mm`, color: [20, 184, 166] },
    { label: 'Water Score', value: `${latestData.waterScore?.toFixed(1)} / 100`, color: BRAND.green },
    { label: 'Depletion Rate', value: `${latestData.depletionRate?.toFixed(2)}%`, color: BRAND.red },
    { label: 'Agricultural Use', value: `${latestData.agriculturalUsage?.toFixed(1)} Ml`, color: BRAND.amber },
    { label: 'Total Usage', value: `${((latestData.agriculturalUsage || 0) + (latestData.industrialUsage || 0) + (latestData.householdUsage || 0)).toFixed(1)} Ml`, color: [139, 92, 246] },
  ];

  const cardW = (CONTENT_W - 8) / 3;
  const cardH = 28;

  kpis.forEach((kpi, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const cx = MARGIN + col * (cardW + 4);
    const cy = y + row * (cardH + 4);

    // Card bg
    drawRect(pdf, cx, cy, cardW, cardH, BRAND.white, 3);
    // Left accent
    drawRect(pdf, cx, cy + 3, 2.5, cardH - 6, kpi.color, 1);

    // Label
    setFont(pdf, 'normal', 7.5);
    pdf.setTextColor(...BRAND.slate500);
    pdf.text(kpi.label, cx + 8, cy + 10);

    // Value
    setFont(pdf, 'bold', 13);
    pdf.setTextColor(...BRAND.dark);
    pdf.text(kpi.value, cx + 8, cy + 21);
  });

  y += Math.ceil(kpis.length / 3) * (cardH + 4) + 6;

  // Light bg behind KPI section
  // (drawn under everything via ordering, skip for simplicity)

  return y;
}

// ── Historical Data Table ────────────────────────────────────────
function drawDataTable(pdf, data, startY, title = 'Historical Data Overview') {
  let y = startY;

  setFont(pdf, 'bold', 13);
  pdf.setTextColor(...BRAND.dark);
  pdf.text(title, MARGIN, y);
  drawLine(pdf, MARGIN, y + 2, MARGIN + 50, y + 2, BRAND.primary, 0.8);
  y += 10;

  // Table header
  const cols = [
    { label: 'Year',       width: 18, align: 'left' },
    { label: 'Water Lvl',  width: 24, align: 'right' },
    { label: 'Rainfall',   width: 24, align: 'right' },
    { label: 'Depletion',  width: 24, align: 'right' },
    { label: 'Agri Use',   width: 24, align: 'right' },
    { label: 'Ind. Use',   width: 24, align: 'right' },
    { label: 'House Use',  width: 24, align: 'right' },
    { label: 'Score',      width: 16, align: 'right' },
  ];
  const totalTableW = cols.reduce((s, c) => s + c.width, 0);
  const tableX = MARGIN;
  const rowH = 7;

  // Header row
  drawRect(pdf, tableX, y, totalTableW, rowH + 1, BRAND.dark, 2);
  setFont(pdf, 'bold', 7);
  pdf.setTextColor(...BRAND.white);

  let cx = tableX + 3;
  cols.forEach((col) => {
    if (col.align === 'right') {
      pdf.text(col.label, cx + col.width - 3, y + 5, { align: 'right' });
    } else {
      pdf.text(col.label, cx, y + 5);
    }
    cx += col.width;
  });
  y += rowH + 1;

  // Rows
  setFont(pdf, 'normal', 7.5);
  data.forEach((d, i) => {
    if (y > SAFE_BOTTOM - 10) return; // leave room

    const isAlt = i % 2 === 0;
    if (isAlt) {
      drawRect(pdf, tableX, y, totalTableW, rowH, BRAND.slate100);
    }

    pdf.setTextColor(...BRAND.dark);
    cx = tableX + 3;

    const values = [
      String(d.year),
      `${d.groundwaterLevel?.toFixed(2)} m`,
      `${d.rainfall?.toFixed(1)} mm`,
      `${d.depletionRate?.toFixed(2)}%`,
      `${d.agriculturalUsage?.toFixed(1)} Ml`,
      `${d.industrialUsage?.toFixed(1)} Ml`,
      `${d.householdUsage?.toFixed(1)} Ml`,
      `${d.waterScore?.toFixed(0)}`,
    ];

    values.forEach((val, vi) => {
      const col = cols[vi];
      // Color-code score
      if (vi === values.length - 1) {
        const score = d.waterScore || 0;
        if (score >= 70) pdf.setTextColor(...BRAND.green);
        else if (score >= 50) pdf.setTextColor(...BRAND.amber);
        else pdf.setTextColor(...BRAND.red);
        setFont(pdf, 'bold', 7.5);
      } else if (vi === 0) {
        pdf.setTextColor(...BRAND.primary);
        setFont(pdf, 'bold', 7.5);
      } else {
        pdf.setTextColor(...BRAND.slate700);
        setFont(pdf, 'normal', 7.5);
      }

      if (col.align === 'right') {
        pdf.text(val, cx + col.width - 3, y + 5, { align: 'right' });
      } else {
        pdf.text(val, cx, y + 5);
      }
      cx += col.width;
    });

    y += rowH;
  });

  // Bottom border
  drawLine(pdf, tableX, y, tableX + totalTableW, y, BRAND.slate300, 0.3);
  y += 4;

  return y;
}

// ── Predictions Table ────────────────────────────────────────────
function drawPredictionTable(pdf, predictions, latestData, startY) {
  let y = startY;

  setFont(pdf, 'bold', 13);
  pdf.setTextColor(...BRAND.dark);
  pdf.text('5. Forecasted Predictions (Linear Regression)', MARGIN, y);
  drawLine(pdf, MARGIN, y + 2, MARGIN + 80, y + 2, BRAND.primary, 0.8);
  y += 10;

  if (predictions.length === 0) {
    setFont(pdf, 'normal', 9);
    pdf.setTextColor(...BRAND.slate500);
    pdf.text('No prediction data available.', MARGIN, y);
    return y + 8;
  }

  const cols = [
    { label: 'Year',           width: 22, align: 'left' },
    { label: 'Water Level (m)',width: 34, align: 'right' },
    { label: 'Rainfall (mm)', width: 34, align: 'right' },
    { label: 'Depletion (%)', width: 34, align: 'right' },
    { label: 'Trend',         width: 30, align: 'right' },
  ];
  const totalW = cols.reduce((s, c) => s + c.width, 0);
  const rowH = 8;

  // Header
  drawRect(pdf, MARGIN, y, totalW, rowH + 1, BRAND.primaryDk, 2);
  setFont(pdf, 'bold', 7.5);
  pdf.setTextColor(...BRAND.white);
  let cx = MARGIN + 3;
  cols.forEach((col) => {
    if (col.align === 'right') {
      pdf.text(col.label, cx + col.width - 3, y + 6, { align: 'right' });
    } else {
      pdf.text(col.label, cx, y + 6);
    }
    cx += col.width;
  });
  y += rowH + 1;

  // Rows
  predictions.forEach((p, i) => {
    const isAlt = i % 2 === 0;
    if (isAlt) drawRect(pdf, MARGIN, y, totalW, rowH, BRAND.slate100);

    const prevLevel = i > 0 ? predictions[i - 1].groundwaterLevel : (latestData?.groundwaterLevel || 0);
    const trend = p.groundwaterLevel - prevLevel;
    const trendStr = `${trend > 0 ? '+' : ''}${trend.toFixed(2)} m`;

    const values = [
      String(p.year),
      p.groundwaterLevel?.toFixed(2),
      p.rainfall?.toFixed(1),
      p.depletionRate?.toFixed(2),
      trendStr,
    ];

    cx = MARGIN + 3;
    values.forEach((val, vi) => {
      const col = cols[vi];
      if (vi === 0) {
        setFont(pdf, 'bold', 8);
        pdf.setTextColor(...BRAND.primary);
      } else if (vi === 4) {
        setFont(pdf, 'bold', 8);
        pdf.setTextColor(...(trend > 0 ? BRAND.red : BRAND.green));
      } else {
        setFont(pdf, 'normal', 8);
        pdf.setTextColor(...BRAND.slate700);
      }
      if (col.align === 'right') {
        pdf.text(val, cx + col.width - 3, y + 6, { align: 'right' });
      } else {
        pdf.text(val, cx, y + 6);
      }
      cx += col.width;
    });
    y += rowH;
  });

  drawLine(pdf, MARGIN, y, MARGIN + totalW, y, BRAND.slate300, 0.3);
  y += 3;

  setFont(pdf, 'italic', 7);
  pdf.setTextColor(...BRAND.slate500);
  pdf.text('Predictions are based on linear regression modelling. Values are indicative and subject to change.', MARGIN, y + 3);
  y += 10;

  return y;
}

// ── Capture a DOM node as a high-res image ───────────────────────
async function captureElement(el, darkMode) {
  const canvas = await html2canvas(el, {
    scale: 3,
    useCORS: true,
    backgroundColor: darkMode ? '#0f172a' : '#ffffff',
    logging: false,
    allowTaint: true,
  });
  return canvas.toDataURL('image/png');
}

// ── Section title helper ─────────────────────────────────────────
function drawSectionTitle(pdf, title, y) {
  if (y + 20 > SAFE_BOTTOM) {
    pdf.addPage();
    y = SAFE_TOP;
  }
  setFont(pdf, 'bold', 13);
  pdf.setTextColor(...BRAND.dark);
  pdf.text(title, MARGIN, y);
  drawLine(pdf, MARGIN, y + 2, MARGIN + 60, y + 2, BRAND.primary, 0.8);
  return y + 10;
}

// ═══════════════════════════════════════════════════════════════════
// ██  MAIN EXPORT FUNCTION  ██
// ═══════════════════════════════════════════════════════════════════
export async function generateReport({
  locationName,
  data,
  predictions,
  grade,
  darkMode,
  reportRef,
}) {
  const pdf = new jsPDF('p', 'mm', 'a4');

  // ───────── PAGE 1: COVER ─────────
  drawCoverPage(pdf, locationName, data, grade);

  // ───────── PAGE 2: KPIs + Historical Table ─────────
  pdf.addPage();
  let y = SAFE_TOP;
  drawPageHeader(pdf, locationName);
  y = drawKPISection(pdf, data, y);
  y += 4;
  y = drawDataTable(pdf, data, y, '2. Historical Data Overview');

  // ───────── PAGE 3+: Chart Captures ─────────
  // Capture chart sections from the DOM
  if (reportRef?.current) {
    const chartContainers = reportRef.current.querySelectorAll('.chart-container');

    // Capture the main grid rows that contain charts
    const captureTargets = [];

    // Gather all chart-containers and major grid rows
    if (chartContainers.length > 0) {
      chartContainers.forEach((el) => captureTargets.push(el));
    }

    if (captureTargets.length > 0) {
      pdf.addPage();
      y = SAFE_TOP;
      drawPageHeader(pdf, locationName);
      y = drawSectionTitle(pdf, '3. Detailed Charts & Analysis', y);

      for (let i = 0; i < captureTargets.length; i++) {
        try {
          const imgData = await captureElement(captureTargets[i], darkMode);

          // Calculate proportional height
          const el = captureTargets[i];
          const elRect = el.getBoundingClientRect();
          const aspectRatio = elRect.height / elRect.width;
          const imgW = CONTENT_W;
          const imgH = Math.min(imgW * aspectRatio, 90);

          if (y + imgH + 6 > SAFE_BOTTOM) {
            // Add page footer before new page
            pdf.addPage();
            y = SAFE_TOP;
            drawPageHeader(pdf, locationName);
          }

          pdf.addImage(imgData, 'PNG', MARGIN, y, imgW, imgH);
          y += imgH + 6;
        } catch (err) {
          console.warn('Chart capture failed:', err);
        }
      }
    }

    // Capture the grid rows (risk gauge, forecast, etc.)
    const topGridRows = reportRef.current.querySelectorAll(':scope > .grid');
    if (topGridRows.length > 0) {
      for (const row of topGridRows) {
        try {
          if (y + 90 > SAFE_BOTTOM) {
            pdf.addPage();
            y = SAFE_TOP;
            drawPageHeader(pdf, locationName);
          }
          const imgData = await captureElement(row, darkMode);
          const rect = row.getBoundingClientRect();
          const aspectRatio = rect.height / rect.width;
          const imgW = CONTENT_W;
          const imgH = Math.min(imgW * aspectRatio, 90);
          pdf.addImage(imgData, 'PNG', MARGIN, y, imgW, imgH);
          y += imgH + 6;
        } catch (err) {
          console.warn('Grid row capture failed:', err);
        }
      }
    }
  }

  // ───────── PREDICTION TABLE PAGE ─────────
  pdf.addPage();
  y = SAFE_TOP;
  drawPageHeader(pdf, locationName);

  const latestData = data.length > 0 ? data[data.length - 1] : null;
  y = drawPredictionTable(pdf, predictions, latestData, y);

  // ───────── INSIGHTS / DISCLAIMER PAGE ─────────
  y += 4;
  y = drawSectionTitle(pdf, '6. Notes & Disclaimer', y);

  setFont(pdf, 'normal', 8.5);
  pdf.setTextColor(...BRAND.slate700);

  const notes = [
    'This report has been auto-generated by the JalRakshya Groundwater Monitoring System using data sourced',
    'from the Central Ground Water Board (CGWB) and Maharashtra State Groundwater Survey & Development Agency.',
    '',
    'Key Observations:',
    `  •  Data covers ${data.length} year(s) of monitoring for ${locationName}.`,
    `  •  Current water quality is graded "${grade.grade}" (${grade.label}).`,
    latestData ? `  •  Latest depletion rate stands at ${latestData.depletionRate?.toFixed(2)}%, which requires ${latestData.depletionRate > 1.5 ? 'immediate attention' : 'ongoing monitoring'}.` : '',
    '',
    'Disclaimer:',
    '  The predictions and insights in this report are generated using statistical models (linear regression).',
    '  They are indicative and should not be used as the sole basis for policy decisions. Always consult local',
    '  hydrogeological experts and the latest CGWB reports for authoritative guidance.',
    '',
    'For more information, visit: https://cgwb.gov.in  |  https://gsda.maharashtra.gov.in',
  ].filter((l) => l !== undefined);

  notes.forEach((line) => {
    if (y > SAFE_BOTTOM - 5) {
      pdf.addPage();
      y = SAFE_TOP;
      drawPageHeader(pdf, locationName);
    }
    pdf.text(line, MARGIN, y);
    y += 5;
  });

  // ── Stamp at bottom ──
  y += 8;
  drawRect(pdf, MARGIN, y, CONTENT_W, 18, BRAND.slate100, 3);
  setFont(pdf, 'bold', 8);
  pdf.setTextColor(...BRAND.primary);
  pdf.text('JalRakshya', MARGIN + 6, y + 8);
  setFont(pdf, 'normal', 7);
  pdf.setTextColor(...BRAND.slate500);
  pdf.text(`Report generated on ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })} at ${new Date().toLocaleTimeString('en-IN')}`, MARGIN + 6, y + 14);

  // ── Add footers to all pages ──
  const totalPages = pdf.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);
    if (p > 1) {
      drawPageFooter(pdf, p - 1, totalPages - 1); // cover page not counted
    }
  }

  // ── Save ──
  pdf.save(`JalRakshya_${locationName}_Report.pdf`);
}
