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
    <div className="glass-panel daily-inspector-card" style={{ 
      padding: '1.75rem', 
      borderRadius: '20px', 
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
      position: 'relative'
    }}>
      
      {/* Top Banner: Title & Target Arrival Date Navigator */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
        <div>
          <div className="inspector-header-pill">
            <Calendar size={13} />
            <span>DAILY CANCELLATION & ROOM INVENTORY READINESS ENGINE</span>
          </div>
          <h3 className="inspector-title">
            <span>Target Date Cancellation Inspector</span>
            <span className="inspector-warning-badge">
              Prior Risk Warning
            </span>
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', marginTop: '0.25rem', maxWidth: '720px' }}>
            Select any arrival date to analyze <strong>how many rooms and reservations will cancel</strong>. Review guests with high cancellation risk so staff can secure deposits, reconfirm bookings, or prepare overbooking buffers.
          </p>
        </div>

        {/* Date Selector Input & Navigation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '260px' }}>
          <label className="inspector-date-label">
            Select Arrival Date:
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input 
              type="date"
              className="inspector-date-input"
              value={activeDate}
              onChange={(e) => onSelectDate && onSelectDate(e.target.value)}
            />
            {activeDate && (
              <button
                type="button"
                className="inspector-reset-btn"
                onClick={() => onSelectDate && onSelectDate('')}
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
              className={`inspector-chip ${isSelected ? 'active' : ''}`}
            >
              <span>{formatDisplayDate(d.date)}</span>
              <span className={`inspector-chip-tag ${d.highRiskCount > 0 ? 'danger' : ''}`}>
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
        <div className="inspector-metric-card danger">
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span className="metric-title-danger">
                <BedDouble size={14} />
                Rooms Predicted to Cancel
              </span>
              <span className="metric-badge-danger">
                {dailyMetrics.roomChurnRatePct}% Churn
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.2rem' }}>
              <span className="metric-val-danger">
                ~{dailyMetrics.expectedCancelledRooms}
              </span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                of {dailyMetrics.totalRooms} Rooms Booked
              </span>
            </div>
          </div>
          <p className="metric-sub-danger">
            {dailyMetrics.expectedCancelledRooms > 0
              ? `Prepare to re-market or overbook ~${Math.ceil(dailyMetrics.expectedCancelledRooms)} room(s) to avoid empty inventory.`
              : 'Zero rooms forecasted to cancel on this arrival date.'}
          </p>
        </div>

        {/* Metric 2: Cancelled Reservations Forecast */}
        <div className="inspector-metric-card warning">
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span className="metric-title-warning">
                <Users size={14} />
                Reservations to Cancel
              </span>
              <span className="metric-badge-warning">
                {dailyMetrics.resChurnRatePct}% Churn
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.2rem' }}>
              <span className="metric-val-warning">
                ~{dailyMetrics.expectedCancelledReservations}
              </span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                of {dailyMetrics.totalReservations} Stays
              </span>
            </div>
          </div>
          <p className="metric-sub-warning">
            Weighted sum of AI cancellation probabilities for all guests scheduled on {formatDisplayDate(activeDate)}.
          </p>
        </div>

        {/* Metric 3: Revenue Exposure At Stake */}
        <div className="inspector-metric-card neutral">
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span className="metric-title-neutral">
                <DollarSign size={14} />
                Revenue Exposure At Stake
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.2rem' }}>
              <span className="metric-val-neutral">
                ${dailyMetrics.revenueAtRisk.toLocaleString()}
              </span>
              <span style={{ fontSize: '0.82rem', color: '#e11d48', fontWeight: 600 }}>
                at risk
              </span>
            </div>
          </div>
          <p className="metric-sub-neutral">
            Out of ${dailyMetrics.totalScheduledRevenue.toLocaleString()} scheduled gross value for this arrival date.
          </p>
        </div>

        {/* Metric 4: Guaranteed Arrival Rooms (Net Rooms Expected) */}
        <div className="inspector-metric-card success">
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span className="metric-title-success">
                <CheckCircle2 size={14} />
                Net Guaranteed Rooms
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.2rem' }}>
              <span className="metric-val-success">
                {dailyMetrics.guaranteedRooms}
              </span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Guaranteed Rooms
              </span>
            </div>
          </div>
          <p className="metric-sub-success">
            High-confidence arrivals expected to check in and occupy suites on this date.
          </p>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* HIGH-RISK CANCELLATION WATCHLIST FOR THIS DATE */}
      {/* ========================================================================= */}
      <div className="inspector-watchlist-container">
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(244,63,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Flame size={15} color="#e11d48" />
              </div>
              <h4 className="inspector-watchlist-title">
                High-Risk Cancellation Watchlist for {formatDisplayDate(activeDate)} ({dailyMetrics.highRiskList.length})
              </h4>
            </div>
            <p className="inspector-watchlist-sub">
              These reservations carry a severe likelihood (&ge; 60%) of cancelling. Managers should review them prior to check-in to enact preventative protocols.
            </p>
          </div>

          <span className={`inspector-chip-tag ${dailyMetrics.highRiskList.length > 0 ? 'danger' : ''}`} style={{ padding: '0.25rem 0.75rem', fontSize: '0.76rem' }}>
            {dailyMetrics.highRiskList.length > 0 
              ? `⚠️ ${dailyMetrics.highRiskRoomsCount} Room(s) Impacted at High Risk`
              : '✅ Zero High-Risk Bookings on this Date'}
          </span>
        </div>

        {dailyMetrics.highRiskList.length === 0 ? (
          <div className="inspector-empty-box">
            <CheckCircle2 size={36} color="#059669" style={{ margin: '0 auto 0.75rem auto' }} />
            <h5 className="inspector-empty-title">
              No High-Risk Cancellations Detected on {formatDisplayDate(activeDate)}
            </h5>
            <p className="inspector-empty-desc">
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
                  className="inspector-booking-card"
                >
                  <div>
                    {/* Header: Guest Name & Risk Percentage */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <h5 className="inspector-card-guest-name">
                            {bk.guest_name || 'Anonymous Guest'}
                          </h5>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            #{bk.booking_ref}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {bk.guest_email || 'No email on file'}
                        </span>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span className="metric-badge-danger" style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem', fontWeight: 800 }}>
                          {bk.computedProbPct}% RISK
                        </span>
                      </div>
                    </div>

                    {/* Room & Value Specs */}
                    <div className="inspector-specs-grid">
                      <div>
                        <span style={{ display: 'block', fontSize: '0.7rem' }}>ROOMS AT STAKE</span>
                        <strong style={{ color: '#e11d48', fontSize: '0.92rem' }}>
                          {bk.computedRooms} {bk.computedRooms > 1 ? 'Rooms' : 'Room'} (Type {bk.reserved_room_type || 'A'})
                        </strong>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.7rem' }}>FINANCIAL EXPOSURE</span>
                        <strong style={{ fontSize: '0.92rem' }}>
                          ${bk.computedRevenue} (${bk.adr}/nt)
                        </strong>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.7rem' }}>BOOKING CHANNEL</span>
                        <span>{bk.market_segment || 'Direct'}</span>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.7rem' }}>LEAD TIME</span>
                        <span>{bk.lead_time} Days Ahead</span>
                      </div>
                    </div>

                    {/* AI Key Risk Drivers */}
                    <div style={{ marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#e11d48', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>
                        Top AI Cancellation Risk Factors:
                      </span>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {bk.prediction?.key_risk_drivers && bk.prediction.key_risk_drivers.length > 0 ? (
                          bk.prediction.key_risk_drivers.slice(0, 2).map((driver, idx) => (
                            <li key={idx} style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: '0.35rem', lineHeight: 1.35 }}>
                              <span style={{ color: '#e11d48', flexShrink: 0 }}>•</span>
                              <span>{driver}</span>
                            </li>
                          ))
                        ) : (
                          <li style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: '0.35rem' }}>
                            <span style={{ color: '#e11d48' }}>•</span>
                            <span>High lead time with flexible {bk.deposit_type || 'No Deposit'} tariff structure.</span>
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Managerial Tactical Preparedness Actions */}
                  <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {feedback ? (
                      <div style={{ 
                        padding: '0.45rem 0.75rem', 
                        borderRadius: '8px', 
                        background: 'rgba(52, 211, 153, 0.15)', 
                        border: '1px solid rgba(52, 211, 153, 0.3)', 
                        color: '#059669', 
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
                        className="inspector-action-btn-deposit"
                        title="Send SMS/Email requesting credit card guarantee"
                      >
                        <CreditCard size={12} />
                        <span>Request Deposit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickAction(bk.booking_ref, 'Concierge Reconfirmation Sent')}
                        className="inspector-action-btn-confirm"
                        title="Contact guest with arrival itinerary"
                      >
                        <Mail size={12} />
                        <span>Reconfirm</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onInspectBooking && onInspectBooking(bk)}
                        className="inspector-action-btn-inspect"
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
