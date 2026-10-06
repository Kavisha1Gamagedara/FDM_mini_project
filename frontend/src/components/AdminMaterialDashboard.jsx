import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, CalendarCheck, UserCheck, Layers, 
  HelpCircle, ShieldCheck, AlertOctagon, Sparkles, Eye, 
  ArrowRight, Search, Bell, Settings, LogOut, ExternalLink, 
  DollarSign, Users, TrendingDown, BedDouble, CheckCircle2, 
  Clock, ShieldAlert, ArrowUpRight, ArrowDownRight, RefreshCw, 
  Building2, CreditCard, Mail, Trash2, ChevronRight, Filter, 
  Compass, Flame, FileText, Check, Maximize2, Minimize2, PlusCircle,
  Sun, Moon
} from 'lucide-react';
import MonthlyCancellationLineChart from './MonthlyCancellationLineChart';
import DailyCancellationInspector from './DailyCancellationInspector';
import SinglePrediction from './SinglePrediction';
import BatchPrediction from './BatchPrediction';
import AdminManualBookingForm from './AdminManualBookingForm';
import DailyNearTermRiskGauge from './DailyNearTermRiskGauge';
import CancellationIntelModal from './CancellationIntelModal';

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
  onOpenIntel,
  theme = 'dark',
  onToggleTheme
}) {
  // Local Filter States for Reservations Table
  const [tableSearch, setTableSearch] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedRiskTier, setSelectedRiskTier] = useState('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState('');
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [chartExpanded, setChartExpanded] = useState(false);

  // Dynamic KPI Filter & Cancellation Drilldown States
  const [kpiFilter, setKpiFilter] = useState('all'); // 'all' | 'revenue' | 'stays' | 'cancellations' | 'high_risk'
  const [cancellationIntelOpen, setCancellationIntelOpen] = useState(false);
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(10);

  // KPI Card Click Handler - toggles filter and smoothly scrolls to roster
  const handleKpiFilterClick = (filterType) => {
    if (kpiFilter === filterType) {
      setKpiFilter('all');
    } else {
      setKpiFilter(filterType);
      setTablePage(1);
      setTimeout(() => {
        const rosterEl = document.getElementById('reservations-roster-section');
        if (rosterEl) {
          rosterEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 60);
    }
  };

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

  // Filtered reservations for the bottom table with dynamic KPI filtering and risk ranking
  const filteredBookings = useMemo(() => {
    let list = reservations.filter(r => {
      // 1. Dynamic KPI Filter Constraints
      if (kpiFilter === 'cancellations') {
        const prob = r.prediction ? (r.prediction.cancellation_probability || (r.prediction.cancellation_probability_pct / 100) || 0) : 0;
        const isCancelled = r.status === 'cancelled';
        const isPredictedCancel = r.prediction?.risk_level === 'high' || prob >= 0.5;
        if (!isCancelled && !isPredictedCancel) return false;
      } else if (kpiFilter === 'high_risk') {
        if (r.status === 'cancelled') return false;
        const prob = r.prediction ? (r.prediction.cancellation_probability || (r.prediction.cancellation_probability_pct / 100) || 0) : 0;
        const isHighRisk = r.prediction?.risk_level === 'high' || prob >= 0.6;
        if (!isHighRisk) return false;
      } else if (kpiFilter === 'stays') {
        if (r.status === 'cancelled') return false;
      } else if (kpiFilter === 'revenue') {
        if (r.status === 'cancelled') return false;
      }

      // 2. Search query filter
      if (tableSearch.trim()) {
        const q = tableSearch.toLowerCase().trim();
        const mName = r.guest_name && r.guest_name.toLowerCase().includes(q);
        const mEmail = r.guest_email && r.guest_email.toLowerCase().includes(q);
        const mRef = r.booking_ref && r.booking_ref.toLowerCase().includes(q);
        if (!mName && !mEmail && !mRef) return false;
      }

      // 3. Segment filter
      if (selectedSegment !== 'all' && (r.market_segment || 'Direct').toLowerCase() !== selectedSegment.toLowerCase()) {
        return false;
      }

      // 4. Month filter
      if (selectedMonth !== 'all' && r.arrival_date_month && r.arrival_date_month.toLowerCase() !== selectedMonth.toLowerCase()) {
        return false;
      }

      // 5. Exact arrival date filter
      if (selectedDateFilter && r.check_in_date && r.check_in_date !== selectedDateFilter) {
        return false;
      }

      // 6. Risk tier filter
      if (selectedRiskTier !== 'all') {
        const risk = r.prediction?.risk_level || 'low';
        if (risk !== selectedRiskTier) return false;
      }

      return true;
    });

    // 7. Dynamic Sorting based on active KPI card
    if (kpiFilter === 'cancellations' || kpiFilter === 'high_risk') {
      list.sort((a, b) => {
        const probA = a.prediction ? (a.prediction.cancellation_probability || (a.prediction.cancellation_probability_pct / 100) || 0) : (a.status === 'cancelled' ? 1 : 0);
        const probB = b.prediction ? (b.prediction.cancellation_probability || (b.prediction.cancellation_probability_pct / 100) || 0) : (b.status === 'cancelled' ? 1 : 0);
        return probB - probA;
      });
    } else if (kpiFilter === 'revenue') {
      list.sort((a, b) => {
        const nightsA = (a.stays_in_weekend_nights || 0) + (a.stays_in_week_nights || 1);
        const nightsB = (b.stays_in_weekend_nights || 0) + (b.stays_in_week_nights || 1);
        const revA = (a.adr || 145) * nightsA * (a.room_count || 1);
        const revB = (b.adr || 145) * nightsB * (b.room_count || 1);
        return revB - revA;
      });
    }

    return list;
  }, [reservations, kpiFilter, tableSearch, selectedSegment, selectedMonth, selectedDateFilter, selectedRiskTier]);

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
                className={`mat-nav-item ${activeTab === 'manual-booking' ? 'active' : ''}`}
                onClick={() => setActiveTab('manual-booking')}
              >
                <div className="mat-nav-icon">
                  <PlusCircle size={17} />
                </div>
                <span>Manual Reservation Desk</span>
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

          </ul>

          <div className="mat-section-title" style={{ marginTop: '1.5rem' }}>ACCOUNT & SESSION</div>
          <ul className="mat-nav-list">
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

        {/* Sidebar Footer Card */}
        <div className="mat-sidebar-footer-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <ShieldCheck size={16} color="#34d399" />
            <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>
              ML Model Health: 100%
            </span>
          </div>
          <p style={{ fontSize: '0.72rem', color: '#7b809a', lineHeight: 1.4 }}>
            Predictive AI Model active with automated database sync.
          </p>
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
              <strong>
                {activeTab === 'monitor' ? 'Dashboard' : activeTab === 'manual-booking' ? 'Manual Reservation Desk' : activeTab === 'single' ? 'Single AI Inspector' : 'Batch Portfolio'}
              </strong>
            </div>
            <h2 className="mat-page-title">
              {activeTab === 'monitor' && 'Executive Cancellation Dashboard'}
              {activeTab === 'manual-booking' && 'Manual Reservation Desk'}
              {activeTab === 'single' && 'Single Reservation Feature Inspector'}
              {activeTab === 'batch' && 'Batch Portfolio CSV Risk Analyzer'}
            </h2>
            <p style={{ fontSize: '0.84rem', color: '#7b809a', marginTop: '0.15rem' }}>
              {activeTab === 'manual-booking' 
                ? 'Create on-demand reservations requested directly by customers with automated risk scoring and database sync.'
                : 'Check reservation risk, upcoming cancellations, and room churn forecasts by arrival date.'}
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

            {/* Theme Toggle Button (Light & Dark Mode) */}
            <button
              type="button"
              className="mat-action-pill mat-theme-toggle-pill"
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              aria-label={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun size={14} color="#f59e0b" className="theme-toggle-icon sun-icon" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon size={14} color="#6366f1" className="theme-toggle-icon moon-icon" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>

            {/* User Profile Pill */}
            <div className="mat-user-badge">
              <div className="mat-user-avatar">A</div>
              <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                {currentUser?.email || 'admin@aurastay.com'}
              </span>
            </div>

          </div>
        </header>

        {/* =========================================================================
            ACTIVE VIEW RENDER (DASHBOARD vs MANUAL BOOKING vs SINGLE vs BATCH)
            ========================================================================= */}
        {activeTab === 'manual-booking' ? (
          <AdminManualBookingForm 
            apiBaseUrl={apiBaseUrl}
            onRefresh={onRefresh}
            onSelectBooking={(bk) => {
              if (onSelectBooking) onSelectBooking(bk);
              setActiveTab('single');
            }}
            onGoToMonitor={() => setActiveTab('monitor')}
          />
        ) : activeTab === 'single' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {selectedCustomerBooking && (
              <div style={{ 
                padding: '0.85rem 1.25rem', 
                borderRadius: '14px', 
                background: '#f0f9ff', 
                border: '1.5px solid #bae6fd',
                boxShadow: '0 2px 10px rgba(2, 132, 199, 0.05)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', color: '#0369a1' }}>
                  <Sparkles size={17} />
                  <span>
                    Currently Inspecting Live Reservation: <strong style={{ color: '#0c4a6e' }}>{selectedCustomerBooking.guest_name}</strong> (#{selectedCustomerBooking.booking_ref})
                  </span>
                </div>
                <button 
                  type="button" 
                  className="mat-action-pill"
                  onClick={() => setActiveTab('monitor')}
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem', background: '#ffffff', border: '1.5px solid #cbd5e1', color: '#334155' }}
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
          <BatchPrediction apiBaseUrl={apiBaseUrl} />
        ) : (
          /* =========================================================================
             TAB: MONITOR / DASHBOARD (Exact Creative Tim Material 3 Layout)
             ========================================================================= */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* ROW 1: TOP 4 ELEVATED MATERIAL METRIC CARDS */}
            <div className="mat-stat-grid">
              
              {/* Card 1: Today's / Scheduled Revenue */}
              <div 
                className={`mat-stat-card mat-stat-clickable ${kpiFilter === 'revenue' ? 'active-revenue' : ''}`}
                onClick={() => handleKpiFilterClick('revenue')}
                role="button"
                tabIndex={0}
                title="Click to sort stays by scheduled gross revenue exposure"
              >
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
                <div className="mat-stat-footer" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                    <span className="mat-trend-up">
                      <ArrowUpRight size={14} /> +55%
                    </span>
                    <span className="mat-trend-text">than last operating cycle</span>
                  </div>
                  {kpiFilter === 'revenue' ? (
                    <span className="mat-kpi-active-pill pill-revenue">✓ Active Filter</span>
                  ) : (
                    <span className="mat-kpi-click-hint">Rank by Value ▾</span>
                  )}
                </div>
              </div>

              {/* Card 2: On-The-Books Stays */}
              <div 
                className={`mat-stat-card mat-stat-clickable ${kpiFilter === 'stays' ? 'active-stays' : ''}`}
                onClick={() => handleKpiFilterClick('stays')}
                role="button"
                tabIndex={0}
                title="Click to filter all active confirmed stays"
              >
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
                <div className="mat-stat-footer" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                    <span className="mat-trend-up">
                      <ArrowUpRight size={14} /> +12%
                    </span>
                    <span className="mat-trend-text">across upcoming months</span>
                  </div>
                  {kpiFilter === 'stays' ? (
                    <span className="mat-kpi-active-pill pill-stays">✓ Active Filter</span>
                  ) : (
                    <span className="mat-kpi-click-hint">View Stays ▾</span>
                  )}
                </div>
              </div>

              {/* Card 3: Predicted Cancellations */}
              <div 
                className={`mat-stat-card mat-stat-clickable ${kpiFilter === 'cancellations' ? 'active-cancellations' : ''}`}
                onClick={() => handleKpiFilterClick('cancellations')}
                role="button"
                tabIndex={0}
                title="Click to filter forecasted cancellations & dropouts"
              >
                <div className="mat-stat-top">
                  <div>
                    <span className="mat-stat-label">Predicted Cancellations</span>
                    <h3 className="mat-stat-value" style={{ color: '#e11d48' }}>
                      ~{kpis.expectedCancels}
                    </h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <button
                      type="button"
                      className="mat-kpi-intel-action"
                      title="Open In-Depth Cancellation Intel Briefing"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCancellationIntelOpen(true);
                      }}
                    >
                      <Sparkles size={11} /> Churn Intel
                    </button>
                    <div className="mat-icon-box mat-icon-danger">
                      <TrendingDown size={22} />
                    </div>
                  </div>
                </div>
                <div className="mat-stat-footer" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                    <span className="mat-trend-danger">
                      <ArrowDownRight size={14} /> {kpis.avgChurnRate}%
                    </span>
                    <span className="mat-trend-text">expected portfolio churn</span>
                  </div>
                  {kpiFilter === 'cancellations' ? (
                    <span className="mat-kpi-active-pill pill-cancellations">✓ Active (~{kpis.expectedCancels})</span>
                  ) : (
                    <span className="mat-kpi-click-hint" style={{ color: '#e11d48' }}>Filter Cancels ▾</span>
                  )}
                </div>
              </div>

              {/* Card 4: Rooms at Risk */}
              <div 
                className={`mat-stat-card mat-stat-clickable ${kpiFilter === 'high_risk' ? 'active-rooms' : ''}`}
                onClick={() => handleKpiFilterClick('high_risk')}
                role="button"
                tabIndex={0}
                title="Click to filter high-risk rooms and bookings"
              >
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
                <div className="mat-stat-footer" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                    <span className="mat-trend-warning">
                      ⚠️ {kpis.highRiskCount} Stays
                    </span>
                    <span className="mat-trend-text">in high-risk cancellation tier</span>
                  </div>
                  {kpiFilter === 'high_risk' ? (
                    <span className="mat-kpi-active-pill pill-rooms">✓ Active ({kpis.highRiskCount})</span>
                  ) : (
                    <span className="mat-kpi-click-hint" style={{ color: '#d97706' }}>Filter Rooms ▾</span>
                  )}
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
              
              {/* Chart Card 1: Upcoming Months Cancellation Line Chart */}
              <MonthlyCancellationLineChart 
                reservations={reservations}
                onSelectMonth={(m) => {
                  setSelectedMonth(m);
                  setSelectedDateFilter('');
                }}
                selectedMonthFilter={selectedMonth}
                isExpanded={chartExpanded}
                onToggleExpand={() => setChartExpanded(prev => !prev)}
              />

              {/* Right Column: Market Segment Distribution & Near-Term Daily Risk Gauge */}
              {!chartExpanded && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                  {/* Chart Card 2: Market Segment Churn Risk Breakdown */}
                  <div 
                    className="mat-card mat-market-segment-card" 
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '1.35rem',
                      borderRadius: '18px',
                      padding: '1.75rem 2rem'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <h4 className="mat-card-title" style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
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
                            className="mat-segment-row"
                            style={{ 
                              padding: '0.85rem 1.15rem', 
                              borderRadius: '12px', 
                              display: 'flex', 
                              flexDirection: 'column', 
                              gap: '0.55rem',
                              transition: 'border-color 0.2s ease, transform 0.2s ease'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem' }}>
                              <span className="mat-segment-name" style={{ fontWeight: 700 }}>{seg.name}</span>
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
                            <div className="mat-progress-track" style={{ width: '100%', height: '10px', borderRadius: '9999px', overflow: 'hidden' }}>
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

                    <div className="mat-segment-footer">
                      <Clock size={14} />
                      <span>Calculated dynamically from real-time predictive risk outputs</span>
                    </div>
                  </div>

                  {/* Chart Card 3: Near-Term Cancellation Risk Gauge & Room Type Dropout Summary */}
                  <DailyNearTermRiskGauge 
                    reservations={reservations}
                    onSelectDate={(d) => setSelectedDateFilter(d)}
                    selectedDateFilter={selectedDateFilter}
                  />
                </div>
              )}

            </div>

            {/* ROW 3: TARGET DATE CANCELLATION & ROOM INVENTORY INSPECTOR */}
            <div id="daily-inspector-section">
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
              <div id="reservations-roster-section" className="mat-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h4 className="mat-card-title" style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                      Active Reservations & Risk Roster ({filteredBookings.length})
                    </h4>
                    <p style={{ fontSize: '0.78rem', color: '#7b809a', marginTop: '0.15rem' }}>
                      Filtered PMS records with live cancellation risk assessment.
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

                {/* Dynamic Active KPI Filter Banner */}
                {kpiFilter !== 'all' && (
                  <div className={`mat-active-filter-banner banner-${kpiFilter === 'high_risk' ? 'rooms' : kpiFilter}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ 
                        width: '34px', 
                        height: '34px', 
                        borderRadius: '9px', 
                        background: kpiFilter === 'cancellations' ? '#e11d48' : kpiFilter === 'high_risk' ? '#d97706' : kpiFilter === 'revenue' ? '#10b981' : '#0284c7', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: '#ffffff',
                        flexShrink: 0
                      }}>
                        {kpiFilter === 'cancellations' && <TrendingDown size={18} />}
                        {kpiFilter === 'high_risk' && <BedDouble size={18} />}
                        {kpiFilter === 'revenue' && <DollarSign size={18} />}
                        {kpiFilter === 'stays' && <Users size={18} />}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {kpiFilter === 'cancellations' && `Live Cancellation Filter Active (${filteredBookings.length} Forecasted Stays)`}
                          {kpiFilter === 'high_risk' && `High-Risk Rooms at Stake (${filteredBookings.length} Stays / ${filteredBookings.reduce((acc, r) => acc + (r.room_count || 1), 0)} Rooms)`}
                          {kpiFilter === 'revenue' && `Gross Scheduled Revenue Filter Active (${filteredBookings.length} Stays Ranked by Value)`}
                          {kpiFilter === 'stays' && `Confirmed On-The-Books Stays (${filteredBookings.length} Active Records)`}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                          {kpiFilter === 'cancellations' && 'Displaying reservations forecasted to cancel (churn risk ≥ 50%) or cancelled, ordered by highest risk.'}
                          {kpiFilter === 'high_risk' && 'Displaying reservations flagged in the high-risk tier requiring immediate proactive inventory management.'}
                          {kpiFilter === 'revenue' && 'Displaying confirmed stays ordered from highest revenue exposure to lowest.'}
                          {kpiFilter === 'stays' && 'Displaying all confirmed active stays currently on-the-books.'}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {kpiFilter === 'cancellations' && (
                        <button
                          type="button"
                          onClick={() => setCancellationIntelOpen(true)}
                          className="mat-kpi-intel-action"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.76rem' }}
                        >
                          <Sparkles size={12} /> Churn Intel Briefing
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => { setKpiFilter('all'); setTablePage(1); }}
                        className="mat-action-pill"
                        style={{ fontSize: '0.74rem', padding: '0.35rem 0.75rem', background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', cursor: 'pointer' }}
                      >
                        Reset Filter ✕
                      </button>
                    </div>
                  </div>
                )}

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
                      {(() => {
                        const pageSizeNum = typeof tablePageSize === 'number' ? tablePageSize : filteredBookings.length;
                        const startIndex = (tablePage - 1) * pageSizeNum;
                        const pageItems = tablePageSize === 'all' 
                          ? filteredBookings 
                          : filteredBookings.slice(startIndex, startIndex + pageSizeNum);

                        if (pageItems.length === 0) {
                          return (
                            <tr>
                              <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#7b809a' }}>
                                No reservations found matching current filter criteria.
                              </td>
                            </tr>
                          );
                        }

                        return pageItems.map((bk) => {
                          const pred = bk.prediction;
                          const probPct = pred ? (pred.cancellation_probability_pct || Math.round((pred.cancellation_probability || 0) * 100)) : 25;
                          const riskLevel = pred ? pred.risk_level : (probPct >= 60 ? 'high' : probPct >= 35 ? 'medium' : 'low');
                          const isCancelled = bk.status === 'cancelled';

                          return (
                            <tr key={bk.booking_ref || Math.random()}>
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                    <strong className="mat-cell-title" style={{ fontSize: '0.86rem' }}>
                                      {bk.guest_name || 'Guest'}
                                    </strong>
                                    {isCancelled && (
                                      <span className="mat-badge-cancelled">CANCELLED</span>
                                    )}
                                  </div>
                                  <span style={{ fontSize: '0.72rem', color: '#7b809a', fontFamily: 'monospace' }}>
                                    #{bk.booking_ref}
                                  </span>
                                </div>
                              </td>

                              <td>
                                <span className="mat-cell-sub" style={{ fontSize: '0.82rem' }}>
                                  {bk.room_count || 1} Room(s) • Suite {bk.reserved_room_type || 'A'}
                                </span>
                              </td>

                              <td>
                                <span className="mat-cell-sub" style={{ fontSize: '0.82rem' }}>
                                  {bk.check_in_date || bk.arrival_date_month || '2026-10'}
                                </span>
                              </td>

                              <td>
                                <span className={`mat-risk-badge mat-risk-${riskLevel}`}>
                                  {probPct}% {riskLevel.toUpperCase()}
                                </span>
                              </td>

                              <td>
                                <strong className="mat-cell-title" style={{ fontSize: '0.86rem' }}>
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
                        });
                      })()}
                    </tbody>
                  </table>
                </div>

                {/* Table Pagination & Rows Control */}
                {filteredBookings.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.65rem', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <div style={{ fontSize: '0.78rem', color: '#7b809a' }}>
                      Showing {tablePageSize === 'all' ? 1 : (tablePage - 1) * tablePageSize + 1} to {tablePageSize === 'all' ? filteredBookings.length : Math.min(tablePage * tablePageSize, filteredBookings.length)} of {filteredBookings.length} records
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem' }}>
                        <span style={{ color: '#7b809a' }}>Rows:</span>
                        {[10, 25, 'all'].map(ps => (
                          <button
                            key={ps}
                            type="button"
                            onClick={() => { setTablePageSize(ps); setTablePage(1); }}
                            className={`mat-filter-chip ${tablePageSize === ps ? 'active' : ''}`}
                            style={{ padding: '0.2rem 0.55rem', fontSize: '0.72rem' }}
                          >
                            {ps === 'all' ? 'All' : ps}
                          </button>
                        ))}
                      </div>
                      {tablePageSize !== 'all' && Math.ceil(filteredBookings.length / tablePageSize) > 1 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <button
                            type="button"
                            disabled={tablePage === 1}
                            onClick={() => setTablePage(p => Math.max(1, p - 1))}
                            className="mat-icon-btn"
                            style={{ padding: '0.25rem 0.55rem', fontSize: '0.74rem', opacity: tablePage === 1 ? 0.4 : 1 }}
                          >
                            ‹ Prev
                          </button>
                          <span style={{ fontSize: '0.76rem', color: '#7b809a', fontWeight: 600 }}>
                            {tablePage} / {Math.ceil(filteredBookings.length / tablePageSize)}
                          </span>
                          <button
                            type="button"
                            disabled={tablePage >= Math.ceil(filteredBookings.length / tablePageSize)}
                            onClick={() => setTablePage(p => Math.min(Math.ceil(filteredBookings.length / tablePageSize), p + 1))}
                            className="mat-icon-btn"
                            style={{ padding: '0.25rem 0.55rem', fontSize: '0.74rem', opacity: tablePage >= Math.ceil(filteredBookings.length / tablePageSize) ? 0.4 : 1 }}
                          >
                            Next ›
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>

              {/* Right Card: High-Risk Prior Warning Timeline (Matches "Orders overview" in screenshot) */}
              <div className="mat-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <h4 className="mat-card-title" style={{ fontSize: '1.15rem', fontWeight: 700 }}>
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
                            <strong className="mat-cell-title" style={{ fontSize: '0.84rem' }}>
                              ${(item.adr || 145) * ((item.stays_in_weekend_nights || 0) + (item.stays_in_week_nights || 1))}, {item.guest_name}
                            </strong>
                            <span style={{ fontSize: '0.72rem', color: '#e11d48', fontWeight: 700 }}>
                              {probPct}% Risk
                            </span>
                          </div>
                          <span className="mat-cell-sub" style={{ fontSize: '0.74rem' }}>
                            Arrival: {item.check_in_date || item.arrival_date_month} • {item.market_segment}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <button
                    type="button"
                    className="mat-view-all-btn"
                    onClick={() => {
                      setSelectedRiskTier('high');
                      const el = document.querySelector('.mat-table');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
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

      {/* Comprehensive Cancellation Intelligence Modal Briefing */}
      <CancellationIntelModal
        isOpen={cancellationIntelOpen}
        onClose={() => setCancellationIntelOpen(false)}
        reservations={reservations}
        kpis={kpis}
        onInspectBooking={(bk) => {
          onSelectBooking(bk);
          setActiveTab('single');
        }}
        onFilterTableToCancellations={() => {
          handleKpiFilterClick('cancellations');
        }}
      />

    </div>
  );
}
