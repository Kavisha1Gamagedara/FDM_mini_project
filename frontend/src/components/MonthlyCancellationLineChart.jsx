import React, { useState, useMemo } from 'react';
import { 
  TrendingDown, TrendingUp, AlertTriangle, ShieldAlert, 
  Calendar, DollarSign, Users, Sparkles, Filter, 
  ChevronRight, Info, CheckCircle2, ArrowUpRight, BarChart2,
  Maximize2, Minimize2
} from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Builds chronological list of upcoming months starting from reference date.
 */
function getUpcomingMonthList(startDate, count = 6) {
  const list = [];
  const start = new Date(startDate);
  
  for (let i = 0; i < count; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    list.push({
      year: d.getFullYear(),
      monthIndex: d.getMonth(),
      monthName: MONTH_NAMES[d.getMonth()],
      shortLabel: `${MONTH_NAMES[d.getMonth()].slice(0, 3)} '${String(d.getFullYear()).slice(2)}`,
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    });
  }
  return list;
}

export default function MonthlyCancellationLineChart({ 
  reservations = [], 
  onSelectMonth,
  selectedMonthFilter = 'all',
  isExpanded = false,
  onToggleExpand
}) {
  const [horizon, setHorizon] = useState(6); // 6 or 12 months
  const [activeSeries, setActiveSeries] = useState({
    predicted: true,
    scheduled: true,
    highRisk: true
  });
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Reference date: October 2026
  const referenceDate = useMemo(() => new Date(2026, 9, 1), []);
  const upcomingMonths = useMemo(() => getUpcomingMonthList(referenceDate, horizon), [referenceDate, horizon]);

  // Aggregate reservation predictions across each upcoming month
  const monthlyData = useMemo(() => {
    return upcomingMonths.map(mObj => {
      // Find matching bookings by check_in_date (YYYY-MM) or arrival_date_month
      const matched = reservations.filter(r => {
        if (r.status === 'cancelled') return false; // exclude already cancelled stays from active forecast
        if (r.check_in_date && r.check_in_date.startsWith(mObj.key)) return true;
        if (r.arrival_date_month && r.arrival_date_month.toLowerCase() === mObj.monthName.toLowerCase()) {
          // If no check_in_date, check if created_at or year matches
          if (r.check_in_date) return r.check_in_date.startsWith(String(mObj.year));
          return true;
        }
        return false;
      });

      let totalBookings = matched.length;
      let predictedCancelsSum = 0;
      let highRiskCount = 0;
      let medRiskCount = 0;
      let lowRiskCount = 0;
      let revenueAtRisk = 0;
      let totalRevenue = 0;
      const segmentCounts = {};

      matched.forEach(r => {
        const pred = r.prediction;
        const prob = pred ? (pred.cancellation_probability || (pred.cancellation_probability_pct / 100) || 0) : 0.25;
        const riskLevel = pred ? pred.risk_level : (prob >= 0.6 ? 'high' : prob >= 0.35 ? 'medium' : 'low');

        predictedCancelsSum += prob;

        if (riskLevel === 'high') highRiskCount++;
        else if (riskLevel === 'medium') medRiskCount++;
        else lowRiskCount++;

        const nights = (r.stays_in_weekend_nights || 0) + (r.stays_in_week_nights || 1);
        const rooms = r.room_count || 1;
        const rev = (r.adr || 145) * nights * rooms;
        totalRevenue += rev;
        revenueAtRisk += rev * prob;

        const seg = r.market_segment || 'Direct';
        segmentCounts[seg] = (segmentCounts[seg] || 0) + 1;
      });

      // Find top segment
      let topSegment = 'Direct';
      let maxSegCount = 0;
      Object.entries(segmentCounts).forEach(([seg, c]) => {
        if (c > maxSegCount) {
          maxSegCount = c;
          topSegment = seg;
        }
      });

      const predictedCancellations = Math.round(predictedCancelsSum * 10) / 10;
      const cancellationRatePct = totalBookings > 0 
        ? Math.round((predictedCancellations / totalBookings) * 100) 
        : 0;

      return {
        ...mObj,
        totalBookings,
        predictedCancellations,
        highRiskCount,
        medRiskCount,
        lowRiskCount,
        cancellationRatePct,
        revenueAtRisk: Math.round(revenueAtRisk),
        totalRevenue: Math.round(totalRevenue),
        topSegment,
        isPeak: false // determined below
      };
    });
  }, [upcomingMonths, reservations]);

  // Find peak cancellation month
  const peakMonth = useMemo(() => {
    let peak = null;
    let maxCancels = -1;
    monthlyData.forEach(d => {
      if (d.predictedCancellations > maxCancels && d.totalBookings > 0) {
        maxCancels = d.predictedCancellations;
        peak = d;
      }
    });
    return peak;
  }, [monthlyData]);

  // Overall totals across the horizon
  const totals = useMemo(() => {
    let sumCancels = 0;
    let sumBookings = 0;
    let sumRevenueRisk = 0;
    let sumHighRisk = 0;

    monthlyData.forEach(d => {
      sumCancels += d.predictedCancellations;
      sumBookings += d.totalBookings;
      sumRevenueRisk += d.revenueAtRisk;
      sumHighRisk += d.highRiskCount;
    });

    const avgRate = sumBookings > 0 ? ((sumCancels / sumBookings) * 100).toFixed(1) : 0;

    return {
      totalPredictedCancels: Math.round(sumCancels * 10) / 10,
      totalScheduledBookings: sumBookings,
      totalRevenueAtRisk: Math.round(sumRevenueRisk),
      totalHighRisk: sumHighRisk,
      avgRate
    };
  }, [monthlyData]);

  // SVG Chart Geometry Constants - Expanded for Maximum Visual Clarity
  const width = 1000;
  const height = 430;
  const padding = { top: 50, right: 45, bottom: 55, left: 60 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Compute maximum Y scale
  const maxY = useMemo(() => {
    let max = 6;
    monthlyData.forEach(d => {
      if (d.totalBookings > max) max = d.totalBookings;
      if (d.predictedCancellations > max) max = d.predictedCancellations;
    });
    return Math.ceil(max * 1.25);
  }, [monthlyData]);

  // Coordinates mapping
  const points = useMemo(() => {
    const step = chartW / Math.max(monthlyData.length - 1, 1);
    return monthlyData.map((d, i) => {
      const x = padding.left + i * step;
      const yPred = padding.top + chartH - (d.predictedCancellations / maxY) * chartH;
      const ySched = padding.top + chartH - (d.totalBookings / maxY) * chartH;
      const yHigh = padding.top + chartH - (d.highRiskCount / maxY) * chartH;
      return { x, yPred, ySched, yHigh, data: d, index: i };
    });
  }, [monthlyData, chartW, chartH, maxY, padding.left, padding.top]);

  // Helper to construct smooth curved SVG path (Monotone cubic spline)
  const buildSmoothPath = (pts, key) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0][key]}`;

    let path = `M ${pts[0].x} ${pts[0][key]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1[key] + (p2[key] - p0[key]) / 6;

      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2[key] - (p3[key] - p1[key]) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2[key]}`;
    }
    return path;
  };

  const linePredPath = useMemo(() => buildSmoothPath(points, 'yPred'), [points]);
  const lineSchedPath = useMemo(() => buildSmoothPath(points, 'ySched'), [points]);
  const lineHighPath = useMemo(() => buildSmoothPath(points, 'yHigh'), [points]);

  // Area under predicted cancellations curve for rich luxury glow
  const areaPredPath = useMemo(() => {
    if (points.length === 0) return '';
    const bottomY = padding.top + chartH;
    return `${linePredPath} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`;
  }, [linePredPath, points, padding.top, chartH]);

  // Y-axis grid ticks
  const yTicks = [0, Math.round(maxY * 0.25), Math.round(maxY * 0.5), Math.round(maxY * 0.75), maxY];

  const activeHoverPoint = hoveredIndex !== null ? points[hoveredIndex] : null;

  return (
    <div className="glass-panel monthly-chart-card" style={{ 
      padding: '1.75rem', 
      borderRadius: '20px', 
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
      position: 'relative'
    }}>
      
      {/* Header Bar with Title, Range Selector & Series Toggles */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="chart-trajectory-pill">
            <TrendingDown size={13} />
            <span>EXECUTIVE ML CANCELLATION FORECAST • UPCOMING MONTHS TRAJECTORY</span>
          </div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.25rem' }}>
            <span>Upcoming Months Predicted Cancellations</span>
            <span className="chart-ai-pill">
              AI Predictive Forecast
            </span>
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', marginTop: '0.2rem' }}>
            Projected cancellations on the books by arrival month. Managers use this trajectory to adjust overbooking limits and enforce pre-arrival payment policies.
          </p>
        </div>

        {/* Horizon Toggle, Expand & Series Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.65rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <span className="chart-live-badge">
              ● Predictive Model Live
            </span>

            {onToggleExpand && (
              <button
                type="button"
                onClick={onToggleExpand}
                className="chart-expand-btn"
                title={isExpanded ? "Collapse to standard view" : "Expand chart to full width"}
              >
                {isExpanded ? (
                  <>
                    <Minimize2 size={13} color="currentColor" />
                    <span>Standard View</span>
                  </>
                ) : (
                  <>
                    <Maximize2 size={13} color="currentColor" />
                    <span>Full-Width View</span>
                  </>
                )}
              </button>
            )}

            {/* Horizon Toggle */}
            <div className="chart-horizon-box">
              <button
                type="button"
                onClick={() => setHorizon(6)}
                className={`chart-horizon-btn ${horizon === 6 ? 'active' : ''}`}
              >
                Next 6 Months
              </button>
              <button
                type="button"
                onClick={() => setHorizon(12)}
                className={`chart-horizon-btn ${horizon === 12 ? 'active' : ''}`}
              >
                Next 12 Months
              </button>
            </div>
          </div>

          {/* Series Toggle Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setActiveSeries(prev => ({ ...prev, predicted: !prev.predicted }))}
              className={`chart-series-pill series-predicted ${activeSeries.predicted ? 'active' : ''}`}
            >
              <span className="series-dot" />
              <span>Predicted Cancellations</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSeries(prev => ({ ...prev, scheduled: !prev.scheduled }))}
              className={`chart-series-pill series-scheduled ${activeSeries.scheduled ? 'active' : ''}`}
            >
              <span className="series-dot" />
              <span>Total Scheduled Stays</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSeries(prev => ({ ...prev, highRisk: !prev.highRisk }))}
              className={`chart-series-pill series-highrisk ${activeSeries.highRisk ? 'active' : ''}`}
            >
              <span className="series-dot" />
              <span>High Risk (≥60%)</span>
            </button>
          </div>

        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="chart-kpi-strip">
        <div>
          <span className="chart-kpi-label">
            Forecast Horizon ({horizon} Mo)
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.15rem' }}>
            <span className="chart-kpi-val danger" style={{ fontSize: '1.35rem', fontWeight: 800 }}>
              ~{totals.totalPredictedCancels}
            </span>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
              predicted cancels
            </span>
          </div>
          <span className="chart-kpi-sub danger">
            {totals.avgRate}% avg projected churn
          </span>
        </div>

        <div>
          <span className="chart-kpi-label">
            On-The-Books Stays
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.15rem' }}>
            <span className="chart-kpi-val primary" style={{ fontSize: '1.35rem', fontWeight: 800 }}>
              {totals.totalScheduledBookings}
            </span>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
              confirmed bookings
            </span>
          </div>
          <span className="chart-kpi-sub muted">
            Across {monthlyData.length} upcoming months
          </span>
        </div>

        <div>
          <span className="chart-kpi-label">
            Projected Revenue Exposure
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.15rem' }}>
            <span className="chart-kpi-val contrast" style={{ fontSize: '1.35rem', fontWeight: 800 }}>
              ${totals.totalRevenueAtRisk.toLocaleString()}
            </span>
            <span className="chart-kpi-tag-danger">
              at risk
            </span>
          </div>
          <span className="chart-kpi-sub muted">
            Weighted by ML cancellation prob
          </span>
        </div>

        <div>
          <span className="chart-kpi-label">
            Peak Cancellation Risk Month
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.15rem' }}>
            <span className="chart-kpi-val warning" style={{ fontSize: '1.15rem', fontWeight: 800 }}>
              {peakMonth ? `${peakMonth.monthName} ${peakMonth.year}` : 'None'}
            </span>
          </div>
          <span className="chart-kpi-sub warning">
            {peakMonth ? `~${peakMonth.predictedCancellations} cancels (${peakMonth.cancellationRatePct}% churn)` : 'No risk detected'}
          </span>
        </div>
      </div>

      {/* SVG Interactive Line Chart Canvas */}
      <div style={{ position: 'relative', width: '100%', overflowX: 'auto', userSelect: 'none' }}>
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          style={{ width: '100%', height: 'auto', minHeight: '380px', display: 'block', overflow: 'visible' }}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            {/* Gradient Fill under predicted cancellations curve */}
            <linearGradient id="cancelGlowGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#f43f5e" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
            </linearGradient>

            {/* Gradient Fill under scheduled bookings */}
            <linearGradient id="schedGlowGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
            </linearGradient>

            {/* Glow Filter */}
            <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Horizontal Grid Lines & Y-Axis Labels */}
          {yTicks.map((val, idx) => {
            const y = padding.top + chartH - (val / maxY) * chartH;
            return (
              <g key={`ytick-${idx}`}>
                <line 
                  x1={padding.left} 
                  y1={y} 
                  x2={width - padding.right} 
                  y2={y} 
                  className="chart-grid-line"
                  stroke="rgba(255, 255, 255, 0.09)" 
                  strokeDasharray="5 5" 
                />
                <text 
                  x={padding.left - 14} 
                  y={y + 5} 
                  fill="var(--text-muted)" 
                  fontSize="12" 
                  fontWeight="600"
                  textAnchor="end" 
                  fontFamily="monospace"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Background Area Fill Under Predicted Cancellations */}
          {activeSeries.predicted && (
            <path 
              d={areaPredPath} 
              fill="url(#cancelGlowGradient)" 
              style={{ transition: 'd 0.3s ease' }}
            />
          )}

          {/* Series 2: Total Scheduled Stays Line */}
          {activeSeries.scheduled && (
            <path 
              d={lineSchedPath} 
              fill="none" 
              stroke="#38bdf8" 
              strokeWidth="3.2" 
              strokeDasharray="7 5"
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{ transition: 'all 0.3s ease' }}
            />
          )}

          {/* Series 3: High Risk Bookings Line */}
          {activeSeries.highRisk && (
            <path 
              d={lineHighPath} 
              fill="none" 
              stroke="#f59e0b" 
              strokeWidth="2.8" 
              strokeDasharray="3 4"
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{ transition: 'all 0.3s ease' }}
            />
          )}

          {/* Series 1: Predicted Cancellations Line (Primary Highlight) */}
          {activeSeries.predicted && (
            <path 
              d={linePredPath} 
              fill="none" 
              stroke="#f43f5e" 
              strokeWidth="4" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              filter="url(#lineGlow)"
              style={{ transition: 'all 0.3s ease' }}
            />
          )}

          {/* Interactive Hover Columns & Crosshairs */}
          {points.map((pt, i) => {
            const isHovered = hoveredIndex === i;
            const isSelected = selectedMonthFilter.toLowerCase() === pt.data.monthName.toLowerCase();
            const colWidth = chartW / points.length;

            return (
              <g 
                key={`col-${i}`}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredIndex(i)}
                onClick={() => onSelectMonth && onSelectMonth(pt.data.monthName)}
              >
                {/* Transparent hover capture rect */}
                <rect 
                  x={pt.x - colWidth / 2} 
                  y={padding.top} 
                  width={colWidth} 
                  height={chartH} 
                  fill="transparent" 
                />

                {/* Vertical Crosshair Line when hovered or selected */}
                {(isHovered || isSelected) && (
                  <line 
                    x1={pt.x} 
                    y1={padding.top} 
                    x2={pt.x} 
                    y2={padding.top + chartH} 
                    stroke={isSelected ? '#34d399' : '#f43f5e'} 
                    strokeWidth="1.8" 
                    strokeDasharray="3 3"
                    opacity={isSelected ? 0.95 : 0.75}
                  />
                )}

                {/* Total Scheduled Dot */}
                {activeSeries.scheduled && (
                  <circle 
                    cx={pt.x} 
                    cy={pt.ySched} 
                    r={isHovered ? 6.5 : 4.5} 
                    fill="#111827" 
                    stroke="#38bdf8" 
                    strokeWidth="3" 
                  />
                )}

                {/* High Risk Dot */}
                {activeSeries.highRisk && (
                  <circle 
                    cx={pt.x} 
                    cy={pt.yHigh} 
                    r={isHovered ? 5.5 : 3.5} 
                    fill="#111827" 
                    stroke="#f59e0b" 
                    strokeWidth="2.5" 
                  />
                )}

                {/* Predicted Cancellation Dot (Pulse effect on hover) */}
                {activeSeries.predicted && (
                  <g>
                    {isHovered && (
                      <circle 
                        cx={pt.x} 
                        cy={pt.yPred} 
                        r="12" 
                        fill="#f43f5e" 
                        opacity="0.35" 
                      />
                    )}
                    <circle 
                      cx={pt.x} 
                      cy={pt.yPred} 
                      r={isHovered ? 7.5 : 5.5} 
                      fill="#f43f5e" 
                      stroke="#ffffff" 
                      strokeWidth="2.5" 
                    />

                    {/* Direct readable prediction badge right above the node */}
                    <g transform={`translate(${pt.x}, ${pt.yPred - 24})`}>
                      <rect 
                        x="-20" 
                        y="-10" 
                        width="40" 
                        height="18" 
                        rx="9" 
                        fill="#e11d48" 
                        stroke="#ffffff" 
                        strokeWidth="1.5" 
                      />
                      <text 
                        x="0" 
                        y="3" 
                        textAnchor="middle" 
                        fill="#ffffff" 
                        fontSize="10" 
                        fontWeight="700"
                        fontFamily="sans-serif"
                      >
                        ~{pt.data.predictedCancellations}
                      </text>
                    </g>
                  </g>
                )}

                {/* X-Axis Month Label */}
                <text 
                  x={pt.x} 
                  y={padding.top + chartH + 26} 
                  textAnchor="middle" 
                  fill={isHovered ? 'var(--text-primary)' : (isSelected ? '#059669' : 'var(--text-secondary)')} 
                  fontSize={isHovered ? '13' : '12'} 
                  fontWeight={isHovered || isSelected ? '700' : '600'}
                  letterSpacing="0.02em"
                >
                  {pt.data.shortLabel}
                </text>

                {/* Small indicator pill if month currently selected in table below */}
                {isSelected && (
                  <circle 
                    cx={pt.x} 
                    cy={padding.top + chartH + 34} 
                    r="2.5" 
                    fill="#34d399" 
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip Card */}
        {activeHoverPoint && (
          <div 
            className="chart-tooltip-box"
            style={{
              left: `${Math.min(Math.max(activeHoverPoint.x - 120, 10), width - 260)}px`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {activeHoverPoint.data.monthName} {activeHoverPoint.data.year}
              </span>
              <span style={{ 
                fontSize: '0.68rem', 
                padding: '0.1rem 0.45rem', 
                borderRadius: '9999px', 
                background: activeHoverPoint.data.cancellationRatePct > 40 ? 'rgba(244,63,94,0.2)' : 'rgba(52,211,153,0.15)',
                color: activeHoverPoint.data.cancellationRatePct > 40 ? '#fda4af' : '#34d399',
                fontWeight: 700 
              }}>
                {activeHoverPoint.data.cancellationRatePct}% Churn Risk
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.78rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="chart-tip-label-pred" style={{ fontWeight: 600 }}>● Predicted Cancellations:</span>
                <span style={{ fontWeight: 800, color: '#f43f5e' }}>
                  {activeHoverPoint.data.predictedCancellations} Stays
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="chart-tip-label-sched" style={{ fontWeight: 600 }}>● Total Scheduled Stays:</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  {activeHoverPoint.data.totalBookings} Bookings
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="chart-tip-label-risk" style={{ fontWeight: 600 }}>● High Risk Alerts (≥60%):</span>
                <span style={{ fontWeight: 700, color: '#fbbf24' }}>
                  {activeHoverPoint.data.highRiskCount} Reservations
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.25rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Revenue Exposure:</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  ${activeHoverPoint.data.revenueAtRisk.toLocaleString()}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Highest Churn Segment:</span>
                <span style={{ fontWeight: 600, color: 'var(--ostro-sand)' }}>
                  {activeHoverPoint.data.topSegment}
                </span>
              </div>
            </div>

            <div style={{ marginTop: '0.5rem', fontSize: '0.68rem', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center' }}>
              💡 Click point to filter reservation roster to {activeHoverPoint.data.monthName}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MANAGERIAL PREPAREDNESS & ACTION PLAYBOOK */}
      {/* ========================================================================= */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '1rem',
        paddingTop: '0.5rem'
      }}>
        
        {/* Action Card 1: Adaptive Overbooking Buffer */}
        <div className="chart-playbook-card" style={{ border: '1px solid rgba(244, 63, 94, 0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(244,63,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={15} color="#f43f5e" />
            </div>
            <span className="chart-playbook-title">
              Adaptive Overbooking Buffer
            </span>
          </div>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {peakMonth 
              ? `Recommended overbooking allowance of +${Math.min(Math.round(peakMonth.cancellationRatePct * 0.8), 25)}% in ${peakMonth.monthName} to offset projected dropouts.`
              : 'Maintain standard +10% capacity overbooking allowance for baseline operations.'}
          </p>
        </div>

        {/* Action Card 2: Deposit & Pre-Authorization Policy */}
        <div className="chart-playbook-card" style={{ border: '1px solid rgba(245, 158, 11, 0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldAlert size={15} color="#f59e0b" />
            </div>
            <span className="chart-playbook-title">
              Deposit & Tariff Enforcement
            </span>
          </div>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Require 1-night card pre-authorizations for high-risk lead times (&gt;45 days) in {peakMonth ? peakMonth.monthName : 'upcoming months'} to lock in commitments.
          </p>
        </div>

        {/* Action Card 3: Automated Concierge Pre-Arrival Cadence */}
        <div className="chart-playbook-card" style={{ border: '1px solid rgba(52, 211, 153, 0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(52,211,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={15} color="#34d399" />
            </div>
            <span className="chart-playbook-title">
              Pre-Arrival Concierge Outreach
            </span>
          </div>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Trigger personalized WhatsApp and email dining confirmations 14 days prior to arrival for Online TA bookings to convert tentative bookings to definite stays.
          </p>
        </div>

      </div>

    </div>
  );
}
