import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import '../styles/Sidebar.css';

export default function Sidebar({ onClose }) {
  const navigate = useNavigate();

  const handleMenuClick = (path) => {
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    localStorage.removeItem('authToken');
    navigate('/login');
    onClose();
  };

  const icons = {
    account: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 12.75c2.899 0 5.25-2.351 5.25-5.25S14.899 2.25 12 2.25 6.75 4.601 6.75 7.5s2.351 5.25 5.25 5.25Z" />
        <path d="M4.5 21.75a7.5 7.5 0 0 1 15 0" />
      </svg>
    ),
    language: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9.75" />
        <path d="M2.25 12h19.5" />
        <path d="M12 2.25c3.5 4.5 3.5 15 0 19.5" />
        <path d="M9 3.75c-1.5 3-1.5 13.5 0 16.5" />
        <path d="M15 3.75c1.5 3 1.5 13.5 0 16.5" />
      </svg>
    ),
    resources: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 3.75h12" />
        <path d="M6 20.25h12" />
        <path d="M6.75 3.75v16.5" />
        <path d="M17.25 3.75v16.5" />
        <path d="M9.75 7.5h4.5" />
        <path d="M9.75 11.25h4.5" />
        <path d="M9.75 15h4.5" />
      </svg>
    ),
    help: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 21.75a9.75 9.75 0 1 0 0-19.5 9.75 9.75 0 0 0 0 19.5Z" />
        <path d="M10.125 8.25c.375-1.125 1.5-1.5 2.25-1.5 1.125 0 2.625.75 2.625 2.25 0 1.5-1.125 2.25-1.875 2.625-.75.375-.75.75-.75 1.875" />
        <circle cx="12" cy="16.125" r="1.125" />
      </svg>
    ),
    cohost: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7.5 10.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
        <path d="M16.5 10.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
        <path d="M2.25 20.25c0-3 2.25-5.25 5.25-5.25s5.25 2.25 5.25 5.25" />
        <path d="M11.25 17.25c1.05-1.65 2.85-2.25 4.5-2.25 3 0 6 2.25 6 5.25" />
      </svg>
    ),
    listing: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3.75 9.75 12 2.25l8.25 7.5" />
        <path d="M6 9.75v10.5h12V9.75" />
        <path d="M9.75 20.25v-6h4.5v6" />
      </svg>
    ),
    refer: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8.25 10.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
        <path d="M15.75 10.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
        <path d="M4.5 20.25c0-3 2.25-5.25 5.25-5.25" />
        <path d="M19.5 20.25c0-3-2.25-5.25-5.25-5.25" />
        <path d="M12 13.5c-3 0-5.25 2.25-5.25 5.25h10.5C17.25 15.75 15 13.5 12 13.5Z" />
      </svg>
    ),
    logout: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 21.75H6.75a2.25 2.25 0 0 1-2.25-2.25V4.5a2.25 2.25 0 0 1 2.25-2.25H9" />
        <path d="m15 16.5 3.75-4.5L15 7.5" />
        <path d="M18.75 12H9" />
      </svg>
    ),
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);
  return createPortal(
    <>
      {/* Overlay */}
      <div className="sidebar-overlay" onClick={onClose}></div>

      {/* Sidebar */}
      <div className="sidebar" role="dialog" aria-modal="true" aria-label="Host menu">
        <div className="sidebar-header">
          <h2>Menu</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close menu">✕</button>
        </div>

        <div className="sidebar-content">
          {/* New to Airbnb Card */}
          <div className="new-to-airbnb-card">
            <div className="card-images">
              <div className="card-image img-1"></div>
              <div className="card-image img-2"></div>
            </div>
            <h3>New to Airbnb?</h3>
            <p>Discover tips and best practices shared by top-rated hosts.</p>
            <button className="get-started-btn" onClick={() => handleMenuClick('/host/onboarding')}>
              Get started
            </button>
          </div>

          {/* Menu Sections */}
          <div className="menu-section">
            <button className="menu-item" onClick={() => handleMenuClick('/host/account-settings')}>
              <span className="menu-icon">{icons.account}</span>
              <span>Account settings</span>
            </button>
            <button className="menu-item" onClick={() => handleMenuClick('/host/languages')}>
              <span className="menu-icon">{icons.language}</span>
              <span>Languages & currency</span>
            </button>
          </div>

          <div className="menu-divider"></div>

          <div className="menu-section">
            <button className="menu-item" onClick={() => handleMenuClick('/host/resources')}>
              <span className="menu-icon">{icons.resources}</span>
              <span>Hosting resources</span>
            </button>
            <button className="menu-item" onClick={() => handleMenuClick('/host/help')}>
              <span className="menu-icon">{icons.help}</span>
              <span>Get help</span>
            </button>
            <button className="menu-item" onClick={() => handleMenuClick('/host/co-host')}>
              <span className="menu-icon">{icons.cohost}</span>
              <span>Find a co-host</span>
            </button>
            <button className="menu-item" onClick={() => handleMenuClick('/onboarding/type')}>
              <span className="menu-icon">{icons.listing}</span>
              <span>Create a new listing</span>
            </button>
            <button className="menu-item" onClick={() => handleMenuClick('/host/refer')}>
              <span className="menu-icon">{icons.refer}</span>
              <span>Refer a host</span>
            </button>
          </div>

          <div className="menu-divider"></div>

          <div className="menu-section">
            <button className="menu-item logout" onClick={handleLogout}>
              <span className="menu-icon">{icons.logout}</span>
              <span>Log out</span>
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
