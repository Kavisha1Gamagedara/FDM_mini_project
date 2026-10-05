import React from 'react';
import { ShieldAlert, Cpu, Info, Hotel, Activity } from 'lucide-react';

export default function Header({ backendHealth, onOpenIntel }) {
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
            Hotel Reservation Cancellation Risk Intelligence & Revenue Optimization
          </p>
        </div>
      </div>

      <div className="nav-controls">
        <div className="health-badge" title="Backend ML Inference Status">
          <span className="health-pulse"></span>
          <span>
            {backendHealth?.status === 'healthy' 
              ? `XGBoost Champion (93 Features)` 
              : 'ML Service Initializing'}
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
      </div>
    </header>
  );
}
