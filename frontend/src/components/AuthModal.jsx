import React, { useState, useEffect } from 'react';
import { 
  Lock, User, Mail, ShieldAlert, KeyRound, CheckCircle2, 
  AlertCircle, ArrowRight, X, Sparkles, Building2, Eye, EyeOff, LogIn, Compass
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
    setMode('login');
    setUsername('admin');
    setPassword('admin123');
    setError(null);
  };

  // Pre-fill Customer Demo Credentials
  const fillCustomerCredentials = () => {
    setMode('login');
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
        className="ostro-auth-modal" 
        onClick={(e) => e.stopPropagation()} 
      >
        {/* Close Button */}
        <button 
          type="button" 
          className="ostro-auth-close-btn" 
          onClick={onClose}
          title="Close window"
        >
          <X size={18} />
        </button>

        {/* Brand Crest Header */}
        <div className="ostro-auth-crest-wrap">
          <div className="ostro-auth-crest-icon">
            <Compass size={22} strokeWidth={2.2} />
          </div>
          <span className="ostro-auth-eyebrow">✦ OSTRO SALENTO SANCTUARY</span>
          <h3 className="ostro-auth-title">
            {mode === 'login' ? 'Sanctuary Access' : 'Create Guest Account'}
          </h3>
          <p className="ostro-auth-subtitle">
            {mode === 'login' 
              ? 'Sign in to confirm reservations or access the hotel operations desk.' 
              : 'Register to unlock member rates and stay history tracking.'}
          </p>
        </div>

        {/* Admin Access Prompt if redirected */}
        {adminPrompt && (
          <div className="ostro-auth-alert-admin">
            <ShieldAlert size={18} color="#e11d48" style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ display: 'block', fontSize: '0.8rem' }}>Admin Access Required</strong>
              <span>Sign in with an administrator account to access the operations desk.</span>
            </div>
          </div>
        )}

        {/* Tab Switcher: Sign In vs Create Account */}
        <div className="ostro-auth-tabs">
          <button
            type="button"
            className={`ostro-auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(null); }}
          >
            <LogIn size={14} />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            className={`ostro-auth-tab-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setError(null); }}
          >
            <User size={14} />
            <span>Create Account</span>
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="ostro-auth-alert-error">
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="ostro-auth-alert-success">
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* UNIFIED SIGN IN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="ostro-auth-label" htmlFor="login_ident">
                <User size={13} color="var(--ostro-terracotta)" />
                <span>Username or Email</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login_ident"
                  type="text"
                  className="ostro-auth-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. alexandra or admin"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="ostro-auth-label" htmlFor="login_pwd">
                <KeyRound size={13} color="var(--ostro-terracotta)" />
                <span>Password</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login_pwd"
                  type={showPassword ? 'text' : 'password'}
                  className="ostro-auth-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="ostro-auth-eye-btn"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="ostro-auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <LogIn size={16} />
                  <span>Sign In to Sanctuary</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {/* Quick Demo Pre-Fill Helpers */}
            <div style={{ 
              marginTop: '0.65rem', 
              paddingTop: '0.75rem', 
              borderTop: '1px solid var(--border-subtle)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.4rem'
            }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Quick Demo Fill:</span>
              <div style={{ display: 'flex', gap: '0.45rem' }}>
                <button
                  type="button"
                  className="ostro-auth-demo-pill ostro-auth-demo-guest"
                  onClick={fillCustomerCredentials}
                  title="Fill guest credentials: alexandra / guest123"
                >
                  <User size={12} />
                  <span>Guest</span>
                </button>
                <button
                  type="button"
                  className="ostro-auth-demo-pill ostro-auth-demo-admin"
                  onClick={fillAdminCredentials}
                  title="Fill admin credentials: admin / admin123"
                >
                  <Sparkles size={12} />
                  <span>Admin</span>
                </button>
              </div>
            </div>

            {/* Mode Switch to Registration */}
            <div className="ostro-auth-switch-footer">
              <span>Don't have an account yet?</span>
              <button 
                type="button" 
                className="ostro-auth-switch-link"
                onClick={() => { setMode('register'); setError(null); }}
              >
                Create one here
              </button>
            </div>
          </form>
        )}

        {/* CUSTOMER REGISTRATION FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="ostro-auth-label" htmlFor="reg_name">
                  <User size={13} color="var(--ostro-terracotta)" />
                  <span>Full Name</span>
                </label>
                <input
                  id="reg_name"
                  type="text"
                  className="ostro-auth-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jonathan Harker"
                  required
                />
              </div>

              <div>
                <label className="ostro-auth-label" htmlFor="reg_uname">
                  <User size={13} color="var(--ostro-terracotta)" />
                  <span>Username</span>
                </label>
                <input
                  id="reg_uname"
                  type="text"
                  className="ostro-auth-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. jonathan"
                  required
                />
              </div>
            </div>

            <div>
              <label className="ostro-auth-label" htmlFor="reg_email">
                <Mail size={13} color="var(--ostro-terracotta)" />
                <span>Email Address</span>
              </label>
              <input
                id="reg_email"
                type="email"
                className="ostro-auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. jonathan@example.com"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="ostro-auth-label" htmlFor="reg_pwd">
                  <Lock size={13} color="var(--ostro-terracotta)" />
                  <span>Password</span>
                </label>
                <input
                  id="reg_pwd"
                  type="password"
                  className="ostro-auth-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 4 chars"
                  required
                />
              </div>

              <div>
                <label className="ostro-auth-label" htmlFor="reg_cpwd">
                  <KeyRound size={13} color="var(--ostro-terracotta)" />
                  <span>Confirm Password</span>
                </label>
                <input
                  id="reg_cpwd"
                  type="password"
                  className="ostro-auth-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="ostro-auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <span>Registering Account...</span>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Create Account & Unlock Sanctuary</span>
                </>
              )}
            </button>

            {/* Mode Switch to Login */}
            <div className="ostro-auth-switch-footer">
              <span>Already have an account?</span>
              <button 
                type="button" 
                className="ostro-auth-switch-link"
                onClick={() => { setMode('login'); setError(null); }}
              >
                Sign in here
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
