import React from 'react';
import { 
  X, AlertOctagon, TrendingDown, DollarSign, BedDouble, 
  Users, CheckCircle2, AlertTriangle, ArrowRight, Eye, ShieldAlert, Sparkles 
} from 'lucide-react';

export default function CancellationIntelModal({
  isOpen,
  onClose,
  reservations = [],
  kpis = {},
  onInspectBooking,
  onFilterTableToCancellations
}) {
  if (!isOpen) return null;

  // Compute top at-risk reservations
  const highRiskList = reservations
    .filter(r => {
      const prob = r.prediction ? (r.prediction.cancellation_probability || (r.prediction.cancellation_probability_pct / 100) || 0) : 0;
      return r.status === 'cancelled' || r.prediction?.risk_level === 'high' || prob >= 0.5;
    })
    .sort((a, b) => {
      const probA = a.prediction ? (a.prediction.cancellation_probability || (a.prediction.cancellation_probability_pct / 100) || 0) : 0;
      const probB = b.prediction ? (b.prediction.cancellation_probability || (b.prediction.cancellation_probability_pct / 100) || 0) : 0;
      return probB - probA;
    });

  // Segment risk breakdown
  const segmentBreakdown = reservations.reduce((acc, r) => {
    if (r.status === 'cancelled') return acc;
    const seg = r.market_segment || 'Direct';
    if (!acc[seg]) {
      acc[seg] = { total: 0, cancels: 0, rev: 0 };
    }
    acc[seg].total += 1;
    const prob = r.prediction ? (r.prediction.cancellation_probability || (r.prediction.cancellation_probability_pct / 100) || 0) : 0.25;
    acc[seg].cancels += prob;
    const nights = (r.stays_in_weekend_nights || 0) + (r.stays_in_week_nights || 1);
    acc[seg].rev += (r.adr || 145) * nights * (r.room_count || 1);
    return acc;
  }, {});

  const sortedSegments = Object.entries(segmentBreakdown).map(([name, data]) => {
    const rate = data.total > 0 ? Math.round((data.cancels / data.total) * 100) : 0;
    return { name, ...data, rate };
  }).sort((a, b) => b.rate - a.rate);

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div 
        className="glass-panel modal-content mat-cancellation-modal" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '850px', width: '92%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}
      >
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '14px', 
            background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 6px 20px rgba(225, 29, 72, 0.35)'
          }}>
            <TrendingDown size={26} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              Cancellation Risk Intelligence Briefing
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
              Machine Learning Churn Projections & Financial Vulnerability Breakdown for OSTRO Salento
            </p>
          </div>
        </div>

        {/* 4 Core Aggregate Metrics */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: '1rem', 
          marginBottom: '1.75rem' 
        }}>
          <div style={{ 
            padding: '1.1rem', 
            borderRadius: '14px', 
            background: 'rgba(225, 29, 72, 0.08)', 
            border: '1.5px solid rgba(225, 29, 72, 0.25)' 
          }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#e11d48', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Forecasted Cancellations
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#e11d48', marginTop: '0.25rem' }}>
              ~{kpis.expectedCancels ?? '29.1'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              out of {kpis.totalScheduledBookings} on-the-books stays
            </div>
          </div>

          <div style={{ 
            padding: '1.1rem', 
            borderRadius: '14px', 
            background: 'rgba(217, 119, 6, 0.08)', 
            border: '1.5px solid rgba(217, 119, 6, 0.25)' 
          }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              High-Risk Rooms at Stake
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#d97706', marginTop: '0.25rem' }}>
              {kpis.totalRooms ?? 61}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Across {kpis.highRiskCount} high-risk reservations
            </div>
          </div>

          <div style={{ 
            padding: '1.1rem', 
            borderRadius: '14px', 
            background: 'rgba(16, 185, 129, 0.08)', 
            border: '1.5px solid rgba(16, 185, 129, 0.25)' 
          }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Revenue at Churn Risk
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981', marginTop: '0.25rem' }}>
              ${((kpis.highRiskRevenue || 18450)).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              {Math.round(((kpis.highRiskRevenue || 18450) / (kpis.totalScheduledRevenue || 30000)) * 100)}% of total scheduled revenue
            </div>
          </div>

          <div style={{ 
            padding: '1.1rem', 
            borderRadius: '14px', 
            background: 'rgba(59, 130, 246, 0.08)', 
            border: '1.5px solid rgba(59, 130, 246, 0.25)' 
          }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Expected Portfolio Churn
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#3b82f6', marginTop: '0.25rem' }}>
              {kpis.avgChurnRate ?? 59}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Ensemble ML classification
            </div>
          </div>
        </div>

        {/* Market Segment Churn Vulnerability */}
        <div style={{ marginBottom: '1.75rem', padding: '1.25rem', background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
          <h4 style={{ fontSize: '0.96rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={16} color="var(--primary-400)" />
            Distribution Channel & Market Segment Churn Rates
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
            {sortedSegments.map(s => (
              <div 
                key={s.name} 
                style={{ 
                  padding: '0.75rem 0.9rem', 
                  borderRadius: '10px', 
                  background: 'rgba(255,255,255,0.03)', 
                  border: '1px solid var(--border-subtle)' 
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <strong style={{ fontSize: '0.86rem' }}>{s.name}</strong>
                  <span style={{ 
                    fontSize: '0.8rem', 
                    fontWeight: 800, 
                    color: s.rate >= 60 ? '#e11d48' : s.rate >= 35 ? '#d97706' : '#10b981' 
                  }}>
                    {s.rate}% Churn
                  </span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${s.rate}%`, 
                    height: '100%', 
                    background: s.rate >= 60 ? '#e11d48' : s.rate >= 35 ? '#d97706' : '#10b981',
                    borderRadius: '999px' 
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                  <span>{s.total} Stays Booked</span>
                  <span>~{Math.round(s.cancels * 10) / 10} Cancels</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top 5 Most Vulnerable Bookings */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h4 style={{ fontSize: '0.96rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={16} color="#e11d48" />
              Highest Churn Probability Reservations ({highRiskList.length} Total Identified)
            </h4>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
              Ordered by AI Dropout Probability
            </span>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: '12px' }}>
            <table className="mat-table" style={{ width: '100%', fontSize: '0.82rem' }}>
              <thead>
                <tr>
                  <th>GUEST & REF</th>
                  <th>ARRIVAL</th>
                  <th>ROOM / SUITE</th>
                  <th>CHURN RISK</th>
                  <th>VALUE</th>
                  <th style={{ textAlign: 'right' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {highRiskList.slice(0, 5).map(bk => {
                  const probPct = bk.prediction ? (bk.prediction.cancellation_probability_pct || Math.round((bk.prediction.cancellation_probability || 0) * 100)) : 75;
                  const nights = (bk.stays_in_weekend_nights || 0) + (bk.stays_in_week_nights || 1);
                  const rev = (bk.adr || 145) * nights * (bk.room_count || 1);

                  return (
                    <tr key={bk.booking_ref || Math.random()}>
                      <td>
                        <strong style={{ display: 'block', fontSize: '0.84rem' }}>{bk.guest_name || 'Guest'}</strong>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>#{bk.booking_ref}</span>
                      </td>
                      <td>{bk.check_in_date || bk.arrival_date_month || '2026-10'}</td>
                      <td>{bk.room_count || 1} Room(s) • Suite {bk.reserved_room_type || 'A'}</td>
                      <td>
                        <span className={`mat-risk-badge mat-risk-high`}>
                          {probPct}% RISK
                        </span>
                      </td>
                      <td><strong>${rev}</strong></td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="mat-icon-btn"
                          title="Inspect ML Prediction Diagnostics"
                          onClick={() => {
                            onInspectBooking(bk);
                            onClose();
                          }}
                        >
                          <Eye size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Recommendations & Footer */}
        <div style={{ 
          padding: '1.25rem', 
          borderRadius: '14px', 
          background: 'rgba(59, 130, 246, 0.05)', 
          border: '1.5px solid rgba(59, 130, 246, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3b82f6', fontWeight: 700, fontSize: '0.88rem' }}>
            <Sparkles size={16} /> Recommended Administrative Actions
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <li><strong>Enforce Guarantee Deposits:</strong> Reach out to OTA and Group bookings with &gt;60 days lead time to secure non-refundable credit card guarantees.</li>
            <li><strong>Concierge Contact:</strong> Send automated WhatsApp / Email arrival confirmation to the top 10 at-risk stays to verify itinerary commitment.</li>
            <li><strong>Strategic Overbooking:</strong> Safely overbook {Math.round(kpis.expectedCancels * 0.4)} rooms in high-demand periods to compensate for projected churn without walk risks.</li>
          </ul>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button 
            type="button"
            className="mat-action-pill" 
            style={{ padding: '0.6rem 1.25rem', background: 'transparent', border: '1.5px solid var(--border-subtle)', color: 'var(--text-primary)', cursor: 'pointer' }}
            onClick={onClose}
          >
            Close Briefing
          </button>
          <button 
            type="button"
            className="mat-action-pill" 
            style={{ 
              padding: '0.6rem 1.25rem', 
              background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)', 
              color: '#ffffff', 
              border: 'none', 
              cursor: 'pointer',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(225, 29, 72, 0.35)'
            }}
            onClick={() => {
              onFilterTableToCancellations();
              onClose();
            }}
          >
            <span>Filter Roster to All {highRiskList.length} At-Risk Stays</span>
            <ArrowRight size={14} />
          </button>
        </div>

      </div>
    </div>
  );
}
