import React, { useState } from 'react';
import { 
  ShieldCheck, Lock, Key, ArrowRight, UserCheck, 
  AlertCircle, Sparkles, Building, ShieldAlert, ArrowLeft 
} from 'lucide-react';

export default function AdminLoginGate({ 
  apiBaseUrl = 'http://127.0.0.1:8000', 
  onAuthSuccess, 
  onCancel,
  currentUser = null 
}) {
  const [identifier, setIdentifier] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fillPreSavedAdmin = () => {
    setIdentifier('admin');
    setPassword('admin123');
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const cleanId = identifier.trim();
    if (!cleanId || !password) {
      setError('Please provide administrative username and password.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanId, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Authentication failed. Please verify credentials.');
      }

      if (data.user.role !== 'admin') {
        throw new Error(`Access Denied: Account '${data.user.username}' is a Customer account. Only authorized Hotel Administrators can access the Admin Operations Dashboard.`);
      }

      onAuthSuccess(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: '680px', 
      margin: '2rem auto 4rem auto', 
      padding: '0 1rem' 
    }}>
      <div className="glass-panel" style={{ 
        padding: '3rem 2.5rem', 
        borderRadius: '24px', 
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 27, 75, 0.9) 100%)',
        border: '1px solid rgba(244, 63, 94, 0.35)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(244, 63, 94, 0.15)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        
        {/* Glow Accent */}
        <div style={{
          position: 'absolute',
          top: '-100px',
          right: '-100px',
          width: '260px',
          height: '260px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(244, 63, 94, 0.25) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        {/* Lock / Security Icon Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            borderRadius: '20px', 
            background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.2) 0%, rgba(225, 29, 72, 0.3) 100%)',
            border: '1px solid rgba(244, 63, 94, 0.5)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 1.25rem auto',
            boxShadow: '0 0 24px rgba(244, 63, 94, 0.3)'
          }}>
            <Lock size={32} color="#f43f5e" />
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.25rem 0.75rem', background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '9999px', fontSize: '0.74rem', color: '#fda4af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
            <ShieldAlert size={14} color="#f43f5e" />
            <span>Restricted Operational Area</span>
          </div>

          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
            Administrator Access Required
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.55, maxWidth: '500px', margin: '0 auto' }}>
            The Admin Dashboard contains sensitive hotel operational roster data, real-time cancellation machine learning predictions, and revenue risk metrics. Please sign in with administrator credentials.
          </p>
        </div>

        {/* Notice if currently signed in as customer */}
        {currentUser && currentUser.role === 'customer' && (
          <div style={{
            padding: '0.9rem 1.1rem',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            fontSize: '0.82rem',
            color: '#fde68a'
          }}>
            <AlertCircle size={18} color="#fbbf24" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Currently Signed In as Customer: {currentUser.name} ({currentUser.email})</strong>
              <div style={{ color: 'rgba(253, 230, 138, 0.85)', marginTop: '0.2rem' }}>
                Customer accounts cannot access internal revenue management. Please log in with administrator credentials below to enter the admin portal.
              </div>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div style={{
            padding: '0.85rem 1rem',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            color: '#fca5a5',
            fontSize: '0.84rem'
          }}>
            <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Pre-saved Admin Credentials Pill */}
        <div style={{
          padding: '0.9rem 1.25rem',
          background: 'rgba(99, 102, 241, 0.12)',
          border: '1px dashed rgba(129, 140, 248, 0.4)',
          borderRadius: '14px',
          marginBottom: '1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#c7d2fe', fontWeight: 700 }}>
              <Key size={14} color="#818cf8" />
              <span>PRE-SAVED ADMIN CREDENTIALS</span>
            </div>
            <div style={{ fontSize: '0.84rem', color: '#fff', marginTop: '0.15rem' }}>
              Username: <code style={{ color: '#fda4af', fontWeight: 700 }}>admin</code> • Password: <code style={{ color: '#fda4af', fontWeight: 700 }}>admin123</code>
            </div>
          </div>
          <button
            type="button"
            className="preset-btn"
            onClick={fillPreSavedAdmin}
            style={{ 
              fontSize: '0.78rem', 
              padding: '0.4rem 0.85rem', 
              borderColor: 'rgba(129, 140, 248, 0.5)',
              background: 'rgba(99, 102, 241, 0.25)',
              color: '#fff',
              fontWeight: 600
            }}
          >
            ⚡ Auto-Fill Credentials
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="input-group">
            <label className="input-label" htmlFor="admin_gate_id">Administrator Username or Email</label>
            <input
              id="admin_gate_id"
              type="text"
              className="input-field"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. admin"
              required
              autoFocus
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="admin_gate_pwd">Administrator Password</label>
            <input
              id="admin_gate_pwd"
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              required
            />
          </div>

          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
            style={{ 
              marginTop: '0.5rem', 
              background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
              boxShadow: '0 4px 14px rgba(244, 63, 94, 0.4)'
            }}
          >
            {loading ? (
              <span>Verifying Admin Credentials...</span>
            ) : (
              <>
                <ShieldCheck size={18} />
                <span>Authenticate & Enter Admin Dashboard</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.75rem' }}>
            <button
              type="button"
              onClick={onCancel}
              className="preset-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.82rem',
                padding: '0.45rem 1rem',
                color: 'var(--text-secondary)'
              }}
            >
              <ArrowLeft size={14} />
              <span>Return to Guest Reservation Portal</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
