import React, { useState, useMemo } from 'react';
import { 
  Calendar, AlertOctagon, AlertTriangle, ShieldAlert, 
  DoorClosed, BedDouble, DollarSign, Users, Sparkles, 
  ArrowRight, PhoneCall, Mail, CreditCard, RefreshCw, 
  CheckCircle2, Clock, Eye, ChevronRight, HelpCircle, Flame
} from 'lucide-react';

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

function formatDisplayDate(dateStr) {
  if (!dateStr) return 'No Date Selected';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    }
  } catch (e) {}
  return dateStr;
}

export default function DailyCancellationInspector({ 
  reservations = [], 
  selectedDate, 
  onSelectDate,
  onInspectBooking,
  onCancelReservation
}) {
  const [actionFeedback, setActionFeedback] = useState({});

  // Collect all distinct arrival dates that have active bookings
  const availableBookingDates = useMemo(() => {
    const datesMap = {};
    reservations.forEach(r => {
      if (r.status === 'cancelled') return;
      const d = r.check_in_date;
      if (d) {
        if (!datesMap[d]) {
          datesMap[d] = { date: d, count: 0, highRiskCount: 0, totalRooms: 0 };
        }
        datesMap[d].count += 1;
        datesMap[d].totalRooms += (r.room_count || 1);
        const prob = r.prediction ? (r.prediction.cancellation_probability || (r.prediction.cancellation_probability_pct / 100) || 0) : 0.2;
        if (prob >= 0.6) {
          datesMap[d].highRiskCount += 1;
        }
      }
    });

    return Object.values(datesMap).sort((a, b) => a.date.localeCompare(b.date));
  }, [reservations]);

  // Current active date: if none selected, default to the first upcoming date with bookings
  const activeDate = selectedDate || (availableBookingDates.length > 0 ? availableBookingDates[0].date : '');

  // Bookings arriving on the active date
  const dateBookings = useMemo(() => {
    if (!activeDate) return [];
    return reservations.filter(r => {
      if (r.status === 'cancelled') return false;
      return r.check_in_date === activeDate;
    });
  }, [reservations, activeDate]);

  // Daily Room & Reservation Cancellation Metrics
  const dailyMetrics = useMemo(() => {
    let totalReservations = dateBookings.length;
    let totalRooms = 0;
    let predictedCancellationsSum = 0;
    let predictedCancelledRoomsSum = 0;
    let totalScheduledRevenue = 0;
    let revenueAtRisk = 0;
    let highRiskList = [];
    let medRiskList = [];
    let lowRiskList = [];

    dateBookings.forEach(bk => {
      const rooms = bk.room_count || 1;
      totalRooms += rooms;

      const pred = bk.prediction;
      const prob = pred ? (pred.cancellation_probability || (pred.cancellation_probability_pct / 100) || 0) : 0.25;
      const riskLevel = pred ? pred.risk_level : (prob >= 0.6 ? 'high' : prob >= 0.35 ? 'medium' : 'low');

      predictedCancellationsSum += prob;
      predictedCancelledRoomsSum += rooms * prob;

      const nights = (bk.stays_in_weekend_nights || 0) + (bk.stays_in_week_nights || 1);
      const rev = (bk.adr || 145) * nights * rooms;
      totalScheduledRevenue += rev;
      revenueAtRisk += rev * prob;

      const enrichedBk = {
        ...bk,
        computedProb: prob,
        computedProbPct: Math.round(prob * 100),
        computedRooms: rooms,
        computedNights: nights,
        computedRevenue: rev,
        computedRevenueAtRisk: Math.round(rev * prob)
      };

      if (riskLevel === 'high') {
        highRiskList.push(enrichedBk);
      } else if (riskLevel === 'medium') {
        medRiskList.push(enrichedBk);
      } else {
        lowRiskList.push(enrichedBk);
      }
    });

    const expectedCancelledReservations = Math.round(predictedCancellationsSum * 10) / 10;
    const expectedCancelledRooms = Math.round(predictedCancelledRoomsSum * 10) / 10;
    const roomChurnRatePct = totalRooms > 0 ? Math.round((expectedCancelledRooms / totalRooms) * 100) : 0;
    const resChurnRatePct = totalReservations > 0 ? Math.round((expectedCancelledReservations / totalReservations) * 100) : 0;
    const guaranteedRooms = Math.max(0, Math.round(totalRooms - expectedCancelledRooms));

    return {
      totalReservations,
      totalRooms,
      expectedCancelledReservations,
      expectedCancelledRooms,
      roomChurnRatePct,
      resChurnRatePct,
      guaranteedRooms,
      totalScheduledRevenue: Math.round(totalScheduledRevenue),
      revenueAtRisk: Math.round(revenueAtRisk),
      highRiskList,
      medRiskList,
      lowRiskList,
      highRiskRoomsCount: highRiskList.reduce((acc, b) => acc + b.computedRooms, 0)
    };
  }, [dateBookings]);

  // Handle tactical quick-action simulation
  const handleQuickAction = (ref, actionType) => {
    setActionFeedback(prev => ({
      ...prev,
      [ref]: actionType
    }));
  };

  return (
    <div className="glass-panel" style={{ 
      padding: '1.75rem', 
      borderRadius: '20px', 
      border: '1px solid rgba(245, 158, 11, 0.35)', 
      background: 'linear-gradient(135deg, rgba(20, 24, 35, 0.96) 0%, rgba(35, 22, 18, 0.92) 100%)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
      position: 'relative',
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
    }}>
      
      {/* Top Banner: Title & Target Arrival Date Navigator */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.25rem 0.75rem', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: '9999px', fontSize: '0.74rem', color: '#fde68a', fontWeight: 600, marginBottom: '0.45rem' }}>
            <Calendar size={13} color="#f59e0b" />
            <span>DAILY CANCELLATION & ROOM INVENTORY READINESS ENGINE</span>
          </div>
          <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span>Target Date Cancellation Inspector</span>
            <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.65rem', borderRadius: '9999px', background: 'rgba(244, 63, 94, 0.2)', color: '#fda4af', border: '1px solid rgba(244, 63, 94, 0.4)', fontWeight: 700 }}>
              Prior Risk Warning
            </span>
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', marginTop: '0.25rem', maxWidth: '720px' }}>
            Select any arrival date to analyze <strong>how many rooms and reservations will cancel</strong>. Review guests with high cancellation risk so staff can secure deposits, reconfirm bookings, or prepare overbooking buffers.
          </p>
        </div>

        {/* Date Selector Input & Navigation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '260px' }}>
          <label style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ostro-sand)', fontWeight: 700 }}>
            Select Arrival Date:
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input 
              type="date"
              className="input-field"
              value={activeDate}
              onChange={(e) => onSelectDate && onSelectDate(e.target.value)}
              style={{ padding: '0.55rem 0.85rem', fontSize: '0.9rem', fontWeight: 600, background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(245, 158, 11, 0.5)', color: '#fff' }}
            />
            {activeDate && (
              <button
                type="button"
                className="preset-btn"
                onClick={() => onSelectDate && onSelectDate('')}
                style={{ padding: '0.55rem 0.85rem', fontSize: '0.78rem', color: '#fda4af', borderColor: 'rgba(244, 63, 94, 0.4)' }}
                title="Clear selected date"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Date Selector Chips (Dates with active bookings on file) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', paddingTop: '0.25rem' }}>
        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Clock size={13} />
          Active Arrival Dates On Record:
        </span>
        {availableBookingDates.slice(0, 8).map(d => {
          const isSelected = activeDate === d.date;
          return (
            <button
              key={d.date}
              type="button"
              onClick={() => onSelectDate && onSelectDate(d.date)}
              style={{
                fontSize: '0.74rem',
                fontWeight: isSelected ? 700 : 500,
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: isSelected ? 'linear-gradient(135deg, #c87d55 0%, #a85d35 100%)' : 'rgba(255, 255, 255, 0.04)',
                color: isSelected ? '#ffffff' : '#e2e8f0',
                border: `1px solid ${isSelected ? '#f59e0b' : 'rgba(255, 255, 255, 0.1)'}`,
                boxShadow: isSelected ? '0 4px 14px rgba(200, 125, 85, 0.4)' : 'none'
              }}
            >
              <span>{formatDisplayDate(d.date)}</span>
              <span style={{ 
                fontSize: '0.66rem', 
                padding: '0.05rem 0.35rem', 
                borderRadius: '9999px', 
                background: d.highRiskCount > 0 ? 'rgba(244, 63, 94, 0.3)' : 'rgba(0,0,0,0.3)',
                color: d.highRiskCount > 0 ? '#fda4af' : '#cbd5e1',
                fontWeight: 700
              }}>
                {d.totalRooms} Rms {d.highRiskCount > 0 && `(⚠️ ${d.highRiskCount})`}
              </span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 4 CORE EXECUTIVE METRICS FOR THIS SELECTED DATE */}
      {/* ========================================================================= */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', 
        gap: '1rem' 
      }}>
        
        {/* Metric 1: Cancelled Rooms Forecast */}
        <div style={{
          padding: '1.25rem',
          borderRadius: '16px',
          background: dailyMetrics.expectedCancelledRooms > 0 
            ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.14) 0%, rgba(20, 24, 34, 0.8) 100%)'
            : 'rgba(255, 255, 255, 0.03)',
          border: `1px solid ${dailyMetrics.expectedCancelledRooms > 0 ? 'rgba(244, 63, 94, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#fda4af', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <BedDouble size={14} color="#f43f5e" />
                Rooms Predicted to Cancel
              </span>
              <span style={{ fontSize: '0.72rem', padding: '0.1rem 0.45rem', borderRadius: '9999px', background: 'rgba(244, 63, 94, 0.2)', color: '#fda4af', fontWeight: 700 }}>
                {dailyMetrics.roomChurnRatePct}% Churn
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.2rem' }}>
              <span style={{ fontSize: '2.2rem', fontWeight: 800, color: '#f43f5e', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                ~{dailyMetrics.expectedCancelledRooms}
              </span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                of {dailyMetrics.totalRooms} Rooms Booked
              </span>
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#fecdd3', marginTop: '0.65rem', lineHeight: 1.4 }}>
            {dailyMetrics.expectedCancelledRooms > 0
              ? `Prepare to re-market or overbook ~${Math.ceil(dailyMetrics.expectedCancelledRooms)} room(s) to avoid empty inventory.`
              : 'Zero rooms forecasted to cancel on this arrival date.'}
          </p>
        </div>

        {/* Metric 2: Cancelled Reservations Forecast */}
        <div style={{
          padding: '1.25rem',
          borderRadius: '16px',
          background: dailyMetrics.expectedCancelledReservations > 0 
            ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(20, 24, 34, 0.8) 100%)'
            : 'rgba(255, 255, 255, 0.03)',
          border: `1px solid ${dailyMetrics.expectedCancelledReservations > 0 ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#fde68a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Users size={14} color="#f59e0b" />
                Reservations to Cancel
              </span>
              <span style={{ fontSize: '0.72rem', padding: '0.1rem 0.45rem', borderRadius: '9999px', background: 'rgba(245, 158, 11, 0.2)', color: '#fde68a', fontWeight: 700 }}>
                {dailyMetrics.resChurnRatePct}% Churn
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.2rem' }}>
              <span style={{ fontSize: '2.2rem', fontWeight: 800, color: '#f59e0b', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                ~{dailyMetrics.expectedCancelledReservations}
              </span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                of {dailyMetrics.totalReservations} Stays
              </span>
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#fef3c7', marginTop: '0.65rem', lineHeight: 1.4 }}>
            Weighted sum of AI cancellation probabilities for all guests scheduled on {formatDisplayDate(activeDate)}.
          </p>
        </div>

        {/* Metric 3: Revenue Exposure At Stake */}
        <div style={{
          padding: '1.25rem',
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.09)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ostro-sand-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <DollarSign size={14} color="#34d399" />
                Revenue Exposure At Stake
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.2rem' }}>
              <span style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                ${dailyMetrics.revenueAtRisk.toLocaleString()}
              </span>
              <span style={{ fontSize: '0.82rem', color: '#fda4af' }}>
                at risk
              </span>
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.65rem' }}>
            Out of ${dailyMetrics.totalScheduledRevenue.toLocaleString()} scheduled gross value for this arrival date.
          </p>
        </div>

        {/* Metric 4: Guaranteed Arrival Rooms (Net Rooms Expected) */}
        <div style={{
          padding: '1.25rem',
          borderRadius: '16px',
          background: 'rgba(16, 185, 129, 0.06)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckCircle2 size={14} color="#34d399" />
                Net Guaranteed Rooms
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.2rem' }}>
              <span style={{ fontSize: '2.2rem', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                {dailyMetrics.guaranteedRooms}
              </span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Guaranteed Rooms
              </span>
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#a7f3d0', marginTop: '0.65rem' }}>
            High-confidence arrivals expected to check in and occupy suites on this date.
          </p>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* HIGH-RISK CANCELLATION WATCHLIST FOR THIS DATE */}
      {/* ========================================================================= */}
      <div style={{ 
        padding: '1.5rem', 
        borderRadius: '16px', 
        background: 'rgba(15, 20, 30, 0.65)', 
        border: '1px solid rgba(244, 63, 94, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem'
      }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(244,63,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Flame size={15} color="#f43f5e" />
              </div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
                High-Risk Cancellation Watchlist for {formatDisplayDate(activeDate)} ({dailyMetrics.highRiskList.length})
              </h4>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              These reservations carry a severe likelihood ($\ge 60\%$) of cancelling. Managers should review them prior to check-in to enact preventative protocols.
            </p>
          </div>

          <span style={{ 
            fontSize: '0.76rem', 
            padding: '0.25rem 0.75rem', 
            borderRadius: '9999px', 
            background: dailyMetrics.highRiskList.length > 0 ? 'rgba(244, 63, 94, 0.2)' : 'rgba(52, 211, 153, 0.15)',
            color: dailyMetrics.highRiskList.length > 0 ? '#fda4af' : '#34d399',
            border: `1px solid ${dailyMetrics.highRiskList.length > 0 ? 'rgba(244, 63, 94, 0.4)' : 'rgba(52, 211, 153, 0.3)'}`,
            fontWeight: 700 
          }}>
            {dailyMetrics.highRiskList.length > 0 
              ? `⚠️ ${dailyMetrics.highRiskRoomsCount} Room(s) Impacted at High Risk`
              : '✅ Zero High-Risk Bookings on this Date'}
          </span>
        </div>

        {dailyMetrics.highRiskList.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '2.5rem 1rem', 
            background: 'rgba(255, 255, 255, 0.02)', 
            borderRadius: '12px',
            border: '1px dashed rgba(255, 255, 255, 0.1)' 
          }}>
            <CheckCircle2 size={36} color="#34d399" style={{ margin: '0 auto 0.75rem auto' }} />
            <h5 style={{ fontSize: '1rem', color: '#fff', marginBottom: '0.25rem' }}>
              No High-Risk Cancellations Detected on {formatDisplayDate(activeDate)}
            </h5>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '460px', margin: '0 auto' }}>
              All scheduled arrivals for this date are categorized as Low or Medium risk with strong arrival indicators.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {dailyMetrics.highRiskList.map((bk) => {
              const feedback = actionFeedback[bk.booking_ref];

              return (
                <div 
                  key={bk.booking_ref}
                  style={{
                    padding: '1.35rem',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, rgba(24, 20, 26, 0.9) 0%, rgba(15, 18, 26, 0.95) 100%)',
                    border: '1px solid rgba(244, 63, 94, 0.35)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
                  }}
                >
                  <div>
                    {/* Header: Guest Name & Risk Percentage */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <h5 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                            {bk.guest_name || 'Anonymous Guest'}
                          </h5>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            #{bk.booking_ref}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--ostro-sand)' }}>
                          {bk.guest_email || 'No email on file'}
                        </span>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ 
                          fontSize: '0.8rem', 
                          padding: '0.2rem 0.55rem', 
                          borderRadius: '9999px', 
                          background: 'rgba(244, 63, 94, 0.25)', 
                          color: '#fda4af', 
                          border: '1px solid rgba(244, 63, 94, 0.5)',
                          fontWeight: 800 
                        }}>
                          {bk.computedProbPct}% RISK
                        </span>
                      </div>
                    </div>

                    {/* Room & Value Specs */}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(2, 1fr)', 
                      gap: '0.65rem', 
                      padding: '0.75rem', 
                      borderRadius: '10px', 
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      marginBottom: '0.75rem',
                      fontSize: '0.78rem'
                    }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>ROOMS AT STAKE</span>
                        <strong style={{ color: '#fda4af', fontSize: '0.92rem' }}>
                          {bk.computedRooms} {bk.computedRooms > 1 ? 'Rooms' : 'Room'} (Type {bk.reserved_room_type || 'A'})
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>FINANCIAL EXPOSURE</span>
                        <strong style={{ color: '#fff', fontSize: '0.92rem' }}>
                          ${bk.computedRevenue} (${bk.adr}/nt)
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>BOOKING CHANNEL</span>
                        <span style={{ color: '#e2e8f0' }}>{bk.market_segment || 'Direct'}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>LEAD TIME</span>
                        <span style={{ color: '#e2e8f0' }}>{bk.lead_time} Days Ahead</span>
                      </div>
                    </div>

                    {/* AI Key Risk Drivers */}
                    <div style={{ marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fda4af', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>
                        Top AI Cancellation Risk Factors:
                      </span>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {bk.prediction?.key_risk_drivers && bk.prediction.key_risk_drivers.length > 0 ? (
                          bk.prediction.key_risk_drivers.slice(0, 2).map((driver, idx) => (
                            <li key={idx} style={{ fontSize: '0.74rem', color: '#cbd5e1', display: 'flex', alignItems: 'flex-start', gap: '0.35rem', lineHeight: 1.35 }}>
                              <span style={{ color: '#f43f5e', flexShrink: 0 }}>•</span>
                              <span>{driver}</span>
                            </li>
                          ))
                        ) : (
                          <li style={{ fontSize: '0.74rem', color: '#cbd5e1', display: 'flex', alignItems: 'flex-start', gap: '0.35rem' }}>
                            <span style={{ color: '#f43f5e' }}>•</span>
                            <span>High lead time with flexible {bk.deposit_type || 'No Deposit'} tariff structure.</span>
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Managerial Tactical Preparedness Actions */}
                  <div style={{ paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {feedback ? (
                      <div style={{ 
                        padding: '0.45rem 0.75rem', 
                        borderRadius: '8px', 
                        background: 'rgba(52, 211, 153, 0.15)', 
                        border: '1px solid rgba(52, 211, 153, 0.3)', 
                        color: '#34d399', 
                        fontSize: '0.74rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.4rem',
                        fontWeight: 600
                      }}>
                        <CheckCircle2 size={13} />
                        <span>Action Recorded: {feedback}</span>
                      </div>
                    ) : null}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => handleQuickAction(bk.booking_ref, 'Deposit Guarantee Requested')}
                        style={{
                          fontSize: '0.73rem',
                          padding: '0.35rem 0.65rem',
                          borderRadius: '8px',
                          background: 'rgba(245, 158, 11, 0.15)',
                          color: '#fde68a',
                          border: '1px solid rgba(245, 158, 11, 0.35)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                        title="Send SMS/Email requesting credit card guarantee"
                      >
                        <CreditCard size={12} />
                        <span>Request Deposit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickAction(bk.booking_ref, 'Concierge Reconfirmation Sent')}
                        style={{
                          fontSize: '0.73rem',
                          padding: '0.35rem 0.65rem',
                          borderRadius: '8px',
                          background: 'rgba(99, 102, 241, 0.15)',
                          color: '#c7d2fe',
                          border: '1px solid rgba(99, 102, 241, 0.35)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                        title="Contact guest with arrival itinerary"
                      >
                        <Mail size={12} />
                        <span>Reconfirm</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onInspectBooking && onInspectBooking(bk)}
                        style={{
                          fontSize: '0.73rem',
                          padding: '0.35rem 0.65rem',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: '#ffffff',
                          border: '1px solid rgba(255, 255, 255, 0.18)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          cursor: 'pointer',
                          fontWeight: 600,
                          marginLeft: 'auto'
                        }}
                      >
                        <Eye size={12} />
                        <span>Inspect AI</span>
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
}
