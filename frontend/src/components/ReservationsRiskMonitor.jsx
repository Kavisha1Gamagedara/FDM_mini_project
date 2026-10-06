import React, { useState, useMemo } from 'react';
import { 
  Calendar, Filter, Layers, AlertTriangle, CheckCircle2, 
  AlertOctagon, Search, Eye, RefreshCw, Clock, 
  TrendingDown, DollarSign, Users, Building2, Sparkles, 
  X, ShieldCheck, ArrowRight, ChevronRight, Ban
} from 'lucide-react';
import MonthlyCancellationLineChart from './MonthlyCancellationLineChart';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function formatDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(d, days) {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
}

export default function ReservationsRiskMonitor({ 
  reservations = [], 
  onSelectBooking, 
  onRefresh, 
  onCancelReservation,
  isLoading = false 
}) {
  const today = new Date();
  const todayStr = formatDate(today);

  // Filters State
  const [selectedDate, setSelectedDate] = useState(''); // '' means all dates
  const [datePreset, setDatePreset] = useState('all'); // 'all' | 'today' | 'next7' | 'next30' | 'custom'
  const [selectedMonth, setSelectedMonth] = useState('all'); // 'all' | 'January' ..
  const [selectedSegment, setSelectedSegment] = useState('all'); // 'all' | 'Direct' | 'Corporate' | 'Groups' | 'Online TA' | ...
  const [selectedRiskTier, setSelectedRiskTier] = useState('all'); // 'all' | 'low' | 'medium' | 'high'
  const [searchQuery, setSearchQuery] = useState('');

  // Handle Date Preset Click
  const handleDatePreset = (preset) => {
    setDatePreset(preset);
    if (preset === 'all') {
      setSelectedDate('');
    } else if (preset === 'today') {
      setSelectedDate(todayStr);
    } else if (preset === 'tomorrow') {
      setSelectedDate(formatDate(addDays(today, 1)));
    } else if (preset === 'next7' || preset === 'next30') {
      setSelectedDate(''); // handled by range logic
    }
  };

  // Helper to extract arrival date string from reservation
  const getArrivalDateStr = (bk) => {
    if (bk.check_in_date) return bk.check_in_date;
    if (bk.created_at && bk.lead_time !== undefined) {
      try {
        const createdDate = new Date(bk.created_at);
        if (!isNaN(createdDate.getTime())) {
          return formatDate(addDays(createdDate, bk.lead_time));
        }
      } catch (e) {}
    }
    return null;
  };

  // Filter reservations based on active criteria
  const filteredReservations = useMemo(() => {
    return reservations.filter(bk => {
      // 1. Search Query (Guest Name, Email, or Booking Ref)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = bk.guest_name && bk.guest_name.toLowerCase().includes(q);
        const emailMatch = bk.guest_email && bk.guest_email.toLowerCase().includes(q);
        const refMatch = bk.booking_ref && bk.booking_ref.toLowerCase().includes(q);
        if (!nameMatch && !emailMatch && !refMatch) return false;
      }

      // 2. Market Segment Filter
      if (selectedSegment !== 'all') {
        const seg = bk.market_segment || 'Direct';
        if (seg.toLowerCase() !== selectedSegment.toLowerCase()) return false;
      }

      // 3. Month Filter
      if (selectedMonth !== 'all') {
        const m = bk.arrival_date_month;
        if (m && m.toLowerCase() !== selectedMonth.toLowerCase()) return false;
      }

      // 4. Date Filter & Presets
      const arrivalDateStr = getArrivalDateStr(bk);
      if (selectedDate) {
        if (arrivalDateStr && arrivalDateStr !== selectedDate) return false;
      } else if (datePreset === 'next7') {
        if (arrivalDateStr) {
          const max7 = formatDate(addDays(today, 7));
          if (arrivalDateStr < todayStr || arrivalDateStr > max7) return false;
        }
      } else if (datePreset === 'next30') {
        if (arrivalDateStr) {
          const max30 = formatDate(addDays(today, 30));
          if (arrivalDateStr < todayStr || arrivalDateStr > max30) return false;
        }
      }

      // 5. Risk Tier Filter
      if (selectedRiskTier !== 'all') {
        const riskLevel = bk.prediction?.risk_level || 'low';
        if (riskLevel !== selectedRiskTier) return false;
      }

      return true;
    });
  }, [reservations, searchQuery, selectedSegment, selectedMonth, selectedDate, datePreset, selectedRiskTier]);

  // Aggregate 3 Risk Categories (Low, Medium, High)
  const stats = useMemo(() => {
    let lowCount = 0;
    let medCount = 0;
    let highCount = 0;
    let totalProbSum = 0;
    let totalScheduledRevenue = 0;
    let highRiskRevenue = 0;

    filteredReservations.forEach(bk => {
      const pred = bk.prediction;
      const prob = pred ? (pred.cancellation_probability || (pred.cancellation_probability_pct / 100) || 0) : 0.2;
      const riskLevel = pred ? pred.risk_level : (prob >= 0.60 ? 'high' : prob >= 0.35 ? 'medium' : 'low');

      if (riskLevel === 'high') highCount++;
      else if (riskLevel === 'medium') medCount++;
      else lowCount++;

      totalProbSum += prob;

      const nights = (bk.stays_in_weekend_nights || 0) + (bk.stays_in_week_nights || 1);
      const rooms = bk.room_count || 1;
      const revenue = (bk.adr || 100) * nights * rooms;
      totalScheduledRevenue += revenue;

      if (riskLevel === 'high') {
        highRiskRevenue += revenue;
      } else if (riskLevel === 'medium') {
        highRiskRevenue += revenue * 0.45;
      }
    });

    const total = filteredReservations.length;
    const lowPct = total > 0 ? ((lowCount / total) * 100).toFixed(1) : '0.0';
    const medPct = total > 0 ? ((medCount / total) * 100).toFixed(1) : '0.0';
    const highPct = total > 0 ? ((highCount / total) * 100).toFixed(1) : '0.0';
    const expectedCancellations = Math.round(totalProbSum * 10) / 10;
    const expectedCancellationRate = total > 0 ? ((expectedCancellations / total) * 100).toFixed(1) : '0.0';

    return {
      total,
      lowCount,
      lowPct,
      medCount,
      medPct,
      highCount,
      highPct,
      expectedCancellations,
      expectedCancellationRate,
      totalScheduledRevenue: Math.round(totalScheduledRevenue),
      highRiskRevenue: Math.round(highRiskRevenue)
    };
  }, [filteredReservations]);

  // Segment Count Pills
  const segmentCounts = useMemo(() => {
    const counts = { all: reservations.length };
    reservations.forEach(r => {
      const seg = r.market_segment || 'Direct';
      counts[seg] = (counts[seg] || 0) + 1;
    });
    return counts;
  }, [reservations]);

  const clearAllFilters = () => {
    setSelectedDate('');
    setDatePreset('all');
    setSelectedMonth('all');
    setSelectedSegment('all');
    setSelectedRiskTier('all');
    setSearchQuery('');
  };

  const hasActiveFilters = Boolean(
    selectedDate || 
    datePreset !== 'all' || 
    selectedMonth !== 'all' || 
    selectedSegment !== 'all' || 
    selectedRiskTier !== 'all' || 
    searchQuery
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
      
      {/* Header Banner & Title */}
      <div className="glass-panel" style={{ 
        padding: '1.5rem 1.75rem', 
        border: '1px solid rgba(99,102,241,0.3)', 
        background: 'linear-gradient(135deg, rgba(17,24,39,0.85) 0%, rgba(30,27,75,0.4) 100%)',
        borderRadius: '18px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.25rem 0.75rem', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)', borderRadius: '9999px', fontSize: '0.74rem', color: '#c7d2fe', fontWeight: 600, marginBottom: '0.5rem' }}>
              <Sparkles size={13} color="#818cf8" />
              <span>Real-Time Operational Cancellation Forecast</span>
            </div>
            <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
              Daily Reservation Risk Monitor & Cancellation Intelligence
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Filter by specific dates and market segments to evaluate how many bookings are projected to cancel on any given day.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              className="preset-btn"
              onClick={onRefresh}
              disabled={isLoading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.5rem 1rem', fontSize: '0.82rem' }}
            >
              <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
              <span>Sync Database ({reservations.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Filter Bar */}
      <div className="glass-panel" style={{ padding: '1.35rem 1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* Row 1: Search & Date Pickers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1.2fr) minmax(180px, 1fr) minmax(140px, 0.8fr) auto', gap: '0.85rem', alignItems: 'end' }}>
          
          {/* Search Input */}
          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label" htmlFor="res-search" style={{ fontSize: '0.75rem' }}>Search Guest or Booking Ref</label>
            <div style={{ position: 'relative' }}>
              <input 
                id="res-search"
                type="text" 
                className="input-field" 
                placeholder="Guest name or #AUR-..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.2rem' }}
              />
              <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          {/* Specific Date Picker */}
          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label" htmlFor="res-date" style={{ fontSize: '0.75rem' }}>
              Target Arrival Date
            </label>
            <input 
              id="res-date"
              type="date" 
              className="input-field" 
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setDatePreset(e.target.value ? 'custom' : 'all');
              }}
            />
          </div>

          {/* Month Selector */}
          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label" htmlFor="res-month" style={{ fontSize: '0.75rem' }}>Month</label>
            <select 
              id="res-month"
              className="select-field"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="all">All Months</option>
              {MONTH_NAMES.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Clear Button */}
          {hasActiveFilters && (
            <button 
              type="button" 
              className="preset-btn"
              onClick={clearAllFilters}
              style={{ height: '42px', display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#fda4af', borderColor: 'rgba(244,63,94,0.3)' }}
              title="Reset all filters"
            >
              <X size={15} />
              <span>Clear</span>
            </button>
          )}

        </div>

        {/* Row 2: Date Quick Presets & Market Segment Pills */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
          
          {/* Quick Date Presets */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Calendar size={13} />
              Date Quick Filter:
            </span>
            {[
              { id: 'all', label: 'All Dates' },
              { id: 'today', label: 'Today' },
              { id: 'tomorrow', label: 'Tomorrow' },
              { id: 'next7', label: 'Next 7 Days' },
              { id: 'next30', label: 'Next 30 Days' }
            ].map(p => (
              <button
                key={p.id}
                type="button"
                className="preset-btn"
                onClick={() => handleDatePreset(p.id)}
                style={{
                  fontSize: '0.74rem',
                  padding: '0.2rem 0.65rem',
                  background: datePreset === p.id && !selectedDate ? 'var(--primary-500)' : undefined,
                  color: datePreset === p.id && !selectedDate ? '#fff' : undefined,
                  borderColor: datePreset === p.id && !selectedDate ? 'var(--primary-500)' : undefined
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Market Segment Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Layers size={13} />
              Market Segment:
            </span>

            {[
              { id: 'all', label: 'All Segments', color: '#94a3b8' },
              { id: 'Direct', label: 'Direct', color: '#34d399' },
              { id: 'Corporate', label: 'Corporate', color: '#818cf8' },
              { id: 'Groups', label: 'Groups', color: '#c084fc' },
              { id: 'Online TA', label: 'Online TA', color: '#fbbf24' },
              { id: 'Offline TA/TO', label: 'Offline TA/TO', color: '#38bdf8' }
            ].map(seg => {
              const isSelected = selectedSegment.toLowerCase() === seg.id.toLowerCase();
              const count = segmentCounts[seg.id] || 0;

              return (
                <button
                  key={seg.id}
                  type="button"
                  onClick={() => setSelectedSegment(seg.id)}
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: isSelected ? 700 : 500,
                    padding: '0.22rem 0.75rem',
                    borderRadius: '9999px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: isSelected ? (seg.id === 'all' ? 'rgba(255,255,255,0.15)' : `${seg.color}22`) : 'rgba(255,255,255,0.03)',
                    color: isSelected ? (seg.id === 'all' ? '#fff' : seg.color) : 'var(--text-secondary)',
                    border: `1px solid ${isSelected ? (seg.id === 'all' ? '#fff' : seg.color) : 'var(--border-subtle)'}`
                  }}
                >
                  <span>{seg.label}</span>
                  <span style={{ 
                    fontSize: '0.66rem', 
                    padding: '0.05rem 0.35rem', 
                    borderRadius: '9999px', 
                    background: 'rgba(0,0,0,0.3)',
                    color: isSelected ? '#fff' : 'var(--text-muted)'
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* EXECUTIVE UPCOMING MONTHS CANCELLATION FORECAST (INTERACTIVE LINE CHART) */}
      {/* ========================================================================= */}
      <MonthlyCancellationLineChart 
        reservations={reservations}
        onSelectMonth={(monthName) => {
          setSelectedMonth(monthName);
          setSelectedDate('');
          setDatePreset('all');
        }}
        selectedMonthFilter={selectedMonth}
      />

      {/* ========================================================================= */}
      {/* 3 RISK CATEGORIES CARDS (Low, Medium, High) & EXPECTED CANCELLATION SUMMARY */}
      {/* ========================================================================= */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        
        {/* 1. Low Risk Card */}
        <div 
          onClick={() => setSelectedRiskTier(selectedRiskTier === 'low' ? 'all' : 'low')}
          style={{
            padding: '1.35rem',
            borderRadius: '16px',
            border: selectedRiskTier === 'low' ? '2px solid var(--risk-low)' : '1px solid rgba(16, 185, 129, 0.3)',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(17, 24, 39, 0.7) 100%)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            position: 'relative',
            boxShadow: selectedRiskTier === 'low' ? '0 0 20px rgba(16, 185, 129, 0.25)' : undefined
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Low Risk (&lt; 35%)
              </span>
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {stats.lowPct}% of portfolio
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '2.1rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
              {stats.lowCount}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>reservations</span>
          </div>

          <p style={{ fontSize: '0.75rem', color: '#a7f3d0', lineHeight: 1.4 }}>
            High arrival confidence. Proceed with standard booking confirmations.
          </p>
        </div>

        {/* 2. Medium Risk Card */}
        <div 
          onClick={() => setSelectedRiskTier(selectedRiskTier === 'medium' ? 'all' : 'medium')}
          style={{
            padding: '1.35rem',
            borderRadius: '16px',
            border: selectedRiskTier === 'medium' ? '2px solid var(--risk-med)' : '1px solid rgba(245, 158, 11, 0.3)',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(17, 24, 39, 0.7) 100%)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            position: 'relative',
            boxShadow: selectedRiskTier === 'medium' ? '0 0 20px rgba(245, 158, 11, 0.25)' : undefined
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 8px #fbbf24' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Medium Risk (35–59%)
              </span>
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {stats.medPct}% of portfolio
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '2.1rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
              {stats.medCount}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>reservations</span>
          </div>

          <p style={{ fontSize: '0.75rem', color: '#fde68a', lineHeight: 1.4 }}>
            Moderate churn likelihood. Send automated confirmation reminders 7 days prior.
          </p>
        </div>

        {/* 3. High Risk Card */}
        <div 
          onClick={() => setSelectedRiskTier(selectedRiskTier === 'high' ? 'all' : 'high')}
          style={{
            padding: '1.35rem',
            borderRadius: '16px',
            border: selectedRiskTier === 'high' ? '2px solid var(--risk-high)' : '1px solid rgba(244, 63, 94, 0.3)',
            background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.08) 0%, rgba(17, 24, 39, 0.7) 100%)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            position: 'relative',
            boxShadow: selectedRiskTier === 'high' ? '0 0 20px rgba(244, 63, 94, 0.25)' : undefined
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f43f5e', boxShadow: '0 0 8px #f43f5e' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f43f5e', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                High Risk (≥ 60%)
              </span>
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {stats.highPct}% of portfolio
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '2.1rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
              {stats.highCount}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>reservations</span>
          </div>

          <p style={{ fontSize: '0.75rem', color: '#fecdd3', lineHeight: 1.4 }}>
            Imminent cancellation danger. Request deposit guarantee or card pre-authorization.
          </p>
        </div>

      </div>

      {/* Expected Daily Cancellations KPI Executive Banner */}
      <div className="glass-panel" style={{ 
        padding: '1.25rem 1.5rem', 
        borderRadius: '16px', 
        border: '1px solid var(--border-medium)', 
        background: 'rgba(255, 255, 255, 0.02)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
        alignItems: 'center'
      }}>
        
        <div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Forecasted Cancellation Volume
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.2rem' }}>
            <span style={{ fontSize: '1.65rem', fontWeight: 800, color: stats.expectedCancellationRate > 35 ? '#fda4af' : '#34d399' }}>
              ~{stats.expectedCancellations} of {stats.total}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              ({stats.expectedCancellationRate}% expected churn)
            </span>
          </div>
          <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {selectedDate ? `On selected arrival date: ${selectedDate}` : 'Across all filtered dates in current view'}
          </p>
        </div>

        <div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Scheduled Revenue Exposure
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.2rem' }}>
            <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#fff' }}>
              ${stats.totalScheduledRevenue.toLocaleString()}
            </span>
            <span style={{ fontSize: '0.8rem', color: '#f43f5e', fontWeight: 600 }}>
              (${stats.highRiskRevenue.toLocaleString()} at risk)
            </span>
          </div>
          <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Calculated from ADR × stay nights × rooms booked
          </p>
        </div>

        <div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Active Filter Summary
          </span>
          <div style={{ marginTop: '0.35rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(99,102,241,0.15)', color: '#c7d2fe' }}>
              Date: {selectedDate || datePreset}
            </span>
            <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(99,102,241,0.15)', color: '#c7d2fe' }}>
              Segment: {selectedSegment}
            </span>
            {selectedRiskTier !== 'all' && (
              <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(244,63,94,0.15)', color: '#fda4af' }}>
                Risk: {selectedRiskTier}
              </span>
            )}
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* FILTERED RESERVATIONS TABLE & LIST */}
      {/* ========================================================================= */}
      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '18px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
            Filtered Reservations Roster ({filteredReservations.length})
          </h4>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Showing reservations matching date & market segment criteria
          </span>
        </div>

        {filteredReservations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <AlertOctagon size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
            <h5 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              No reservations found matching your filter criteria
            </h5>
            <p style={{ fontSize: '0.8rem', maxWidth: '420px', margin: '0 auto 1.25rem auto' }}>
              Try selecting a different arrival date, adjusting the market segment filter, or clearing search keywords.
            </p>
            <button 
              type="button" 
              className="preset-btn"
              onClick={clearAllFilters}
              style={{ margin: '0 auto' }}
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.75rem 0.6rem' }}>Ref & Guest</th>
                  <th style={{ padding: '0.75rem 0.6rem' }}>Arrival Date</th>
                  <th style={{ padding: '0.75rem 0.6rem' }}>Property & Room</th>
                  <th style={{ padding: '0.75rem 0.6rem' }}>Segment & Channel</th>
                  <th style={{ padding: '0.75rem 0.6rem' }}>Revenue</th>
                  <th style={{ padding: '0.75rem 0.6rem' }}>AI Cancellation Forecast</th>
                  <th style={{ padding: '0.75rem 0.6rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReservations.map((bk, i) => {
                  const arrivalDateStr = getArrivalDateStr(bk) || `${bk.arrival_date_month} (Week ${bk.arrival_date_week_number})`;
                  const totalNights = (bk.stays_in_weekend_nights || 0) + (bk.stays_in_week_nights || 1);
                  const rooms = bk.room_count || 1;
                  const totalVal = Math.round((bk.adr || 100) * totalNights * rooms);

                  const pred = bk.prediction;
                  const probPct = pred ? pred.cancellation_probability_pct : 25.0;
                  const riskBand = pred ? pred.risk_band : (probPct >= 60 ? 'High Risk' : probPct >= 35 ? 'Medium Risk' : 'Low Risk');
                  const riskLevel = pred ? pred.risk_level : (probPct >= 60 ? 'high' : probPct >= 35 ? 'medium' : 'low');

                  const seg = bk.market_segment || 'Direct';

                  return (
                    <tr 
                      key={bk.booking_ref || i}
                      style={{ 
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background 0.15s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      onClick={() => onSelectBooking && onSelectBooking(bk)}
                    >
                      {/* Ref & Guest */}
                      <td style={{ padding: '0.85rem 0.6rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, color: '#fff' }}>{bk.guest_name || 'Guest'}</span>
                          {bk.is_repeated_guest === 1 && (
                            <span style={{ 
                              fontSize: '0.62rem', 
                              padding: '0.1rem 0.4rem', 
                              borderRadius: '4px', 
                              background: 'rgba(52, 211, 153, 0.15)', 
                              color: '#34d399', 
                              border: '1px solid rgba(52, 211, 153, 0.35)', 
                              fontWeight: 700 
                            }}>
                              REPEAT
                            </span>
                          )}
                          {bk.previous_cancellations > 0 && (
                            <span style={{ 
                              fontSize: '0.62rem', 
                              padding: '0.1rem 0.4rem', 
                              borderRadius: '4px', 
                              background: 'rgba(244, 63, 94, 0.15)', 
                              color: '#f43f5e', 
                              border: '1px solid rgba(244, 63, 94, 0.35)', 
                              fontWeight: 700 
                            }}>
                              {bk.previous_cancellations} CANCEL
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.15rem' }}>
                          <span style={{ fontSize: '0.72rem', color: '#818cf8', fontFamily: 'monospace' }}>
                            #{bk.booking_ref}
                          </span>
                          {bk.status === 'cancelled' ? (
                            <span style={{ fontSize: '0.62rem', padding: '0.05rem 0.35rem', borderRadius: '3px', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', fontWeight: 700 }}>
                              CANCELLED
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.62rem', padding: '0.05rem 0.35rem', borderRadius: '3px', background: 'rgba(16, 185, 129, 0.12)', color: '#6ee7b7' }}>
                              CONFIRMED
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Arrival Date & Stay */}
                      <td style={{ padding: '0.85rem 0.6rem' }}>
                        <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{arrivalDateStr}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {totalNights} nights ({bk.lead_time || 0}d lead time)
                        </div>
                      </td>

                      {/* Property & Room */}
                      <td style={{ padding: '0.85rem 0.6rem' }}>
                        <div style={{ color: '#fff' }}>{bk.hotel}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          Room {bk.reserved_room_type || 'A'}
                          {rooms > 1 ? ` • ${rooms} Rooms Block` : ''}
                        </div>
                      </td>

                      {/* Market Segment & Channel */}
                      <td style={{ padding: '0.85rem 0.6rem' }}>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '9999px',
                          textTransform: 'uppercase',
                          background: seg === 'Direct' ? 'rgba(16,185,129,0.15)' :
                                      seg === 'Corporate' ? 'rgba(99,102,241,0.15)' :
                                      seg === 'Groups' ? 'rgba(192,132,252,0.15)' : 'rgba(251,191,36,0.15)',
                          color: seg === 'Direct' ? '#34d399' :
                                 seg === 'Corporate' ? '#818cf8' :
                                 seg === 'Groups' ? '#c084fc' : '#fbbf24',
                          border: '1px solid ' + (
                            seg === 'Direct' ? 'rgba(16,185,129,0.35)' :
                            seg === 'Corporate' ? 'rgba(99,102,241,0.35)' :
                            seg === 'Groups' ? 'rgba(192,132,252,0.35)' : 'rgba(251,191,36,0.35)'
                          )
                        }}>
                          {seg}
                        </span>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          Dist: {bk.distribution_channel || 'Direct'}
                        </div>
                      </td>

                      {/* Revenue */}
                      <td style={{ padding: '0.85rem 0.6rem' }}>
                        <div style={{ fontWeight: 700, color: '#34d399' }}>${totalVal}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>${bk.adr}/nt</div>
                      </td>

                      {/* AI Cancellation Forecast */}
                      <td style={{ padding: '0.85rem 0.6rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span className={`risk-band-pill ${riskLevel}`} style={{ fontSize: '0.7rem', padding: '0.12rem 0.45rem' }}>
                            {riskBand}
                          </span>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>
                            {probPct}%
                          </span>
                        </div>
                        {/* Mini risk progress bar */}
                        <div style={{ width: '100px', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ 
                            width: `${Math.min(100, probPct)}%`, 
                            height: '100%', 
                            background: riskLevel === 'high' ? 'var(--risk-high)' : riskLevel === 'medium' ? 'var(--risk-med)' : 'var(--risk-low)' 
                          }} />
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.85rem 0.6rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.4rem' }}>
                          <button
                            type="button"
                            className="preset-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onSelectBooking) onSelectBooking(bk);
                            }}
                            style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                            title="Inspect AI Feature Drivers & SHAP"
                          >
                            <Eye size={12} />
                            <span>AI Inspect</span>
                          </button>
                          {onCancelReservation && bk.status !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onCancelReservation(bk.booking_ref);
                              }}
                              style={{ 
                                fontSize: '0.72rem', 
                                padding: '0.25rem 0.55rem', 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '0.25rem',
                                background: 'rgba(239, 68, 68, 0.12)',
                                border: '1px solid rgba(239, 68, 68, 0.35)',
                                color: '#fca5a5',
                                borderRadius: '6px',
                                cursor: 'pointer'
                              }}
                              title="Mark reservation as cancelled in MongoDB"
                            >
                              <Ban size={12} />
                              <span>Cancel</span>
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
}
