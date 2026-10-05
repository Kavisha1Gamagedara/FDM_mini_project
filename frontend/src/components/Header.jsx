import React from 'react';
import { ShieldAlert, Cpu, Info, Hotel, Activity, LogIn, LogOut, User, Crown } from 'lucide-react';

export default function Header({ 
  backendHealth, 
  onOpenIntel, 
  activePortal, 
  onSelectPortal, 
  customerBookingsCount = 0,
  currentUser = null,
  onOpenAuth,
  onLogout
}) {
  const handleAdminPortalClick = () => {
    // If not logged in as admin, prompt authentication
    if (!currentUser || currentUser.role !== 'admin') {
      if (onOpenAuth) {
        onOpenAuth('admin', true);
      }
    } else {
      onSelectPortal('admin');
    }
  };

  return (
    <header className="navbar">
      <div className="brand-section">
        <div className="brand-logo">
          <Hotel size={24} color="#ffffff" />
        </div>
        <div className="brand-title-wrap">
          <h1>
            AuraStay AI
            <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: '9999px', color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Stage 9 Operational
            </span>
          </h1>
          <p className="brand-subtitle">
            {activePortal === 'customer' 
              ? 'Luxury Guest Reservation & Direct Booking Engine' 
              : 'Hotel Reservation Cancellation Risk Intelligence & Revenue Optimization'}
          </p>
        </div>
      </div>

      <div className="nav-controls">
        {/* Portal Switcher: ONLY available to authenticated Admins */}
        {currentUser?.role === 'admin' && (
          <div style={{ display: 'flex', background: 'rgba(11,15,25,0.7)', padding: '0.25rem', borderRadius: '12px', border: '1px solid rgba(244,63,94,0.3)', gap: '0.25rem' }}>
            <button
              type="button"
              className="preset-btn"
              onClick={() => onSelectPortal('customer')}
              style={{
                background: activePortal === 'customer' ? 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(168,85,247,0.3))' : 'transparent',
                color: activePortal === 'customer' ? '#ffffff' : 'var(--text-secondary)',
                borderColor: activePortal === 'customer' ? 'var(--primary-500)' : 'transparent',
                fontWeight: activePortal === 'customer' ? 700 : 500,
                fontSize: '0.8rem',
                padding: '0.4rem 0.75rem'
              }}
            >
              🛎️ Guest View
            </button>

            <button
              type="button"
              className="preset-btn"
              onClick={() => onSelectPortal('admin')}
              style={{
                background: activePortal === 'admin' ? 'linear-gradient(135deg, rgba(244,63,94,0.3), rgba(225,29,72,0.3))' : 'transparent',
                color: activePortal === 'admin' ? '#ffffff' : '#fda4af',
                borderColor: activePortal === 'admin' ? '#f43f5e' : 'transparent',
                fontWeight: activePortal === 'admin' ? 700 : 500,
                fontSize: '0.8rem',
                padding: '0.4rem 0.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <span>🛡️ Admin Dashboard</span>
              {customerBookingsCount > 0 && (
                <span style={{ fontSize: '0.65rem', background: '#f43f5e', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '9999px', fontWeight: 800 }}>
                  {customerBookingsCount}
                </span>
              )}
            </button>
          </div>
        )}

        {/* User Account / RBAC Status Badge */}
        {currentUser ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: 600,
              background: currentUser.role === 'admin' ? 'rgba(244,63,94,0.15)' : 'rgba(99,102,241,0.15)',
              border: `1px solid ${currentUser.role === 'admin' ? 'rgba(244,63,94,0.35)' : 'rgba(99,102,241,0.35)'}`,
              color: currentUser.role === 'admin' ? '#fda4af' : '#c7d2fe'
            }}>
              {currentUser.role === 'admin' ? (
                <>
                  <Crown size={14} color="#f43f5e" />
                  <span>Admin: {currentUser.username}</span>
                </>
              ) : (
                <>
                  <User size={14} color="#818cf8" />
                  <span>{currentUser.name || currentUser.username} (Guest)</span>
                </>
              )}
            </div>

            {currentUser.role === 'customer' && (
              <button
                type="button"
                className="preset-btn"
                onClick={() => onSelectPortal('admin')}
                style={{ fontSize: '0.74rem', padding: '0.35rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', borderColor: 'rgba(255,255,255,0.12)', color: 'var(--text-muted)' }}
                title="Switch to Hotel Admin Access"
              >
                <span>🔒 Admin Access</span>
              </button>
            )}

            <button
              type="button"
              className="preset-btn"
              onClick={onLogout}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)' }}
              title="Sign Out"
            >
              <LogOut size={13} />
              <span>Log Out</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.45rem' }}>
            <button
              type="button"
              className="preset-btn"
              onClick={() => onOpenAuth('login')}
              style={{ 
                fontSize: '0.8rem', 
                padding: '0.4rem 0.85rem', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.4rem',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(168,85,247,0.2) 100%)',
                borderColor: 'rgba(129,140,248,0.4)',
                color: '#fff',
                fontWeight: 600
              }}
            >
              <LogIn size={14} color="#818cf8" />
              <span>Customer Sign In / Register</span>
            </button>

            <button
              type="button"
              className="preset-btn"
              onClick={() => onSelectPortal('admin')}
              style={{ 
                fontSize: '0.78rem', 
                padding: '0.4rem 0.75rem', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.35rem', 
                borderColor: 'rgba(244,63,94,0.35)', 
                color: '#fda4af' 
              }}
              title="Hotel Staff & Administration"
            >
              <Crown size={14} color="#f43f5e" />
              <span>Admin Login</span>
            </button>
          </div>
        )}

        {activePortal === 'admin' && (
          <>
            <div className="health-badge" title="Backend ML Inference Status">
              <span className="health-pulse"></span>
              <span>
                {backendHealth?.status === 'healthy' 
                  ? `XGBoost Champion (93 Features)` 
                  : 'ML Initializing'}
              </span>
            </div>

            <button 
              className="preset-btn"
              onClick={onOpenIntel}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderColor: 'rgba(99,102,241,0.3)' }}
              title="View Model Metrics & Architecture"
            >
              <Info size={16} color="#818cf8" />
              <span>Model Architecture</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}
