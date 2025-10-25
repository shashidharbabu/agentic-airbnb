import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LayoutHeader.css';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const userName = currentUser?.name || currentUser?.email || 'Host';

  const menuIcons = {
    listings: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3.75 9.75 12 2.25l8.25 7.5" />
        <path d="M6 9.75v10.5h12V9.75" />
        <path d="M9.75 20.25v-6h4.5v6" />
      </svg>
    ),
    bookings: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5.25 3.75h13.5" />
        <path d="M6.75 6.75v-3" />
        <path d="M17.25 6.75v-3" />
        <path d="M4.5 7.5h15" />
        <path d="M5.25 20.25h13.5a1.5 1.5 0 0 0 1.5-1.5V7.5H3.75v11.25a1.5 1.5 0 0 0 1.5 1.5Z" />
        <path d="m9.75 13.5 1.875 1.875L14.25 12.75" />
      </svg>
    ),
    calendar: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5.25 3.75h13.5" />
        <path d="M6.75 6.75v-3" />
        <path d="M17.25 6.75v-3" />
        <path d="M4.5 7.5h15" />
        <path d="M5.25 20.25h13.5a1.5 1.5 0 0 0 1.5-1.5V7.5H3.75v11.25a1.5 1.5 0 0 0 1.5 1.5Z" />
        <path d="M8.25 12h2.25v2.25H8.25Z" />
        <path d="M13.5 12h2.25v2.25H13.5Z" />
        <path d="M8.25 15.75h2.25V18H8.25Z" />
        <path d="M13.5 15.75h2.25V18H13.5Z" />
      </svg>
    ),
  };

  const menuItems = [
    { label: 'Listings', path: '/host/listings', icon: menuIcons.listings },
    { label: 'Bookings', path: '/host/bookings', icon: menuIcons.bookings },
    { label: 'Calendar', path: '/host/calendar', icon: menuIcons.calendar },
  ];

  return (
    <div className="layout-container">
      {/* Header */}
      <header className="host-header">
        <div className="header-content">
          {/* Logo */}
          <div className="header-logo" onClick={() => navigate('/host')}>
            <img src="/Airbnb_logo.png" alt="Airbnb" width="88" height="28" />
          </div>

          {/* Main Navigation Menu */}
          <nav className="main-menu">
            {menuItems.map((item) => (
              <a
                key={item.path}
                href={item.path}
                className="menu-item"
                onClick={(e) => {
                  e.preventDefault();
                  navigate(item.path);
                }}
              >
                <span className="menu-icon">{item.icon}</span>
                <span>{item.label}</span>
              </a>
            ))}
          </nav>

          {/* Right Side - Profile & Actions */}
          <div className="header-right">
            {/* Switch to Traveling */}
            <button className="switch-traveling" onClick={() => navigate('/traveler')}>
              Switch to traveling
            </button>

            <button
              className="profile-trigger"
              onClick={() => navigate('/host/profile')}
              aria-label="View profile"
            >
              <div className="profile-avatar">
                {userName.charAt(0).toUpperCase()}
              </div>
            </button>

            {/* Hamburger Menu */}
            <button
              className="hamburger"
              onClick={() => setSidebarOpen(true)}
              aria-label="Toggle menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="host-main">
        {children}
      </main>

      {/* Sidebar Menu */}
      {sidebarOpen && <Sidebar onClose={() => setSidebarOpen(false)} />}

      {/* Footer */}
      <footer className="host-footer">
        <div className="footer-content">
          <p>© {new Date().getFullYear()} Airbnb clone — For lab use</p>
          <div className="footer-links">
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
            <a href="#support">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
