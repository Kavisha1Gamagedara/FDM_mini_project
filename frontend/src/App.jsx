import React, { useState, useEffect, Component } from 'react';
import { UserCheck, Layers, HelpCircle, ShieldCheck, AlertOctagon, Sparkles, Eye, ArrowRight } from 'lucide-react';
import Header from './components/Header';
import SinglePrediction from './components/SinglePrediction';
import BatchPrediction from './components/BatchPrediction';
import ModelIntelModal from './components/ModelIntelModal';
import CustomerPortal from './components/CustomerPortal';

const API_BASE_URL = 'http://127.0.0.1:8000';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', margin: '2rem auto', maxWidth: '600px' }}>
          <AlertOctagon size={48} color="var(--risk-high)" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>An Unexpected UI Error Occurred</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            {this.state.error?.message || 'Component failed to render.'}
          </p>
          <button 
            className="preset-btn"
            onClick={() => window.location.reload()}
            style={{ margin: '0 auto', background: 'var(--primary-500)', color: '#fff' }}
          >
            Reload Platform
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [activePortal, setActivePortal] = useState('admin'); // 'admin' | 'customer'
  const [activeTab, setActiveTab] = useState('single'); // 'single' | 'batch'
  const [backendHealth, setBackendHealth] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [intelOpen, setIntelOpen] = useState(false);

  // Customer portal bookings state
  const [customerBookings, setCustomerBookings] = useState([]);
  const [selectedCustomerBooking, setSelectedCustomerBooking] = useState(null);

  // Poll or check backend health, metadata & MongoDB reservations on startup
  const fetchSystemStatus = async () => {
    try {
      const healthRes = await fetch(`${API_BASE_URL}/health`);
      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setBackendHealth(healthData);
      }
    } catch (err) {
      console.warn('Backend server not detected yet on http://127.0.0.1:8000');
    }

    try {
      const metaRes = await fetch(`${API_BASE_URL}/metadata`);
      if (metaRes.ok) {
        const metaData = await metaRes.json();
        setMetadata(metaData);
      }
    } catch (err) {
      console.warn('Could not load metadata from backend');
    }

    try {
      const resRes = await fetch(`${API_BASE_URL}/reservations`);
      if (resRes.ok) {
        const resData = await resRes.json();
        if (resData.reservations && Array.isArray(resData.reservations)) {
          setCustomerBookings(resData.reservations);
        }
      }
    } catch (err) {
      console.warn('Could not load reservations from MongoDB backend');
    }
  };

  useEffect(() => {
    fetchSystemStatus();
    const interval = setInterval(fetchSystemStatus, 15000); // Check every 15s
    return () => clearInterval(interval);
  }, []);

  // When a guest submits a reservation in the Customer Portal
  const handleCustomerBookingCreated = (savedBooking) => {
    setCustomerBookings(prev => {
      const filtered = prev.filter(b => b.booking_ref !== savedBooking.booking_ref);
      return [savedBooking, ...filtered];
    });
    setSelectedCustomerBooking(savedBooking);
  };

  return (
    <div className="app-container">
      {/* Top Header & System Indicator with Portal Switcher */}
      <Header 
        backendHealth={backendHealth} 
        onOpenIntel={() => setIntelOpen(true)}
        activePortal={activePortal}
        onSelectPortal={setActivePortal}
        customerBookingsCount={customerBookings.length}
      />

      {/* Main Content Render based on Active Portal */}
      <main>
        <ErrorBoundary>
          {activePortal === 'customer' ? (
            <CustomerPortal 
              onBookingCreated={handleCustomerBookingCreated}
              onSwitchToAdmin={() => setActivePortal('admin')}
              metadata={metadata}
              apiBaseUrl={API_BASE_URL}
            />
          ) : (
            <div>
              {/* Live Incoming Customer Bookings Stream in Admin View */}
              {customerBookings.length > 0 && (
                <div className="glass-panel" style={{ padding: '1rem 1.25rem', marginBottom: '1.75rem', border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span className="health-pulse" style={{ background: '#818cf8', boxShadow: '0 0 8px #818cf8' }}></span>
                      <h4 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>
                        Live Guest Reservations Feed ({customerBookings.length} loaded from MongoDB)
                      </h4>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <button 
                        type="button" 
                        className="preset-btn" 
                        onClick={fetchSystemStatus}
                        style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem' }}
                        title="Sync with MongoDB"
                      >
                        ↻ Sync Database
                      </button>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Click any reservation to inspect live AI risk diagnosis
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                    {customerBookings.map((bk, i) => {
                      const probPct = bk.prediction ? bk.prediction.cancellation_probability_pct : null;
                      const riskBand = bk.prediction ? bk.prediction.risk_band : 'Evaluating';
                      const bandClass = bk.prediction ? bk.prediction.risk_level : 'low';

                      return (
                        <div
                          key={bk.booking_ref || i}
                          onClick={() => {
                            setSelectedCustomerBooking(bk);
                            setActiveTab('single');
                          }}
                          style={{
                            padding: '0.85rem 1rem',
                            background: 'rgba(17,24,39,0.85)',
                            borderRadius: '12px',
                            border: '1px solid var(--border-subtle)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.35rem'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary-500)'}
                          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {bk.guest_name}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                              <span style={{
                                fontSize: '0.66rem',
                                fontWeight: 700,
                                padding: '0.12rem 0.45rem',
                                borderRadius: '9999px',
                                textTransform: 'uppercase',
                                background: bk.market_segment === 'Direct' ? 'rgba(16,185,129,0.15)' :
                                            bk.market_segment === 'Corporate' ? 'rgba(99,102,241,0.15)' :
                                            bk.market_segment === 'Groups' ? 'rgba(192,132,252,0.15)' : 'rgba(251,191,36,0.15)',
                                color: bk.market_segment === 'Direct' ? '#34d399' :
                                       bk.market_segment === 'Corporate' ? '#818cf8' :
                                       bk.market_segment === 'Groups' ? '#c084fc' : '#fbbf24',
                                border: '1px solid ' + (
                                  bk.market_segment === 'Direct' ? 'rgba(16,185,129,0.35)' :
                                  bk.market_segment === 'Corporate' ? 'rgba(99,102,241,0.35)' :
                                  bk.market_segment === 'Groups' ? 'rgba(192,132,252,0.35)' : 'rgba(251,191,36,0.35)'
                                )
                              }}>
                                {bk.market_segment || 'Direct'}
                                {bk.room_count && bk.room_count > 1 ? ` (${bk.room_count} rms)` : ''}
                              </span>
                              {bk.prediction && (
                                <span className={`risk-band-pill ${bandClass}`} style={{ fontSize: '0.68rem', padding: '0.12rem 0.45rem' }}>
                                  {riskBand} ({probPct}%)
                                </span>
                              )}
                            </div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                            <span>{bk.hotel} • {bk.stays_in_weekend_nights + bk.stays_in_week_nights} nts</span>
                            <span style={{ color: '#34d399', fontWeight: 600 }}>${bk.adr}/nt</span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            Ref #{bk.booking_ref} • Deposit: {bk.deposit_type}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Admin Primary Tab Navigation */}
              <nav className="tabs-nav">
                <button
                  type="button"
                  id="tab-single-btn"
                  className={`tab-btn ${activeTab === 'single' ? 'active' : ''}`}
                  onClick={() => setActiveTab('single')}
                >
                  <UserCheck size={18} />
                  <span>Single Booking Risk Assessment</span>
                </button>

                <button
                  type="button"
                  id="tab-batch-btn"
                  className={`tab-btn ${activeTab === 'batch' ? 'active' : ''}`}
                  onClick={() => setActiveTab('batch')}
                >
                  <Layers size={18} />
                  <span>Batch Portfolio CSV Analyzer</span>
                </button>
              </nav>

              {/* Admin Views */}
              {activeTab === 'single' ? (
                <SinglePrediction 
                  metadata={metadata} 
                  apiBaseUrl={API_BASE_URL} 
                  selectedCustomerBooking={selectedCustomerBooking}
                />
              ) : (
                <BatchPrediction 
                  apiBaseUrl={API_BASE_URL} 
                />
              )}
            </div>
          )}
        </ErrorBoundary>
      </main>

      {/* Modal Dialog for Model Intel & Architecture */}
      <ModelIntelModal 
        isOpen={intelOpen} 
        onClose={() => setIntelOpen(false)} 
      />

      {/* Footer */}
      <footer style={{ marginTop: '3.5rem', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        <p>AuraStay AI Intelligence • Dual Guest & Staff Revenue Architecture • Stage 9 Operational Deployment</p>
      </footer>
    </div>
  );
}
