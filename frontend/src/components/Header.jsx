import React from 'react';
import { Compass, LogIn, LogOut, User, Crown, ChevronRight, Info, Lock, Sun, Moon } from 'lucide-react';

export default function Header({ 
  backendHealth, 
  onOpenIntel, 
  activePortal, 
  onSelectPortal, 
  customerBookingsCount = 0,
  currentUser = null,
  onOpenAuth,
  onLogout,
  theme = 'dark',
  onToggleTheme
}) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="ostro-floating-nav-wrapper">
      <div className="ostro-floating-nav">
        
        {/* Left Circular Emblem Badge */}
        <button 
          type="button" 
          onClick={scrollToTop}
          className="ostro-nav-circle-logo"
          title="OSTRO Salento • Cliff Sanctuary"
        >
          <Compass size={20} strokeWidth={2.2} />
        </button>

        {/* Center Navigation Links */}
        <nav className="ostro-nav-links">
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); scrollToTop(); }} 
            className="ostro-nav-link ostro-brand-text"
          >
            OSTRO
          </a>
          <a href="#philosophy" className="ostro-nav-link">
            The Sanctuary
          </a>
          <a href="#suites" className="ostro-nav-link">
            Suites & Villas
          </a>
          <a href="#dining" className="ostro-nav-link">
            Gastronomy
          </a>
          {currentUser?.role === 'admin' ? (
            <span 
              className="ostro-nav-link" 
              style={{ opacity: 0.6, cursor: 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }} 
              title="Reservations locked for administrator accounts. Use Admin Dashboard to create manual bookings."
            >
              <Lock size={12} />
              <span>Reserve (Locked)</span>
            </span>
          ) : (
            <a href="#booking-engine" className="ostro-nav-link-accent">
              Reserve
            </a>
          )}
        </nav>

        {/* Admin Portal Return Button (Only shown when Admin is logged in) */}
        {currentUser?.role === 'admin' && (
          <div className="ostro-nav-admin-toggle">
            <button
              type="button"
              onClick={() => onSelectPortal('admin')}
              className="ostro-admin-toggle-btn"
              title="Return to Admin Dashboard"
            >
              🛡️ Admin Dashboard
            </button>
          </div>
        )}

        {/* Right Section: Theme Toggle Button & User Capsule */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.55rem' }}>
          
          {/* Theme Toggle (Light / Dark) */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="ostro-theme-toggle-btn"
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {theme === 'dark' ? (
              <Sun size={17} className="theme-toggle-icon sun-icon" />
            ) : (
              <Moon size={17} className="theme-toggle-icon moon-icon" />
            )}
          </button>

          {/* Right White Capsule Button (Matches email pill in user image) */}
          {currentUser ? (
            <div className="ostro-user-pill-wrap">
              <div className="ostro-nav-white-btn ostro-logged-in-pill">
                {currentUser.role === 'admin' ? (
                  <Crown size={15} color="#e11d48" />
                ) : (
                  <User size={15} color="#4f46e5" />
                )}
                <span className="ostro-user-name">
                  {currentUser.email || currentUser.name || currentUser.username}
                </span>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="ostro-logout-btn"
                title="Sign Out"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onOpenAuth('login')}
              className="ostro-nav-white-btn"
            >
              <span>Sign In / Register</span>
              <ChevronRight size={15} />
            </button>
          )}

        </div>

      </div>
    </header>
  );
}
