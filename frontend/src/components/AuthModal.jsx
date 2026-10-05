import React, { useState, useEffect } from 'react';
import { 
  Lock, User, Mail, ShieldAlert, KeyRound, CheckCircle2, 
  AlertCircle, ArrowRight, X, Sparkles, Building2, Eye, EyeOff
} from 'lucide-react';

export default function AuthModal({ 
  isOpen, 
  onClose, 
  onAuthSuccess, 
  initialMode = 'login', // 'login' | 'register' | 'admin'
  apiBaseUrl = 'http://127.0.0.1:8000',
  adminPrompt = false
}) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register' | 'admin'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    setMode(initialMode);
    setError(null);
    setSuccessMsg(null);
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  // Pre-fill Admin Demo Credentials
  const fillAdminCredentials = () => {
    setUsername('admin');
    setPassword('admin123');
    setError(null);
  };

  // Pre-fill Customer Demo Credentials
  const fillCustomerCredentials = () => {
    setUsername('alexandra');
    setPassword('guest123');
    setError(null);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const identifier = username.trim() || email.trim();
    if (!identifier || !password) {
      setError('Please provide your username/email and password.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Authentication failed. Please verify credentials.');
      }

      setSuccessMsg(`Welcome back, ${data.user.name}!`);
      setTimeout(() => {
        onAuthSuccess(data.user);
        onClose();
      }, 500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!name.trim() || !username.trim() || !email.trim() || !password) {
      setError('All fields are required.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${apiBaseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim().toLowerCase(),
          email: email.trim().toLowerCase(),
          password,
          role: 'customer'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Registration failed.');
      }

      setSuccessMsg(`Account created for ${data.user.name}! Logging you in...`);
      setTimeout(() => {
        onAuthSuccess(data.user);
        onClose();
      }, 700);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '480px', padding: '2rem' }}
      >
        {/* Close Button */}
        <button 
          type="button" 
          className="modal-close-btn" 
          onClick={onClose}
          style={{ position: 'absolute', top: '1.25rem', right: '1.25rem' }}
        >
          <X size={20} />
        </button>

        {/* Admin Access Restriction Notice if prompted */}
        {adminPrompt && mode === 'admin' && (
          <div style={{ padding: '0.85rem 1rem', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '12px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <ShieldAlert size={20} color="#f43f5e" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: '0.78rem', color: '#fecdd3' }}>
              <strong>Staff Authorization Required:</strong> Sign in with an administrator account to access the hotel operational revenue monitor.
            </p>
          </div>
        )}

        {/* Tab Switcher */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: '0.25rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem', gap: '0.25rem' }}>
          <button
            type="button"
            className="preset-btn"
            onClick={() => { setMode('login'); setError(null); }}
            style={{
              flex: 1,
              background: mode === 'login' ? 'var(--primary-500)' : 'transparent',
              color: mode === 'login' ? '#fff' : 'var(--text-secondary)',
              borderColor: mode === 'login' ? 'var(--primary-500)' : 'transparent',
              fontSize: '0.78rem',
              fontWeight: mode === 'login' ? 700 : 500
            }}
          >
            Customer Sign In
          </button>

          <button
            type="button"
            className="preset-btn"
            onClick={() => { setMode('register'); setError(null); }}
            style={{
              flex: 1,
              background: mode === 'register' ? 'var(--primary-500)' : 'transparent',
              color: mode === 'register' ? '#fff' : 'var(--text-secondary)',
              borderColor: mode === 'register' ? 'var(--primary-500)' : 'transparent',
              fontSize: '0.78rem',
              fontWeight: mode === 'register' ? 700 : 500
            }}
          >
            Register
          </button>

          <button
            type="button"
            className="preset-btn"
            onClick={() => { setMode('admin'); setError(null); }}
            style={{
              flex: 1,
              background: mode === 'admin' ? 'linear-gradient(135deg, rgba(244,63,94,0.4), rgba(168,85,247,0.4))' : 'transparent',
              color: mode === 'admin' ? '#fff' : '#fda4af',
              borderColor: mode === 'admin' ? 'var(--risk-high)' : 'transparent',
              fontSize: '0.78rem',
              fontWeight: mode === 'admin' ? 700 : 500
            }}
          >
            👑 Staff Admin
          </button>
        </div>

        {/* Header Title */}
        <div style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
            {mode === 'login' && 'Sign In to Your AuraStay Account'}
            {mode === 'register' && 'Create Your Guest Account'}
            {mode === 'admin' && 'Hotel Administrator Login'}
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {mode === 'login' && 'Access direct booking perks and your reservation cancellation history.'}
            {mode === 'register' && 'Register to track past stays and unlock loyalty booking rates.'}
            {mode === 'admin' && 'Authenticate to access the operational cancellation risk dashboard.'}
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '10px', color: '#fda4af', fontSize: '0.8rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', color: '#6ee7b7', fontSize: '0.8rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Quick Demo Pre-Saved Fill Bar */}
        {mode === 'admin' && (
          <div style={{ padding: '0.85rem', background: 'rgba(99,102,241,0.08)', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.25)', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.74rem', color: '#c7d2fe', fontWeight: 600 }}>
                🔑 Pre-Saved Administrator Credentials:
              </span>
              <button
                type="button"
                className="preset-btn"
                onClick={fillAdminCredentials}
                style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', background: 'var(--primary-500)', color: '#fff' }}
              >
                Auto-Fill
              </button>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Username: <strong style={{ color: '#fff' }}>admin</strong> • Password: <strong style={{ color: '#fff' }}>admin123</strong>
            </div>
          </div>
        )}

        {mode === 'login' && (
          <div style={{ padding: '0.85rem', background: 'rgba(16,185,129,0.08)', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.25)', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.74rem', color: '#a7f3d0', fontWeight: 600 }}>
                💡 Sample Customer Account:
              </span>
              <button
                type="button"
                className="preset-btn"
                onClick={fillCustomerCredentials}
                style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem' }}
              >
                Auto-Fill
              </button>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Username: <strong style={{ color: '#fff' }}>alexandra</strong> • Password: <strong style={{ color: '#fff' }}>guest123</strong>
            </div>
          </div>
        )}

        {/* Login & Admin Form */}
        {(mode === 'login' || mode === 'admin') && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label" htmlFor="auth-username">
                {mode === 'admin' ? 'Admin Username or Email' : 'Username or Email'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="auth-username"
                  type="text"
                  className="input-field"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={mode === 'admin' ? 'admin' : 'alexandra or email'}
                  style={{ paddingLeft: '2.3rem' }}
                  required
                />
                <User size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="auth-password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  className="input-field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  style={{ paddingLeft: '2.3rem', paddingRight: '2.3rem' }}
                  required
                />
                <Lock size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
              style={{
                marginTop: '0.5rem',
                background: mode === 'admin' ? 'linear-gradient(135deg, #f43f5e 0%, #a855f7 100%)' : undefined
              }}
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>{mode === 'admin' ? 'Sign In as Administrator' : 'Sign In to Account'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Customer Register Form */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div className="input-group">
              <label className="input-label" htmlFor="reg-name">Full Name</label>
              <input
                id="reg-name"
                type="text"
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alexandra Miller"
                required
              />
            </div>

            <div className="form-row">
              <div className="input-group">
                <label className="input-label" htmlFor="reg-username">Username</label>
                <input
                  id="reg-username"
                  type="text"
                  className="input-field"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. alexandra"
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="reg-email">Email Address</label>
                <input
                  id="reg-email"
                  type="email"
                  className="input-field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. alexandra@example.com"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="input-group">
                <label className="input-label" htmlFor="reg-pwd">Password</label>
                <input
                  id="reg-pwd"
                  type="password"
                  className="input-field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 4 characters"
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="reg-confirm">Confirm Password</label>
                <input
                  id="reg-confirm"
                  type="password"
                  className="input-field"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
              style={{ marginTop: '0.5rem' }}
            >
              {loading ? (
                <span>Registering Account in MongoDB...</span>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
