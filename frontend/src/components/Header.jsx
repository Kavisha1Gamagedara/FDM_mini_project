import React from 'react';
import { ShieldAlert, Cpu, Info, Hotel, Activity } from 'lucide-react';

export default function Header({ backendHealth, onOpenIntel, activePortal, onSelectPortal, customerBookingsCount = 0 }) {
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
        {/* Portal Switcher Pills */}
        <div style={{ display: 'flex', background: 'rgba(11,15,25,0.7)', padding: '0.25rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', gap: '0.25rem' }}>
          <button
            type="button"
            className="preset-btn"
            onClick={() => onSelectPortal('customer')}
            style={{
              background: activePortal === 'customer' ? 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(168,85,247,0.3))' : 'transparent',
              color: activePortal === 'customer' ? '#ffffff' : 'var(--text-secondary)',
              borderColor: activePortal === 'customer' ? 'var(--primary-500)' : 'transparent',
              fontWeight: activePortal === 'customer' ? 700 : 500
            }}
          >
            🛎️ Guest Portal
          </button>

          <button
            type="button"
            className="preset-btn"
            onClick={() => onSelectPortal('admin')}
            style={{
              background: activePortal === 'admin' ? 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(168,85,247,0.3))' : 'transparent',
              color: activePortal === 'admin' ? '#ffffff' : 'var(--text-secondary)',
              borderColor: activePortal === 'admin' ? 'var(--primary-500)' : 'transparent',
              fontWeight: activePortal === 'admin' ? 700 : 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <span>🛡️ Admin Portal</span>
            {customerBookingsCount > 0 && (
              <span style={{ fontSize: '0.65rem', background: '#f43f5e', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '9999px', fontWeight: 800 }}>
                {customerBookingsCount}
              </span>
            )}
          </button>
        </div>

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
