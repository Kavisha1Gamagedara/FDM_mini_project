import React from 'react';
import { Compass, LogIn, LogOut, User, Crown, ChevronRight, Info } from 'lucide-react';

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
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="ostro-floating-nav-wrapper">
      <div className="ostro-floating-nav">
        
        {/* Left Circular White Emblem Badge (Matches image logo circle) */}
        <button 
          type="button" 
          onClick={scrollToTop}
          className="ostro-nav-circle-logo"
          title="OSTRO Salento • Cliff Sanctuary"
        >
          <Compass size={20} color="#111827" strokeWidth={2.2} />
        </button>

        {/* Center Navigation Links (Matches image: Work, About, Playground, Resource) */}
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
          <a href="#booking-engine" className="ostro-nav-link ostro-nav-link-accent">
            Reserve
          </a>
        </nav>

        {/* Admin Portal Toggle (Only shown when Admin is logged in) */}
        {currentUser?.role === 'admin' && (
          <div className="ostro-nav-admin-toggle">
            <button
              type="button"
              onClick={() => onSelectPortal(activePortal === 'admin' ? 'customer' : 'admin')}
              className={`ostro-admin-toggle-btn ${activePortal === 'admin' ? 'active-admin' : ''}`}
            >
              {activePortal === 'admin' ? '🛎️ Guest View' : '🛡️ Admin Portal'}
              {customerBookingsCount > 0 && activePortal !== 'admin' && (
                <span className="ostro-admin-count">{customerBookingsCount}</span>
              )}
            </button>
            {activePortal === 'admin' && onOpenIntel && (
              <button
                type="button"
                onClick={onOpenIntel}
                className="ostro-admin-toggle-btn"
                title="Model Intel"
                style={{ marginLeft: '0.35rem' }}
              >
                <Info size={13} color="#818cf8" />
                <span>Intel</span>
              </button>
            )}
          </div>
        )}

        {/* Right White Capsule Button (Matches email pill in user image: ihyaet@gmail.com) */}
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
            <ChevronRight size={15} color="#111827" />
          </button>
        )}

      </div>
    </header>
  );
}
