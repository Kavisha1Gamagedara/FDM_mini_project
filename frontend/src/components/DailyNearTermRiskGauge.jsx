import React, { useState, useMemo } from 'react';
import { 
  Gauge, Calendar, BedDouble, Users, DollarSign, 
  AlertTriangle, ShieldAlert, CheckCircle2, ChevronRight, 
  ArrowRight, Clock, Sparkles, RefreshCw, Layers, ShieldCheck,
  ChevronDown
} from 'lucide-react';

const ROOM_METADATA = {
  A: { name: 'Deluxe Limestone Suite', color: '#3b82f6', badgeBg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.3)' },
  D: { name: 'Executive Adriatic Suite', color: '#8b5cf6', badgeBg: 'rgba(139, 92, 246, 0.12)', border: 'rgba(139, 92, 246, 0.3)' },
  E: { name: 'Salento Heritage Villa', color: '#f59e0b', badgeBg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)' },
  F: { name: 'Presidential Cliff Penthouse', color: '#ec4899', badgeBg: 'rgba(236, 72, 153, 0.12)', border: 'rgba(236, 72, 153, 0.3)' },
};

function addDays(dateStr, days) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    d.setDate(d.getDate() + days);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return dateStr;
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
    }
  } catch (e) {}
  return dateStr;
}

/**
 * Calibrated Luxury Circular Risk Gauge
 * Features:
 * - High-definition SVG gradients (Emerald, Amber, Rose)
 * - Soft ambient inner glow disc
 * - All percentage, live status, and label text mathematically bounded inside the circle
 * - Never overflows or touches the gauge perimeter
 */
function CircularRiskGaugeComponent({ value = 0, size = 158, strokeWidth = 12 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  const isHigh = clamped >= 50;
  const isMed = clamped >= 25 && clamped < 50;

  // Gradient identifiers and status attributes
  const gradId = isHigh ? 'gauge-rose-grad' : isMed ? 'gauge-amber-grad' : 'gauge-emerald-grad';
  const strokeColor = isHigh ? '#f43f5e' : isMed ? '#f59e0b' : '#10b981';
  const badgeText = isHigh ? 'HIGH RISK' : isMed ? 'MODERATE' : 'LOW RISK';
  const badgeColor = isHigh ? '#e11d48' : isMed ? '#b45309' : '#15803d';
  const badgeBg = isHigh ? 'rgba(225, 29, 72, 0.12)' : isMed ? 'rgba(245, 158, 11, 0.14)' : 'rgba(22, 163, 74, 0.12)';
  const badgeBorder = isHigh ? 'rgba(225, 29, 72, 0.28)' : isMed ? 'rgba(245, 158, 11, 0.28)' : 'rgba(22, 163, 74, 0.28)';
  const glowColor = isHigh ? 'rgba(244, 63, 94, 0.35)' : isMed ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.25)';

  return (
    <div style={{ 
      position: 'relative', 
      width: size, 
      height: size, 
      display: 'inline-flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      flexShrink: 0,
      margin: '0 auto'
    }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id="gauge-emerald-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="gauge-amber-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
          <linearGradient id="gauge-rose-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fb7185" />
            <stop offset="100%" stopColor="#e11d48" />
          </linearGradient>
        </defs>

        {/* Soft Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--gauge-track-color, rgba(148, 163, 184, 0.2))"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Inner Soft Ambient Disc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius - strokeWidth / 2 - 2}
          fill="var(--gauge-inner-disc-bg, rgba(248, 250, 252, 0.8))"
        />

        {/* Dynamic Animated Active Stroke */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          style={{ 
            transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.4s ease',
            filter: `drop-shadow(0 0 6px ${glowColor})`
          }}
        />
      </svg>

      {/* Center text mathematically positioned within the inner disk */}
      <div 
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          pointerEvents: 'none',
          padding: `${strokeWidth + 8}px`,
          boxSizing: 'border-box',
          textAlign: 'center'
        }}
      >
        <span style={{ 
          fontSize: '2rem', 
          fontWeight: 900, 
          lineHeight: 1, 
          letterSpacing: '-0.03em',
          color: 'var(--text-primary, #0f172a)' 
        }}>
          {clamped}%
        </span>
        
        <div style={{ 
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          fontSize: '0.62rem', 
          fontWeight: 800, 
          textTransform: 'uppercase', 
          letterSpacing: '0.04em',
          color: badgeColor,
          background: badgeBg,
          border: `1px solid ${badgeBorder}`,
          padding: '0.14rem 0.45rem',
          borderRadius: '9999px',
          marginTop: '0.25rem',
          lineHeight: 1.1
        }}>
          <span style={{ 
            width: '5px', 
            height: '5px', 
            borderRadius: '50%', 
            background: strokeColor,
            boxShadow: `0 0 5px ${strokeColor}`
          }} />
          <span>{badgeText}</span>
        </div>

        <span style={{ 
          fontSize: '0.64rem', 
          color: 'var(--text-secondary, #64748b)', 
          marginTop: '0.25rem',
          fontWeight: 600,
          lineHeight: 1
        }}>
          Room Dropout Rate
        </span>
      </div>
    </div>
  );
}

export default function DailyNearTermRiskGauge({ 
  reservations = [], 
  onSelectDate, 
  selectedDateFilter 
}) {
  const [horizon, setHorizon] = useState('today'); // 'today' | 'tomorrow' | 'next3' | 'next7'
  
  // Collect all available arrival dates from reservations
  const availableBookingDates = useMemo(() => {
    const datesMap = {};
    reservations.forEach(r => {
      if (r.status === 'cancelled') return;
      const d = r.check_in_date;
      if (d) {
        if (!datesMap[d]) {
          datesMap[d] = { date: d, count: 0, totalRooms: 0 };
        }
        datesMap[d].count += 1;
        datesMap[d].totalRooms += (r.room_count || 1);
      }
    });
    return Object.values(datesMap).sort((a, b) => a.date.localeCompare(b.date));
  }, [reservations]);

  // System local calendar today
  const systemTodayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Determine baseline operational date
  const defaultAnchorDate = useMemo(() => {
    if (selectedDateFilter) return selectedDateFilter;
    const hasTodayBookings = availableBookingDates.some(b => b.date === systemTodayStr);
    if (hasTodayBookings) return systemTodayStr;
    if (availableBookingDates.length > 0) return availableBookingDates[0].date;
    return systemTodayStr;
  }, [selectedDateFilter, availableBookingDates, systemTodayStr]);

  const [anchorDate, setAnchorDate] = useState(defaultAnchorDate);

  // Sync if selectedDateFilter changes externally
  React.useEffect(() => {
    if (selectedDateFilter) {
      setAnchorDate(selectedDateFilter);
    }
  }, [selectedDateFilter]);

  // Compute target dates array based on selected horizon
  const { targetDates, dateRangeDisplay } = useMemo(() => {
    const base = anchorDate || defaultAnchorDate;
    if (horizon === 'today') {
      return {
        targetDates: [base],
        dateRangeDisplay: formatDateDisplay(base)
      };
    }
    if (horizon === 'tomorrow') {
      const tomorrow = addDays(base, 1);
      return {
        targetDates: [tomorrow],
        dateRangeDisplay: formatDateDisplay(tomorrow)
      };
    }
    if (horizon === 'next3') {
      const d1 = addDays(base, 1);
      const d2 = addDays(base, 2);
      return {
        targetDates: [base, d1, d2],
        dateRangeDisplay: `${formatDateDisplay(base)} – ${formatDateDisplay(d2)}`
      };
    }
    // next7
    const dates = [0, 1, 2, 3, 4, 5, 6].map(i => addDays(base, i));
    return {
      targetDates: dates,
      dateRangeDisplay: `${formatDateDisplay(base)} – ${formatDateDisplay(dates[dates.length - 1])}`
    };
  }, [anchorDate, defaultAnchorDate, horizon]);

  // Filter reservations in the target date window
  const horizonBookings = useMemo(() => {
    const dateSet = new Set(targetDates);
    return reservations.filter(r => dateSet.has(r.check_in_date));
  }, [reservations, targetDates]);

  // Aggregate Horizon Metrics
  const metrics = useMemo(() => {
    let totalScheduledBookings = 0;
    let totalScheduledRooms = 0;
    let expectedCancelledReservations = 0;
    let expectedCancelledRooms = 0;
    let alreadyCancelledCount = 0;
    let totalScheduledRevenue = 0;
    let revenueAtRisk = 0;
    let highRiskCount = 0;

    horizonBookings.forEach(bk => {
      const rooms = bk.room_count || 1;

      if (bk.status === 'cancelled') {
        alreadyCancelledCount += 1;
        return;
      }

      totalScheduledBookings += 1;
      totalScheduledRooms += rooms;

      const pred = bk.prediction;
      const prob = pred ? (pred.cancellation_probability || (pred.cancellation_probability_pct / 100) || 0) : 0.25;
      const riskLevel = pred ? pred.risk_level : (prob >= 0.5 ? 'high' : 'low');

      if (riskLevel === 'high' || prob >= 0.5) {
        highRiskCount += 1;
      }

      expectedCancelledReservations += prob;
      expectedCancelledRooms += rooms * prob;

      const nights = (bk.stays_in_weekend_nights || 0) + (bk.stays_in_week_nights || 1);
      const rev = (bk.adr || 145) * nights * rooms;
      totalScheduledRevenue += rev;
      revenueAtRisk += rev * prob;
    });

    const expRoomsRounded = Math.round(expectedCancelledRooms * 10) / 10;
    const expResRounded = Math.round(expectedCancelledReservations * 10) / 10;
    const roomChurnPct = totalScheduledRooms > 0 ? Math.round((expRoomsRounded / totalScheduledRooms) * 100) : 0;
    const resChurnPct = totalScheduledBookings > 0 ? Math.round((expResRounded / totalScheduledBookings) * 100) : 0;
    const guaranteedRooms = Math.max(0, Math.round(totalScheduledRooms - expRoomsRounded));

    return {
      totalScheduledBookings,
      totalScheduledRooms,
      expectedCancelledReservations: expResRounded,
      expectedCancelledRooms: expRoomsRounded,
      alreadyCancelledCount,
      roomChurnPct,
      resChurnPct,
      guaranteedRooms,
      totalScheduledRevenue: Math.round(totalScheduledRevenue),
      revenueAtRisk: Math.round(revenueAtRisk),
      highRiskCount
    };
  }, [horizonBookings]);

  // Breakdown by Booked Room Type (Suite A, D, E, F)
  const roomTypeBreakdown = useMemo(() => {
    const map = {};

    Object.keys(ROOM_METADATA).forEach(code => {
      map[code] = {
        code,
        name: ROOM_METADATA[code].name,
        color: ROOM_METADATA[code].color,
        badgeBg: ROOM_METADATA[code].badgeBg,
        border: ROOM_METADATA[code].border,
        totalBookings: 0,
        totalRooms: 0,
        expectedCancelledRooms: 0,
        alreadyCancelledRooms: 0,
        revenueAtRisk: 0
      };
    });

    horizonBookings.forEach(bk => {
      const code = (bk.reserved_room_type || 'A').toUpperCase();
      if (!map[code]) {
        map[code] = {
          code,
          name: `Suite ${code}`,
          color: '#64748b',
          badgeBg: 'rgba(100, 116, 139, 0.12)',
          border: 'rgba(100, 116, 139, 0.3)',
          totalBookings: 0,
          totalRooms: 0,
          expectedCancelledRooms: 0,
          alreadyCancelledRooms: 0,
          revenueAtRisk: 0
        };
      }

      const rooms = bk.room_count || 1;
      if (bk.status === 'cancelled') {
        map[code].alreadyCancelledRooms += rooms;
        return;
      }

      const pred = bk.prediction;
      const prob = pred ? (pred.cancellation_probability || (pred.cancellation_probability_pct / 100) || 0) : 0.25;
      const nights = (bk.stays_in_weekend_nights || 0) + (bk.stays_in_week_nights || 1);
      const rev = (bk.adr || 145) * nights * rooms;

      map[code].totalBookings += 1;
      map[code].totalRooms += rooms;
      map[code].expectedCancelledRooms += rooms * prob;
      map[code].revenueAtRisk += rev * prob;
    });

    const list = Object.values(map);
    const withBookings = list.filter(r => r.totalRooms > 0 || r.alreadyCancelledRooms > 0);
    const displayList = withBookings.length > 0 ? withBookings : list.slice(0, 3);

    return displayList.map(item => {
      const expRooms = Math.round(item.expectedCancelledRooms * 10) / 10;
      const churnRate = item.totalRooms > 0 ? Math.round((expRooms / item.totalRooms) * 100) : 0;
      const safeRooms = Math.max(0, Math.round(item.totalRooms - expRooms));
      return {
        ...item,
        expRooms,
        churnRate,
        safeRooms,
        revAtRisk: Math.round(item.revenueAtRisk)
      };
    });
  }, [horizonBookings]);

  const handleDrilldown = () => {
    if (onSelectDate && targetDates.length > 0) {
      onSelectDate(targetDates[0]);
    }
    const elem = document.getElementById('daily-inspector-section');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div 
      className="mat-card mat-risk-gauge-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.35rem',
        borderRadius: '18px',
        padding: '1.65rem 1.75rem',
        boxSizing: 'border-box'
      }}
    >
      {/* 1. Header: Title, Live Pill & Subtitle */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ 
              width: '34px', 
              height: '34px', 
              borderRadius: '10px', 
              background: 'linear-gradient(135deg, rgba(200, 125, 85, 0.18), rgba(200, 125, 85, 0.08))', 
              color: '#c87d55', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: '1px solid rgba(200, 125, 85, 0.3)'
            }}>
              <Gauge size={19} />
            </div>
            <div>
              <h4 className="mat-card-title" style={{ fontSize: '1.12rem', fontWeight: 800, letterSpacing: '-0.015em', margin: 0 }}>
                Near-Term Cancellation Risk Gauge
              </h4>
            </div>
          </div>

          <span style={{ 
            fontSize: '0.72rem', 
            color: '#c87d55', 
            background: 'rgba(200, 125, 85, 0.1)', 
            border: '1px solid rgba(200, 125, 85, 0.28)', 
            padding: '0.22rem 0.65rem', 
            borderRadius: '9999px', 
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}>
            <Sparkles size={11} />
            Predictive AI Active
          </span>
        </div>

        <p style={{ fontSize: '0.79rem', color: '#64748b', marginTop: '0.35rem', marginBottom: 0, lineHeight: 1.4 }}>
          Daily & tomorrow dropout summary calibrated by room type to prepare front-desk overbooking & outreach.
        </p>

        {/* 2. Horizon Segmented Control */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '4px',
          marginTop: '0.9rem',
          padding: '4px',
          background: 'var(--mat-tab-track-bg, #f1f5f9)',
          borderRadius: '11px',
          border: '1px solid var(--border-color, #e2e8f0)'
        }}>
          {[
            { id: 'today', label: 'Today' },
            { id: 'tomorrow', label: 'Tomorrow' },
            { id: 'next3', label: 'Next 3 Days' },
            { id: 'next7', label: 'Next 7 Days' }
          ].map(tab => {
            const isActive = horizon === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setHorizon(tab.id)}
                className={`gauge-horizon-pill ${isActive ? 'active' : ''}`}
                style={{
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.42rem 0.2rem',
                  borderRadius: '8px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  textAlign: 'center',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: isActive ? 'linear-gradient(135deg, #c87d55, #b86a42)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-secondary, #64748b)',
                  boxShadow: isActive ? '0 2px 8px rgba(200, 125, 85, 0.35)' : 'none'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 3. Styled Date Range & Anchor Selector Bar */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          flexWrap: 'wrap', 
          gap: '0.5rem', 
          marginTop: '0.65rem',
          padding: '0.4rem 0.75rem',
          background: 'var(--mat-subtle-box-bg, #f8fafc)',
          borderRadius: '10px',
          border: '1px solid var(--mat-subtle-box-border, #e2e8f0)',
          fontSize: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>
            <Calendar size={13} style={{ color: '#c87d55' }} />
            <span>{dateRangeDisplay}</span>
          </div>

          {availableBookingDates.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Anchor:</span>
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                <select
                  value={anchorDate}
                  onChange={(e) => setAnchorDate(e.target.value)}
                  style={{
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    background: 'var(--mat-select-bg, #ffffff)',
                    border: '1px solid var(--mat-select-border, #cbd5e1)',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    padding: '0.2rem 1.4rem 0.2rem 0.55rem',
                    color: 'inherit',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                  title="Select base operational arrival date"
                >
                  {availableBookingDates.map(b => (
                    <option key={b.date} value={b.date}>
                      {b.date} ({b.count} stays)
                    </option>
                  ))}
                </select>
                <ChevronDown size={12} style={{ position: 'absolute', right: '6px', pointerEvents: 'none', color: '#64748b' }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Hero Section: Showcase Circular Gauge */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '1.1rem 1rem',
        background: 'var(--mat-subtle-box-bg, #f8fafc)',
        borderRadius: '16px',
        border: '1px solid var(--mat-subtle-box-border, #e2e8f0)',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)'
      }}>
        <CircularRiskGaugeComponent value={metrics.roomChurnPct} size={156} strokeWidth={12} />
      </div>

      {/* 5. Executive Metric Cards: Spacious 2x2 Grid Spanning Full Width */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '0.75rem',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        
        {/* Metric 1: Reservations Churn */}
        <div style={{ 
          padding: '0.8rem 0.85rem', 
          borderRadius: '12px', 
          background: 'var(--mat-chip-bg, #ffffff)', 
          border: '1px solid var(--mat-chip-border, #e2e8f0)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
          transition: 'all 0.2s ease',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.3rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Users size={13} style={{ color: '#3b82f6' }} />
              Stays
            </span>
            <span style={{ 
              fontSize: '0.67rem', 
              fontWeight: 800, 
              color: metrics.resChurnPct > 40 ? '#be123c' : '#15803d',
              background: metrics.resChurnPct > 40 ? 'rgba(225, 29, 72, 0.1)' : 'rgba(22, 163, 74, 0.1)',
              padding: '0.12rem 0.4rem',
              borderRadius: '5px',
              whiteSpace: 'nowrap'
            }}>
              {metrics.resChurnPct}% churn
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginTop: '0.15rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: metrics.expectedCancelledReservations > 0 ? '#e11d48' : 'var(--text-primary, #1e293b)' }}>
              ~{metrics.expectedCancelledReservations}
            </span>
            <span style={{ fontSize: '0.74rem', color: '#64748b', whiteSpace: 'nowrap' }}>
              of {metrics.totalScheduledBookings} stays
            </span>
          </div>

          <span style={{ fontSize: '0.68rem', color: metrics.alreadyCancelledCount > 0 ? '#be123c' : '#64748b', fontWeight: 600, marginTop: '0.1rem' }}>
            {metrics.alreadyCancelledCount > 0 ? `(${metrics.alreadyCancelledCount} cancelled previously)` : '0 prior dropouts'}
          </span>
        </div>

        {/* Metric 2: Rooms Impact */}
        <div style={{ 
          padding: '0.8rem 0.85rem', 
          borderRadius: '12px', 
          background: 'var(--mat-chip-bg, #ffffff)', 
          border: '1px solid var(--mat-chip-border, #e2e8f0)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
          transition: 'all 0.2s ease',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.3rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <BedDouble size={13} style={{ color: '#8b5cf6' }} />
              Rooms
            </span>
            <span style={{ 
              fontSize: '0.67rem', 
              fontWeight: 800, 
              color: metrics.roomChurnPct > 40 ? '#be123c' : '#15803d',
              background: metrics.roomChurnPct > 40 ? 'rgba(225, 29, 72, 0.1)' : 'rgba(22, 163, 74, 0.1)',
              padding: '0.12rem 0.4rem',
              borderRadius: '5px',
              whiteSpace: 'nowrap'
            }}>
              {metrics.roomChurnPct}% risk
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginTop: '0.15rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: metrics.expectedCancelledRooms > 0 ? '#e11d48' : 'var(--text-primary, #1e293b)' }}>
              ~{metrics.expectedCancelledRooms}
            </span>
            <span style={{ fontSize: '0.74rem', color: '#64748b', whiteSpace: 'nowrap' }}>
              of {metrics.totalScheduledRooms} rooms
            </span>
          </div>

          <span style={{ fontSize: '0.68rem', color: '#15803d', fontWeight: 700, marginTop: '0.1rem', whiteSpace: 'nowrap' }}>
            🛡️ {metrics.guaranteedRooms} Guaranteed Safe
          </span>
        </div>

        {/* Metric 3: Revenue Exposure */}
        <div style={{ 
          padding: '0.8rem 0.85rem', 
          borderRadius: '12px', 
          background: 'var(--mat-chip-bg, #ffffff)', 
          border: '1px solid var(--mat-chip-border, #e2e8f0)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
          transition: 'all 0.2s ease',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}>
          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <DollarSign size={13} style={{ color: '#10b981' }} />
            Revenue at Risk
          </span>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginTop: '0.15rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: metrics.revenueAtRisk > 0 ? '#e11d48' : 'var(--text-primary, #1e293b)' }}>
              ${metrics.revenueAtRisk.toLocaleString()}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#64748b', whiteSpace: 'nowrap' }}>
              exposure
            </span>
          </div>

          <span style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '0.1rem', whiteSpace: 'nowrap' }}>
            of ${metrics.totalScheduledRevenue.toLocaleString()} gross value
          </span>
        </div>

        {/* Metric 4: High Risk Bookings */}
        <div style={{ 
          padding: '0.8rem 0.85rem', 
          borderRadius: '12px', 
          background: 'var(--mat-chip-bg, #ffffff)', 
          border: '1px solid var(--mat-chip-border, #e2e8f0)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
          transition: 'all 0.2s ease',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}>
          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <AlertTriangle size={13} style={{ color: '#f59e0b' }} />
            High Risk Stays
          </span>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginTop: '0.15rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: metrics.highRiskCount > 0 ? '#b45309' : 'var(--text-primary, #1e293b)' }}>
              {metrics.highRiskCount}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#64748b', whiteSpace: 'nowrap' }}>
              critical
            </span>
          </div>

          <span style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '0.1rem', whiteSpace: 'nowrap' }}>
            ≥50% cancellation prob
          </span>
        </div>

      </div>

      {/* 6. Booked Room Type Dropout Breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h5 style={{ 
            fontSize: '0.85rem', 
            fontWeight: 800, 
            letterSpacing: '0.015em', 
            color: 'var(--text-primary, #1e293b)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            margin: 0
          }}>
            <Layers size={14} style={{ color: '#c87d55' }} />
            Cancelled Rooms by Booked Room Type
          </h5>
          <span style={{ fontSize: '0.71rem', color: '#64748b', fontWeight: 600 }}>
            {horizonBookings.length === 0 ? 'No arrivals' : `${metrics.totalScheduledRooms} Rooms on books`}
          </span>
        </div>

        {horizonBookings.length === 0 ? (
          <div style={{ 
            padding: '1.2rem', 
            borderRadius: '12px', 
            background: 'var(--mat-subtle-box-bg, #f8fafc)', 
            border: '1.5px dashed var(--mat-subtle-box-border, #cbd5e1)',
            textAlign: 'center',
            fontSize: '0.8rem',
            color: '#64748b'
          }}>
            <p style={{ margin: 0 }}>No guest check-ins scheduled for this specific date window.</p>
            {availableBookingDates.length > 0 && (
              <button
                type="button"
                onClick={() => setAnchorDate(availableBookingDates[0].date)}
                style={{
                  marginTop: '0.5rem',
                  background: '#c87d55',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.35rem 0.8rem',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Switch to Earliest Active Arrival ({availableBookingDates[0].date})
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {roomTypeBreakdown.map(rt => {
              const isHigh = rt.churnRate > 40;
              const hasActivity = rt.totalRooms > 0 || rt.alreadyCancelledRooms > 0;

              return (
                <div 
                  key={rt.code}
                  className="room-type-impact-row"
                  style={{
                    padding: '0.75rem 0.95rem',
                    borderRadius: '12px',
                    background: 'var(--mat-subtle-box-bg, #f8fafc)',
                    border: '1px solid var(--mat-subtle-box-border, #e2e8f0)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    opacity: hasActivity ? 1 : 0.65,
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                    
                    {/* Left: Suite Type Badge & Name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        fontWeight: 800, 
                        color: rt.color, 
                        background: rt.badgeBg, 
                        border: `1px solid ${rt.border}`, 
                        padding: '0.15rem 0.48rem', 
                        borderRadius: '6px',
                        whiteSpace: 'nowrap'
                      }}>
                        Suite {rt.code}
                      </span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>
                        {rt.name}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        ({rt.totalBookings} {rt.totalBookings === 1 ? 'stay' : 'stays'})
                      </span>
                    </div>

                    {/* Right: Room Cancel Count & Churn Rate */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-primary, #1e293b)', fontWeight: 700 }}>
                        <span style={{ color: rt.expRooms > 0 ? '#e11d48' : 'inherit' }}>
                          ~{rt.expRooms}
                        </span>
                        <span style={{ color: '#64748b', fontWeight: 500 }}> / {rt.totalRooms} Rms</span>
                      </span>

                      <span style={{ 
                        fontSize: '0.71rem', 
                        fontWeight: 800, 
                        color: isHigh ? '#be123c' : rt.churnRate > 20 ? '#b45309' : '#15803d',
                        background: isHigh ? 'rgba(225, 29, 72, 0.1)' : rt.churnRate > 20 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(22, 163, 74, 0.1)',
                        padding: '0.12rem 0.42rem',
                        borderRadius: '5px',
                        border: `1px solid ${isHigh ? 'rgba(225, 29, 72, 0.25)' : rt.churnRate > 20 ? 'rgba(245, 158, 11, 0.25)' : 'rgba(22, 163, 74, 0.25)'}`,
                        whiteSpace: 'nowrap'
                      }}>
                        {rt.churnRate}% churn
                      </span>
                    </div>

                  </div>

                  {/* Progress Bar for Room Type Churn */}
                  <div style={{ width: '100%', height: '7px', background: 'var(--mat-progress-bg, #e2e8f0)', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${Math.min(rt.churnRate, 100)}%`, 
                      height: '100%', 
                      borderRadius: '9999px',
                      background: isHigh 
                        ? 'linear-gradient(90deg, #f43f5e, #be123c)' 
                        : rt.churnRate > 20 
                          ? 'linear-gradient(90deg, #f59e0b, #d97706)' 
                          : 'linear-gradient(90deg, #10b981, #059669)',
                      boxShadow: isHigh ? '0 0 6px rgba(225, 29, 72, 0.35)' : 'none',
                      transition: 'width 0.5s ease'
                    }} />
                  </div>

                  {/* Subtitle: Safe rooms & revenue exposure */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.71rem', color: '#64748b' }}>
                    <span>Safe: <strong style={{ color: '#15803d' }}>{rt.safeRooms} rooms</strong></span>
                    {rt.revAtRisk > 0 ? (
                      <span>At Risk: <strong style={{ color: '#e11d48' }}>${rt.revAtRisk.toLocaleString()}</strong></span>
                    ) : (
                      <span style={{ color: '#15803d', fontWeight: 600 }}>Zero exposure</span>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 7. Card Footer: Drilldown & Synchronize */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingTop: '0.75rem', 
        borderTop: '1px solid var(--mat-subtle-box-border, #f1f5f9)',
        fontSize: '0.75rem',
        color: '#64748b',
        marginTop: '0.2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Clock size={13} />
          <span>Real-time guest cancellation forecast</span>
        </div>

        <button
          type="button"
          onClick={handleDrilldown}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: 'transparent',
            border: 'none',
            color: '#c87d55',
            fontWeight: 700,
            cursor: 'pointer',
            padding: '0.2rem 0.4rem',
            borderRadius: '6px',
            transition: 'all 0.2s ease'
          }}
          title="Scroll down to inspect individual booking rows and trigger actions"
        >
          <span>Drill into Date in Engine</span>
          <ArrowRight size={13} />
        </button>
      </div>

    </div>
  );
}
