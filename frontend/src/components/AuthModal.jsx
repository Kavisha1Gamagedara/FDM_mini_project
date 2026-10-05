import React, { useState, useEffect } from 'react';
import { 
  Lock, User, Mail, ShieldAlert, KeyRound, CheckCircle2, 
  AlertCircle, ArrowRight, X, Sparkles, Building2, Eye, EyeOff, LogIn
} from 'lucide-react';

export default function AuthModal({ 
  isOpen, 
  onClose, 
  onAuthSuccess, 
  initialMode = 'login', // 'login' | 'register'
  apiBaseUrl = 'http://127.0.0.1:8000',
  adminPrompt = false
}) {
  const [mode, setMode] = useState(initialMode === 'register' ? 'register' : 'login');
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
    setMode(initialMode === 'register' ? 'register' : 'login');
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
      setError('Please enter your username/email and password.');
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
        throw new Error(data.detail || 'Authentication failed. Please check your credentials.');
      }

      if (data.user.role === 'admin') {
        setSuccessMsg(`Welcome, Administrator! Opening operations dashboard...`);
      } else {
        setSuccessMsg(`Welcome back, ${data.user.name}!`);
      }

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
      }, 600);
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
        style={{ maxWidth: '440px', padding: '2rem' }}
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

        {/* Admin Access Prompt if redirected */}
        {adminPrompt && (
          <div style={{ 
            padding: '0.75rem 0.9rem', 
            background: 'rgba(244,63,94,0.1)', 
            border: '1px solid rgba(244,63,94,0.3)', 
            borderRadius: '12px', 
            marginBottom: '1.25rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.65rem' 
          }}>
            <ShieldAlert size={18} color="#f43f5e" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: '0.78rem', color: '#fecdd3' }}>
              <strong>Admin Privilege Required:</strong> Sign in with an administrator account to access the revenue & cancellation dashboard.
            </p>
          </div>
        )}

        {/* Tab Switcher: Sign In vs Create Account */}
        <div style={{ 
          display: 'flex', 
          background: 'rgba(255,255,255,0.03)', 
          padding: '0.25rem', 
          borderRadius: '12px', 
          border: '1px solid var(--border-subtle)', 
          marginBottom: '1.5rem', 
          gap: '0.25rem' 
        }}>
          <button
            type="button"
            className="preset-btn"
            onClick={() => { setMode('login'); setError(null); }}
            style={{
              flex: 1,
              background: mode === 'login' ? 'var(--primary-500)' : 'transparent',
              color: mode === 'login' ? '#fff' : 'var(--text-secondary)',
              borderColor: mode === 'login' ? 'var(--primary-500)' : 'transparent',
              fontSize: '0.8rem',
              fontWeight: mode === 'login' ? 700 : 500,
              padding: '0.45rem'
            }}
          >
            Sign In
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
              fontSize: '0.8rem',
              fontWeight: mode === 'register' ? 700 : 500,
              padding: '0.45rem'
            }}
          >
            Create Account
          </button>
        </div>

        {/* Header Title */}
        <div style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-serif)', letterSpacing: '0.02em' }}>
            {mode === 'login' ? 'Welcome to OSTRO Salento' : 'Create Your Guest Account'}
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {mode === 'login' 
              ? 'Sign in to confirm reservations or manage hotel operations.' 
              : 'Register to unlock member rates and track your stay history.'}
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div style={{ 
            padding: '0.75rem 1rem', 
            background: 'rgba(244,63,94,0.12)', 
            border: '1px solid rgba(244,63,94,0.3)', 
            borderRadius: '10px', 
            color: '#fda4af', 
            fontSize: '0.8rem', 
            marginBottom: '1rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem' 
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{ 
            padding: '0.75rem 1rem', 
            background: 'rgba(16,185,129,0.12)', 
            border: '1px solid rgba(16,185,129,0.3)', 
            borderRadius: '10px', 
            color: '#6ee7b7', 
            fontSize: '0.8rem', 
            marginBottom: '1rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem' 
          }}>
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* UNIFIED SIGN IN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label" htmlFor="login_ident">Username or Email</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login_ident"
                  type="text"
                  className="input-field"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. alexandra or admin"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="login_pwd">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login_pwd"
                  type={showPassword ? 'text' : 'password'}
                  className="input-field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ 
                    position: 'absolute', 
                    right: '10px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    background: 'none', 
                    border: 'none', 
                    color: 'var(--text-muted)', 
                    cursor: 'pointer' 
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
              style={{ marginTop: '0.5rem' }}
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <LogIn size={16} />
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {/* Quick Demo Pre-Fill Helpers */}
            <div style={{ 
              marginTop: '0.75rem', 
              paddingTop: '0.75rem', 
              borderTop: '1px solid var(--border-subtle)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.4rem'
            }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Quick Demo Fill:</span>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  type="button"
                  className="preset-btn"
                  onClick={fillCustomerCredentials}
                  style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}
                  title="Fill guest credentials: alexandra / guest123"
                >
                  👤 Guest
                </button>
                <button
                  type="button"
                  className="preset-btn"
                  onClick={fillAdminCredentials}
                  style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', color: '#fda4af', borderColor: 'rgba(244,63,94,0.3)' }}
                  title="Fill admin credentials: admin / admin123"
                >
                  👑 Admin
                </button>
              </div>
            </div>
          </form>
        )}

        {/* CUSTOMER REGISTRATION FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div className="input-group">
              <label className="input-label" htmlFor="reg_name">Full Name</label>
              <input
                id="reg_name"
                type="text"
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jonathan Harker"
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="reg_uname">Desired Username</label>
              <input
                id="reg_uname"
                type="text"
                className="input-field"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. jonathan"
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="reg_email">Email Address</label>
              <input
                id="reg_email"
                type="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. jonathan@example.com"
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="reg_pwd">Password</label>
              <input
                id="reg_pwd"
                type="password"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 4 characters"
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="reg_cpwd">Confirm Password</label>
              <input
                id="reg_cpwd"
                type="password"
                className="input-field"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                required
              />
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
              style={{ marginTop: '0.5rem' }}
            >
              {loading ? (
                <span>Registering Account...</span>
              ) : (
                <>
                  <User size={16} />
                  <span>Create Account & Sign In</span>
                </>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
