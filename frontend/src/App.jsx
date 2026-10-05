import React, { useState, useEffect, Component } from 'react';
import { UserCheck, Layers, HelpCircle, ShieldCheck, AlertOctagon, Sparkles, Eye, ArrowRight, CalendarCheck } from 'lucide-react';
import Header from './components/Header';
import SinglePrediction from './components/SinglePrediction';
import BatchPrediction from './components/BatchPrediction';
import ModelIntelModal from './components/ModelIntelModal';
import CustomerPortal from './components/CustomerPortal';
import ReservationsRiskMonitor from './components/ReservationsRiskMonitor';

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
  const [activeTab, setActiveTab] = useState('monitor'); // 'monitor' | 'single' | 'batch'
  const [backendHealth, setBackendHealth] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [intelOpen, setIntelOpen] = useState(false);
  const [isLoadingReservations, setIsLoadingReservations] = useState(false);

  // Customer portal bookings state
  const [customerBookings, setCustomerBookings] = useState([]);
  const [selectedCustomerBooking, setSelectedCustomerBooking] = useState(null);

  // Poll or check backend health, metadata & MongoDB reservations on startup
  const fetchSystemStatus = async () => {
    setIsLoadingReservations(true);
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
    } finally {
      setIsLoadingReservations(false);
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
              onSwitchToAdmin={() => {
                setActivePortal('admin');
                setActiveTab('monitor');
              }}
              metadata={metadata}
              apiBaseUrl={API_BASE_URL}
            />
          ) : (
            <div>
              {/* Admin Primary Tab Navigation */}
              <nav className="tabs-nav" style={{ marginBottom: '1.75rem' }}>
                <button
                  type="button"
                  id="tab-monitor-btn"
                  className={`tab-btn ${activeTab === 'monitor' ? 'active' : ''}`}
                  onClick={() => setActiveTab('monitor')}
                >
                  <CalendarCheck size={18} />
                  <span>Live Reservations & Risk Monitor</span>
                </button>

                <button
                  type="button"
                  id="tab-single-btn"
                  className={`tab-btn ${activeTab === 'single' ? 'active' : ''}`}
                  onClick={() => setActiveTab('single')}
                >
                  <UserCheck size={18} />
                  <span>Single Booking AI Inspector</span>
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
              {activeTab === 'monitor' && (
                <ReservationsRiskMonitor
                  reservations={customerBookings}
                  onSelectBooking={(bk) => {
                    setSelectedCustomerBooking(bk);
                    setActiveTab('single');
                  }}
                  onRefresh={fetchSystemStatus}
                  isLoading={isLoadingReservations}
                />
              )}

              {activeTab === 'single' && (
                <div>
                  {selectedCustomerBooking && (
                    <div style={{ 
                      padding: '0.85rem 1.25rem', 
                      marginBottom: '1.25rem', 
                      borderRadius: '12px', 
                      background: 'rgba(99,102,241,0.1)', 
                      border: '1px solid rgba(99,102,241,0.3)',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.75rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                        <Sparkles size={16} color="#818cf8" />
                        <span>
                          Currently Inspecting Live Reservation: <strong>{selectedCustomerBooking.guest_name}</strong> (#{selectedCustomerBooking.booking_ref})
                        </span>
                      </div>
                      <button 
                        type="button" 
                        className="preset-btn"
                        onClick={() => setActiveTab('monitor')}
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                      >
                        ← Back to Daily Risk Monitor
                      </button>
                    </div>
                  )}
                  <SinglePrediction 
                    metadata={metadata} 
                    apiBaseUrl={API_BASE_URL} 
                    selectedCustomerBooking={selectedCustomerBooking}
                  />
                </div>
              )}

              {activeTab === 'batch' && (
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
