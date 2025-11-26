import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LayoutHeader.css';
import Sidebar from './Sidebar';
import { useAppSelector } from '../store/hooks';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAppSelector((state) => state.auth);
  const userName = currentUser?.name || currentUser?.email || 'Host';

  const menuIcons = {
    dashboard: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3.75 9.75 12 2.25l8.25 7.5" />
        <path d="M6 9.75v10.5h12V9.75" />
        <path d="M9.75 20.25v-6h4.5v6" />
      </svg>
    ),
    listings: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3.75 3.75h16.5" />
        <path d="M3.75 8.25h16.5" />
        <path d="M3.75 12.75h16.5" />
        <path d="M3.75 17.25h16.5" />
        <circle cx="6.75" cy="6" r="1.5" />
        <circle cx="6.75" cy="10.5" r="1.5" />
        <circle cx="6.75" cy="15" r="1.5" />
        <circle cx="6.75" cy="19.5" r="1.5" />
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
  };

  const menuItems = [
    { label: 'Dashboard', path: '/', icon: menuIcons.dashboard },
    { label: 'Listings', path: '/host/listings', icon: menuIcons.listings },
    { label: 'Bookings', path: '/host/bookings', icon: menuIcons.bookings },
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
            <button className="switch-traveling" onClick={() => window.location.href = 'http://abe6856d8cc9d449eb0e420eef657eb2-612137670.us-east-1.elb.amazonaws.com/login'}>
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
