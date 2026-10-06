import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, CalendarCheck, UserCheck, Layers, 
  HelpCircle, ShieldCheck, AlertOctagon, Sparkles, Eye, 
  ArrowRight, Search, Bell, Settings, LogOut, ExternalLink, 
  DollarSign, Users, TrendingDown, BedDouble, CheckCircle2, 
  Clock, ShieldAlert, ArrowUpRight, ArrowDownRight, RefreshCw, 
  Building2, CreditCard, Mail, Trash2, ChevronRight, Filter, 
  Compass, Flame, FileText, Check, Maximize2, Minimize2
} from 'lucide-react';
import MonthlyCancellationLineChart from './MonthlyCancellationLineChart';
import DailyCancellationInspector from './DailyCancellationInspector';
import SinglePrediction from './SinglePrediction';
import BatchPrediction from './BatchPrediction';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function AdminMaterialDashboard({
  reservations = [],
  selectedCustomerBooking,
  onSelectBooking,
  activeTab = 'monitor',
  setActiveTab,
  onRefresh,
  onCancelReservation,
  isLoading = false,
  metadata,
  apiBaseUrl,
  currentUser,
  onLogout,
  onSwitchToCustomer,
  onOpenIntel
}) {
  // Local Filter States for Reservations Table
  const [tableSearch, setTableSearch] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedRiskTier, setSelectedRiskTier] = useState('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState('');
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [chartExpanded, setChartExpanded] = useState(false);

  // Overall KPI aggregates
  const kpis = useMemo(() => {
    let totalScheduledRevenue = 0;
    let totalScheduledBookings = reservations.filter(r => r.status !== 'cancelled').length;
    let predictedCancelsSum = 0;
    let highRiskCount = 0;
    let totalRooms = 0;
    let highRiskRevenue = 0;

    reservations.forEach(r => {
      if (r.status === 'cancelled') return;
      const rooms = r.room_count || 1;
      totalRooms += rooms;

      const pred = r.prediction;
      const prob = pred ? (pred.cancellation_probability || (pred.cancellation_probability_pct / 100) || 0) : 0.25;
      const riskLevel = pred ? pred.risk_level : (prob >= 0.6 ? 'high' : prob >= 0.35 ? 'medium' : 'low');

      predictedCancelsSum += prob;
      if (riskLevel === 'high') {
        highRiskCount++;
      }

      const nights = (r.stays_in_weekend_nights || 0) + (r.stays_in_week_nights || 1);
      const rev = (r.adr || 145) * nights * rooms;
      totalScheduledRevenue += rev;

      if (riskLevel === 'high') {
        highRiskRevenue += rev;
      }
    });

    const expectedCancels = Math.round(predictedCancelsSum * 10) / 10;
    const avgChurnRate = totalScheduledBookings > 0 
      ? Math.round((expectedCancels / totalScheduledBookings) * 100) 
      : 0;

    return {
      totalScheduledRevenue: Math.round(totalScheduledRevenue),
      totalScheduledBookings,
      expectedCancels,
      highRiskCount,
      totalRooms,
      avgChurnRate,
      highRiskRevenue: Math.round(highRiskRevenue)
    };
  }, [reservations]);

  // Market Segment Risk Breakdown for the 3rd Middle Card
  const segmentStats = useMemo(() => {
    const map = {
      'Direct': { count: 0, cancels: 0, rev: 0 },
      'Online TA': { count: 0, cancels: 0, rev: 0 },
      'Corporate': { count: 0, cancels: 0, rev: 0 },
      'Groups': { count: 0, cancels: 0, rev: 0 },
      'Offline TA/TO': { count: 0, cancels: 0, rev: 0 }
    };

    reservations.forEach(r => {
      if (r.status === 'cancelled') return;
      const seg = r.market_segment || 'Direct';
      if (!map[seg]) {
        map[seg] = { count: 0, cancels: 0, rev: 0 };
      }
      map[seg].count += 1;
      const prob = r.prediction ? (r.prediction.cancellation_probability || (r.prediction.cancellation_probability_pct / 100) || 0) : 0.25;
      map[seg].cancels += prob;
    });

    return Object.entries(map).map(([name, data]) => {
      const rate = data.count > 0 ? Math.round((data.cancels / data.count) * 100) : 0;
      return { name, count: data.count, rate, cancels: Math.round(data.cancels * 10) / 10 };
    }).sort((a, b) => b.rate - a.rate);
  }, [reservations]);

  // Filtered reservations for the bottom table
  const filteredBookings = useMemo(() => {
    return reservations.filter(r => {
      if (tableSearch.trim()) {
        const q = tableSearch.toLowerCase().trim();
        const mName = r.guest_name && r.guest_name.toLowerCase().includes(q);
        const mEmail = r.guest_email && r.guest_email.toLowerCase().includes(q);
        const mRef = r.booking_ref && r.booking_ref.toLowerCase().includes(q);
        if (!mName && !mEmail && !mRef) return false;
      }

      if (selectedSegment !== 'all' && (r.market_segment || 'Direct').toLowerCase() !== selectedSegment.toLowerCase()) {
        return false;
      }

      if (selectedMonth !== 'all' && r.arrival_date_month && r.arrival_date_month.toLowerCase() !== selectedMonth.toLowerCase()) {
        return false;
      }

      if (selectedDateFilter && r.check_in_date && r.check_in_date !== selectedDateFilter) {
        return false;
      }

      if (selectedRiskTier !== 'all') {
        const risk = r.prediction?.risk_level || 'low';
        if (risk !== selectedRiskTier) return false;
      }

      return true;
    });
  }, [reservations, tableSearch, selectedSegment, selectedMonth, selectedDateFilter, selectedRiskTier]);

  // High-Risk Prior Warning Timeline Items (for bottom right card)
  const highRiskTimeline = useMemo(() => {
    return reservations
      .filter(r => {
        if (r.status === 'cancelled') return false;
        const prob = r.prediction ? (r.prediction.cancellation_probability || (r.prediction.cancellation_probability_pct / 100) || 0) : 0.2;
        return prob >= 0.6 || r.prediction?.risk_level === 'high';
      })
      .slice(0, 5);
  }, [reservations]);

  return (
    <div className="mat-layout">
      
      {/* =========================================================================
          LEFT SIDENAV / SIDEBAR (Matches Material Dashboard 3 Screenshot)
          ========================================================================= */}
      <aside className="mat-sidebar">
        
        {/* Brand Header */}
        <div className="mat-brand">
          <div className="mat-brand-icon">
            <Compass size={22} color="#ffffff" />
          </div>
          <div className="mat-brand-text">
            <h4>OSTRO Executive</h4>
            <span>Predictive PMS v2.4</span>
          </div>
        </div>

        {/* Main Navigation Links */}
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="mat-section-title">MAIN OPERATIONAL PAGES</div>
          <ul className="mat-nav-list">
            <li>
              <button 
                type="button"
                className={`mat-nav-item ${activeTab === 'monitor' ? 'active' : ''}`}
                onClick={() => setActiveTab('monitor')}
              >
                <div className="mat-nav-icon">
                  <LayoutDashboard size={17} />
                </div>
                <span>Dashboard & Risk Monitor</span>
              </button>
            </li>

            <li>
              <button 
                type="button"
                className={`mat-nav-item ${activeTab === 'single' ? 'active' : ''}`}
                onClick={() => setActiveTab('single')}
              >
                <div className="mat-nav-icon">
                  <UserCheck size={17} />
                </div>
                <span>Single AI Inspector</span>
              </button>
            </li>

            <li>
              <button 
                type="button"
                className={`mat-nav-item ${activeTab === 'batch' ? 'active' : ''}`}
                onClick={() => setActiveTab('batch')}
              >
                <div className="mat-nav-icon">
                  <Layers size={17} />
                </div>
                <span>Batch Portfolio CSV</span>
              </button>
            </li>

            <li>
              <button 
                type="button"
                className="mat-nav-item"
                onClick={onOpenIntel}
              >
                <div className="mat-nav-icon">
                  <Sparkles size={17} />
                </div>
                <span>XGBoost Architecture</span>
              </button>
            </li>
          </ul>

          <div className="mat-section-title" style={{ marginTop: '1.5rem' }}>GUEST & ACCOUNT PAGES</div>
          <ul className="mat-nav-list">
            <li>
              <button 
                type="button"
                className="mat-nav-item"
                onClick={onSwitchToCustomer}
                style={{ color: '#0284c7' }}
              >
                <div className="mat-nav-icon" style={{ background: 'rgba(2, 132, 199, 0.1)', color: '#0284c7' }}>
                  <ExternalLink size={16} />
                </div>
                <span style={{ fontWeight: 600 }}>Return to Guest Sanctuary</span>
              </button>
            </li>

            <li>
              <button 
                type="button"
                className="mat-nav-item"
                onClick={onLogout}
                style={{ color: '#e11d48' }}
              >
                <div className="mat-nav-icon" style={{ background: 'rgba(225, 29, 72, 0.1)', color: '#e11d48' }}>
                  <LogOut size={16} />
                </div>
                <span>Sign Out ({currentUser?.name || 'Admin'})</span>
              </button>
            </li>
          </ul>
        </div>

        {/* Sidebar Footer Card (Matches "Documentation / Upgrade to Pro" in screenshot) */}
        <div className="mat-sidebar-footer-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <ShieldCheck size={16} color="#34d399" />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#344767' }}>
              ML Model Health: 100%
            </span>
          </div>
          <p style={{ fontSize: '0.72rem', color: '#7b809a', lineHeight: 1.4, marginBottom: '0.75rem' }}>
            XGBoost Champion active with MongoDB automated session sync.
          </p>
          <button 
            type="button" 
            className="mat-sidebar-btn"
            onClick={onSwitchToCustomer}
          >
            <span>Preview Guest Experience</span>
            <ArrowRight size={13} />
          </button>
        </div>

      </aside>

      {/* =========================================================================
          MAIN MATERIAL CONTENT AREA (Matches Layout & Cards in Screenshot)
          ========================================================================= */}
      <main className="mat-main-content">
        
        {/* Top Navbar: Breadcrumbs, Title, Search & Utilities */}
        <header className="mat-topbar">
          <div>
            <div className="mat-breadcrumbs">
              <span>Pages</span>
              <span>/</span>
              <strong style={{ color: '#344767' }}>
                {activeTab === 'monitor' ? 'Dashboard' : activeTab === 'single' ? 'Single AI Inspector' : 'Batch Portfolio'}
              </strong>
            </div>
            <h2 className="mat-page-title">
              {activeTab === 'monitor' && 'Executive Cancellation Dashboard'}
              {activeTab === 'single' && 'Single Reservation Feature Inspector'}
              {activeTab === 'batch' && 'Batch Portfolio CSV Risk Analyzer'}
            </h2>
            <p style={{ fontSize: '0.84rem', color: '#7b809a', marginTop: '0.15rem' }}>
              Check reservation risk, upcoming cancellations, and room churn forecasts by arrival date.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            
            {/* Search Input */}
            <div className="mat-search-box">
              <Search size={15} color="#7b809a" />
              <input 
                type="text" 
                placeholder="Type here..." 
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
              />
            </div>

            {/* Sync Database Button */}
            <button
              type="button"
              className="mat-action-pill"
              onClick={onRefresh}
              disabled={isLoading}
              title="Sync latest reservations from MongoDB"
            >
              <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
              <span>Sync Database ({reservations.length})</span>
            </button>

            {/* Switch to Guest View Pill */}
            <button 
              type="button"
              className="mat-action-pill mat-action-accent"
              onClick={onSwitchToCustomer}
            >
              <ExternalLink size={14} />
              <span>Guest View</span>
            </button>

            {/* User Profile Pill */}
            <div className="mat-user-badge">
              <div className="mat-user-avatar">A</div>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#344767' }}>
                {currentUser?.email || 'admin@aurastay.com'}
              </span>
            </div>

          </div>
        </header>

        {/* =========================================================================
            ACTIVE VIEW RENDER (DASHBOARD vs SINGLE vs BATCH)
            ========================================================================= */}
        {activeTab === 'single' ? (
          <div className="mat-card" style={{ padding: '2rem' }}>
            {selectedCustomerBooking && (
              <div style={{ 
                padding: '0.85rem 1.25rem', 
                marginBottom: '1.5rem', 
                borderRadius: '12px', 
                background: 'rgba(2, 132, 199, 0.08)', 
                border: '1px solid rgba(2, 132, 199, 0.25)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.86rem', color: '#0369a1' }}>
                  <Sparkles size={16} />
                  <span>
                    Currently Inspecting Live Reservation: <strong>{selectedCustomerBooking.guest_name}</strong> (#{selectedCustomerBooking.booking_ref})
                  </span>
                </div>
                <button 
                  type="button" 
                  className="mat-action-pill"
                  onClick={() => setActiveTab('monitor')}
                  style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                >
                  ← Back to Dashboard
                </button>
              </div>
            )}
            <SinglePrediction 
              metadata={metadata} 
              apiBaseUrl={apiBaseUrl} 
              selectedCustomerBooking={selectedCustomerBooking}
            />
          </div>
        ) : activeTab === 'batch' ? (
          <div className="mat-card" style={{ padding: '2rem' }}>
            <BatchPrediction apiBaseUrl={apiBaseUrl} />
          </div>
        ) : (
          /* =========================================================================
             TAB: MONITOR / DASHBOARD (Exact Creative Tim Material 3 Layout)
             ========================================================================= */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* ROW 1: TOP 4 ELEVATED MATERIAL METRIC CARDS */}
            <div className="mat-stat-grid">
              
              {/* Card 1: Today's / Scheduled Revenue */}
              <div className="mat-stat-card">
                <div className="mat-stat-top">
                  <div>
                    <span className="mat-stat-label">Scheduled Revenue</span>
                    <h3 className="mat-stat-value">
                      ${Math.round(kpis.totalScheduledRevenue / 1000)}k
                    </h3>
                  </div>
                  <div className="mat-icon-box mat-icon-dark">
                    <DollarSign size={22} />
                  </div>
                </div>
                <div className="mat-stat-footer">
                  <span className="mat-trend-up">
                    <ArrowUpRight size={14} /> +55%
                  </span>
                  <span className="mat-trend-text">than last operating cycle</span>
                </div>
              </div>

              {/* Card 2: On-The-Books Stays */}
              <div className="mat-stat-card">
                <div className="mat-stat-top">
                  <div>
                    <span className="mat-stat-label">On-The-Books Stays</span>
                    <h3 className="mat-stat-value">
                      {kpis.totalScheduledBookings}
                    </h3>
                  </div>
                  <div className="mat-icon-box mat-icon-primary">
                    <Users size={22} />
                  </div>
                </div>
                <div className="mat-stat-footer">
                  <span className="mat-trend-up">
                    <ArrowUpRight size={14} /> +12%
                  </span>
                  <span className="mat-trend-text">across upcoming months</span>
                </div>
              </div>

              {/* Card 3: Predicted Cancellations */}
              <div className="mat-stat-card">
                <div className="mat-stat-top">
                  <div>
                    <span className="mat-stat-label">Predicted Cancellations</span>
                    <h3 className="mat-stat-value" style={{ color: '#e11d48' }}>
                      ~{kpis.expectedCancels}
                    </h3>
                  </div>
                  <div className="mat-icon-box mat-icon-danger">
                    <TrendingDown size={22} />
                  </div>
                </div>
                <div className="mat-stat-footer">
                  <span className="mat-trend-danger">
                    <ArrowDownRight size={14} /> {kpis.avgChurnRate}%
                  </span>
                  <span className="mat-trend-text">expected portfolio churn</span>
                </div>
              </div>

              {/* Card 4: Rooms at Risk */}
              <div className="mat-stat-card">
                <div className="mat-stat-top">
                  <div>
                    <span className="mat-stat-label">Rooms at Stake</span>
                    <h3 className="mat-stat-value" style={{ color: '#d97706' }}>
                      {kpis.totalRooms}
                    </h3>
                  </div>
                  <div className="mat-icon-box mat-icon-warning">
                    <BedDouble size={22} />
                  </div>
                </div>
                <div className="mat-stat-footer">
                  <span className="mat-trend-warning">
                    ⚠️ {kpis.highRiskCount} Stays
                  </span>
                  <span className="mat-trend-text">in high-risk cancellation tier</span>
                </div>
              </div>

            </div>

            {/* ROW 2: ANALYTICAL CHARTS / INSPECTORS */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: chartExpanded ? '1fr' : 'minmax(0, 1.65fr) minmax(380px, 1.05fr)', 
              gap: '1.75rem', 
              alignItems: 'start' 
            }}>
              
              {/* Chart Card 1: Upcoming Months Cancellation Line Chart (Significantly Increased Visual Scale) */}
              <div className="mat-card" style={{ padding: 0, overflow: 'hidden', border: '1.5px solid #e2e8f0', boxShadow: '0 6px 25px rgba(0,0,0,0.05)' }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f0f2f5', background: '#fafbfc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.01em' }}>
                        Upcoming Months Cancellation Forecast
                      </h4>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
                        Multi-series trajectory: Predicted Churn, Scheduled Stays & High Risk Alerts across upcoming horizon.
                      </p>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span style={{ fontSize: '0.72rem', color: '#0284c7', background: 'rgba(2, 132, 199, 0.1)', border: '1px solid rgba(2, 132, 199, 0.25)', padding: '0.25rem 0.65rem', borderRadius: '9999px', fontWeight: 700 }}>
                        ● XGBoost Model Live
                      </span>
                      <button
                        type="button"
                        onClick={() => setChartExpanded(prev => !prev)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          background: '#ffffff',
                          border: '1.5px solid #cbd5e1',
                          borderRadius: '8px',
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: '#334155',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                        }}
                        title={chartExpanded ? "Collapse to standard view" : "Expand chart to full width"}
                      >
                        {chartExpanded ? (
                          <>
                            <Minimize2 size={14} color="#0284c7" />
                            <span>Standard View</span>
                          </>
                        ) : (
                          <>
                            <Maximize2 size={14} color="#0284c7" />
                            <span>Full-Width View</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '1.25rem' }}>
                  <MonthlyCancellationLineChart 
                    reservations={reservations}
                    onSelectMonth={(m) => {
                      setSelectedMonth(m);
                      setSelectedDateFilter('');
                    }}
                    selectedMonthFilter={selectedMonth}
                  />
                </div>

                <div style={{ padding: '0.85rem 1.5rem', borderTop: '1px solid #f0f2f5', background: '#fafbfc', fontSize: '0.76rem', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Clock size={14} color="#0284c7" />
                    <span>Real-time inference computed on MongoDB PMS reservation ledger</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    Click any month node to drill into active bookings
                  </span>
                </div>
              </div>

              {/* Chart Card 2: Market Segment Churn Risk Breakdown (Widened High-Definition Border) */}
              <div 
                className="mat-card mat-market-segment-card" 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '1.35rem',
                  border: '2.5px solid #cbd5e1', // Widened border requested by user
                  borderRadius: '18px',
                  padding: '1.75rem 2rem',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.06)',
                  background: '#ffffff'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.01em' }}>
                      Market Segment Risk Distribution
                    </h4>
                    <span style={{ fontSize: '0.72rem', color: '#16a34a', background: 'rgba(22, 163, 74, 0.1)', border: '1px solid rgba(22, 163, 74, 0.25)', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontWeight: 700 }}>
                      +15% Direct Growth
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                    Historical and active churn velocity mapped by booking acquisition channel.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {segmentStats.map(seg => {
                    const isHigh = seg.rate > 40;
                    return (
                      <div 
                        key={seg.name} 
                        style={{ 
                          padding: '0.85rem 1.15rem', 
                          borderRadius: '12px', 
                          background: '#f8fafc', 
                          border: '1.5px solid #e2e8f0',
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: '0.55rem',
                          transition: 'border-color 0.2s ease, transform 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem' }}>
                          <span style={{ fontWeight: 700, color: '#1e293b' }}>{seg.name}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ color: '#64748b', fontSize: '0.78rem' }}>{seg.count} bookings</span>
                            <span style={{ 
                              fontSize: '0.76rem', 
                              fontWeight: 800, 
                              color: isHigh ? '#be123c' : seg.rate > 20 ? '#b45309' : '#15803d',
                              background: isHigh ? 'rgba(225, 29, 72, 0.1)' : seg.rate > 20 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(22, 163, 74, 0.1)',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '6px',
                              border: `1px solid ${isHigh ? 'rgba(225, 29, 72, 0.25)' : seg.rate > 20 ? 'rgba(245, 158, 11, 0.25)' : 'rgba(22, 163, 74, 0.25)'}`
                            }}>
                              {seg.rate}% churn
                            </span>
                          </div>
                        </div>

                        {/* Widened High-Clarity Progress Bar */}
                        <div style={{ width: '100%', height: '10px', borderRadius: '9999px', background: '#e2e8f0', overflow: 'hidden' }}>
                          <div style={{ 
                            width: `${Math.min(seg.rate, 100)}%`, 
                            height: '100%', 
                            borderRadius: '9999px',
                            background: isHigh 
                              ? 'linear-gradient(90deg, #f43f5e, #be123c)' 
                              : seg.rate > 20 
                                ? 'linear-gradient(90deg, #f59e0b, #d97706)' 
                                : 'linear-gradient(90deg, #10b981, #059669)',
                            boxShadow: isHigh ? '0 0 8px rgba(225, 29, 72, 0.4)' : 'none',
                            transition: 'width 0.4s ease'
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ paddingTop: '0.75rem', borderTop: '1px solid #f0f2f5', fontSize: '0.76rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Clock size={14} color="#64748b" />
                  <span>Calculated dynamically from live XGBoost risk probability outputs</span>
                </div>
              </div>

            </div>

            {/* ROW 3: TARGET DATE CANCELLATION & ROOM INVENTORY INSPECTOR */}
            <div className="mat-card" style={{ padding: '1.5rem' }}>
              <DailyCancellationInspector 
                reservations={reservations}
                selectedDate={selectedDateFilter}
                onSelectDate={(d) => setSelectedDateFilter(d)}
                onInspectBooking={(bk) => {
                  onSelectBooking(bk);
                  setActiveTab('single');
                }}
                onCancelReservation={onCancelReservation}
              />
            </div>

            {/* ROW 4: BOTTOM OPERATIONAL DATA & HIGH-RISK TIMELINE (Matches Projects & Orders in Screenshot) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.45fr) minmax(320px, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
              
              {/* Left Card: Filtered Reservations Table (Matches "Projects" card in screenshot) */}
              <div className="mat-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#344767' }}>
                      Active Reservations & Risk Roster ({filteredBookings.length})
                    </h4>
                    <p style={{ fontSize: '0.78rem', color: '#7b809a', marginTop: '0.15rem' }}>
                      Filtered PMS records with live XGBoost probability assessment.
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {['all', 'Direct', 'Online TA', 'Corporate', 'Groups'].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSelectedSegment(s)}
                        className={`mat-filter-chip ${selectedSegment === s ? 'active' : ''}`}
                      >
                        {s === 'all' ? 'All Segments' : s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Table */}
                <div style={{ width: '100%', overflowX: 'auto' }}>
                  <table className="mat-table">
                    <thead>
                      <tr>
                        <th>GUEST & REFERENCE</th>
                        <th>SUITE & ROOMS</th>
                        <th>ARRIVAL DATE</th>
                        <th>CHURN RISK</th>
                        <th>REVENUE</th>
                        <th style={{ textAlign: 'right' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.slice(0, 10).map((bk) => {
                        const pred = bk.prediction;
                        const probPct = pred ? (pred.cancellation_probability_pct || Math.round((pred.cancellation_probability || 0) * 100)) : 25;
                        const riskLevel = pred ? pred.risk_level : (probPct >= 60 ? 'high' : probPct >= 35 ? 'medium' : 'low');

                        return (
                          <tr key={bk.booking_ref || Math.random()}>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <strong style={{ color: '#344767', fontSize: '0.86rem' }}>
                                  {bk.guest_name || 'Guest'}
                                </strong>
                                <span style={{ fontSize: '0.72rem', color: '#7b809a', fontFamily: 'monospace' }}>
                                  #{bk.booking_ref}
                                </span>
                              </div>
                            </td>

                            <td>
                              <span style={{ fontSize: '0.82rem', color: '#344767' }}>
                                {bk.room_count || 1} Room(s) • Suite {bk.reserved_room_type || 'A'}
                              </span>
                            </td>

                            <td>
                              <span style={{ fontSize: '0.82rem', color: '#344767' }}>
                                {bk.check_in_date || bk.arrival_date_month || '2026-10'}
                              </span>
                            </td>

                            <td>
                              <span className={`mat-risk-badge mat-risk-${riskLevel}`}>
                                {probPct}% {riskLevel.toUpperCase()}
                              </span>
                            </td>

                            <td>
                              <strong style={{ color: '#344767', fontSize: '0.86rem' }}>
                                ${(bk.adr || 145) * ((bk.stays_in_weekend_nights || 0) + (bk.stays_in_week_nights || 1)) * (bk.room_count || 1)}
                              </strong>
                            </td>

                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                <button
                                  type="button"
                                  className="mat-icon-btn"
                                  onClick={() => {
                                    onSelectBooking(bk);
                                    setActiveTab('single');
                                  }}
                                  title="Inspect in AI Model"
                                >
                                  <Eye size={13} />
                                </button>
                                <button
                                  type="button"
                                  className="mat-icon-btn mat-icon-btn-danger"
                                  onClick={() => onCancelReservation(bk.booking_ref)}
                                  title="Cancel reservation in MongoDB"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

              </div>

              {/* Right Card: High-Risk Prior Warning Timeline (Matches "Orders overview" in screenshot) */}
              <div className="mat-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#344767' }}>
                    High-Risk Orders Overview
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: '#7b809a', marginTop: '0.15rem' }}>
                    <span style={{ color: '#4caf50', fontWeight: 700 }}>24%</span> prioritized for action this month.
                  </p>
                </div>

                {/* Timeline Items */}
                <div className="mat-timeline">
                  {highRiskTimeline.map((item, idx) => {
                    const probPct = item.prediction ? (item.prediction.cancellation_probability_pct || Math.round((item.prediction.cancellation_probability || 0) * 100)) : 75;

                    return (
                      <div key={item.booking_ref || idx} className="mat-timeline-item">
                        <div className="mat-timeline-dot mat-timeline-danger">
                          <Flame size={12} color="#ffffff" />
                        </div>
                        <div className="mat-timeline-content">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <strong style={{ fontSize: '0.84rem', color: '#344767' }}>
                              ${(item.adr || 145) * ((item.stays_in_weekend_nights || 0) + (item.stays_in_week_nights || 1))}, {item.guest_name}
                            </strong>
                            <span style={{ fontSize: '0.72rem', color: '#e11d48', fontWeight: 700 }}>
                              {probPct}% Risk
                            </span>
                          </div>
                          <span style={{ fontSize: '0.74rem', color: '#7b809a' }}>
                            Arrival: {item.check_in_date || item.arrival_date_month} • {item.market_segment}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ paddingTop: '0.5rem', borderTop: '1px solid #f0f2f5' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRiskTier('high');
                      const el = document.querySelector('.mat-table');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      background: '#f8f9fa',
                      border: '1px solid #e9ecef',
                      borderRadius: '8px',
                      color: '#344767',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    View All High-Risk Bookings
                  </button>
                </div>

              </div>

            </div>

          </div>
        )}

      </main>

    </div>
  );
}
