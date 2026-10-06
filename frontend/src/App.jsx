import React, { useState, useEffect, Component } from 'react';
import { UserCheck, Layers, HelpCircle, ShieldCheck, AlertOctagon, Sparkles, Eye, ArrowRight, CalendarCheck } from 'lucide-react';
import Header from './components/Header';
import SinglePrediction from './components/SinglePrediction';
import BatchPrediction from './components/BatchPrediction';
import ModelIntelModal from './components/ModelIntelModal';
import CustomerPortal from './components/CustomerPortal';
import ReservationsRiskMonitor from './components/ReservationsRiskMonitor';
import AuthModal from './components/AuthModal';
import AdminMaterialDashboard from './components/AdminMaterialDashboard';

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
  // Authentication & RBAC Session State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('aurastay_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [authModalAdminPrompt, setAuthModalAdminPrompt] = useState(false);

  // Portal State: Default to customer portal for guests, or admin if already logged in as admin
  const [activePortal, setActivePortal] = useState(() => {
    try {
      const saved = localStorage.getItem('aurastay_user');
      const u = saved ? JSON.parse(saved) : null;
      return u?.role === 'admin' ? 'admin' : 'customer';
    } catch (e) {
      return 'customer';
    }
  });

  // Theme State: 'dark' | 'light' (Defaults to luxury dark sanctuary, persisted in localStorage)
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('aurastay_theme') || localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') return saved;
      return 'dark';
    } catch (e) {
      return 'dark';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('aurastay_theme', theme);
      localStorage.setItem('theme', theme);
    } catch (e) {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

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

  // Authentication Handlers
  const handleOpenAuth = (mode = 'login', adminPrompt = false) => {
    setAuthModalMode(mode);
    setAuthModalAdminPrompt(adminPrompt);
    setAuthModalOpen(true);
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('aurastay_user', JSON.stringify(user));
    } catch (e) {}

    // If admin logged in, automatically switch to admin portal
    if (user.role === 'admin') {
      setActivePortal('admin');
      setActiveTab('monitor');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('aurastay_user');
    } catch (e) {}
    setActivePortal('customer');
  };

  // When a guest submits a reservation in the Customer Portal
  const handleCustomerBookingCreated = (savedBooking) => {
    setCustomerBookings(prev => {
      const filtered = prev.filter(b => b.booking_ref !== savedBooking.booking_ref);
      return [savedBooking, ...filtered];
    });
    setSelectedCustomerBooking(savedBooking);
  };

  // Admin action to cancel a reservation
  const handleAdminCancelReservation = async (bookingRef) => {
    if (!window.confirm(`Are you sure you want to cancel reservation #${bookingRef} in MongoDB?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/reservations/${bookingRef}/cancel`, {
        method: 'POST'
      });
      if (res.ok) {
        fetchSystemStatus();
        alert(`Reservation #${bookingRef} has been marked as cancelled in MongoDB.`);
      }
    } catch (e) {
      alert('Failed to cancel reservation.');
    }
  };

  return (
    <div className="app-container">
      {/* Top Header only on customer view so admin has native Material sidebar & navbar */}
      {activePortal === 'customer' && (
        <Header 
          backendHealth={backendHealth} 
          onOpenIntel={() => setIntelOpen(true)}
          activePortal={activePortal}
          onSelectPortal={(portal) => {
            if (portal === 'admin' && currentUser?.role !== 'admin') {
              handleOpenAuth('login', true);
            } else {
              setActivePortal(portal);
            }
          }}
          customerBookingsCount={customerBookings.length}
          currentUser={currentUser}
          onOpenAuth={handleOpenAuth}
          onLogout={handleLogout}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}

      {/* Main Content Render based on Active Portal */}
      <main>
        <ErrorBoundary>
          {activePortal === 'customer' || currentUser?.role !== 'admin' ? (
            <CustomerPortal 
              onBookingCreated={handleCustomerBookingCreated}
              onSwitchToAdmin={() => {
                if (currentUser?.role === 'admin') {
                  setActivePortal('admin');
                  setActiveTab('monitor');
                } else {
                  handleOpenAuth('login', true);
                }
              }}
              metadata={metadata}
              apiBaseUrl={API_BASE_URL}
              currentUser={currentUser}
              onOpenAuth={handleOpenAuth}
            />
          ) : (
            <AdminMaterialDashboard 
              reservations={customerBookings}
              selectedCustomerBooking={selectedCustomerBooking}
              onSelectBooking={(bk) => {
                setSelectedCustomerBooking(bk);
                setActiveTab('single');
              }}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onRefresh={fetchSystemStatus}
              onCancelReservation={handleAdminCancelReservation}
              isLoading={isLoadingReservations}
              metadata={metadata}
              apiBaseUrl={API_BASE_URL}
              currentUser={currentUser}
              onLogout={handleLogout}
              onSwitchToCustomer={() => setActivePortal('customer')}
              onOpenIntel={() => setIntelOpen(true)}
              theme={theme}
              onToggleTheme={toggleTheme}
            />
          )}
        </ErrorBoundary>
      </main>

      {/* Authentication Modal with Customer Sign In, Register, and Admin Access */}
      <AuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        initialMode={authModalMode}
        adminPrompt={authModalAdminPrompt}
        apiBaseUrl={API_BASE_URL}
      />

      {/* Modal Dialog for Model Intel & Architecture */}
      <ModelIntelModal 
        isOpen={intelOpen} 
        onClose={() => setIntelOpen(false)} 
      />

      {/* Footer for Customer Portal */}
      {activePortal === 'customer' && (
        <footer style={{ marginTop: '3.5rem', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <p>OSTRO Salento • Cliff Sanctuary & Predictive Hospitality • Operational Intelligence Engine</p>
        </footer>
      )}
    </div>
  );
}
