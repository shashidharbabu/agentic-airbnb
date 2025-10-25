import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/airbnb-logo.png';

const Header = ({ isHomePage = false, onHostModalOpen }) => {
  const { traveler, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setShowMenu(false);
  };

  return (
    <header className={`header ${isHomePage ? 'header-home' : ''}`}>
      <div className="header-inner">
        <Link to="/" className="logo" aria-label="Airbnb home">
          <img src={logo} alt="Airbnb" />
        </Link>

        <nav className="nav-center" aria-label="Primary">
          <Link to="/" className={`nav-link ${isHomePage ? 'active' : ''}`}>
            <span className="nav-icon" aria-hidden>🏠</span>
            <span>Homes</span>
          </Link>
          <Link to="/bookings" className="nav-link">
            <span className="nav-icon" aria-hidden>🧳</span>
            <span>Trips</span>
          </Link>
          <Link to="/favorites" className="nav-link">
            <span className="nav-icon" aria-hidden>❤️</span>
            <span>Favorites</span>
          </Link>
          <Link to="/history" className="nav-link">
            <span className="nav-icon" aria-hidden>📚</span>
            <span>History</span>
          </Link>
        </nav>

        <div className="header-right">
          <button 
            className="become-host-btn"
            onClick={onHostModalOpen}
          >
            Become a host
          </button>


          <div className="user-menu" ref={menuRef}>
            <button
              className={`user-menu-btn ${isAuthenticated ? 'profile-btn' : 'hamburger-btn'}`}
              onClick={() => setShowMenu(!showMenu)}
              aria-label={isAuthenticated ? "User menu" : "Main menu"}
            >
              {isAuthenticated ? (
                traveler?.profile_image_url ? (
                  <img 
                    src={traveler.profile_image_url} 
                    alt={traveler.name} 
                    className="profile-image"
                  />
                ) : (
                  <div className="profile-initial">
                    {traveler?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )
              ) : (
                <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" style={{height: '16px', width: '16px', fill: 'currentColor'}}>
                  <path d="M2 16h28M2 24h28M2 8h28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              )}
            </button>

            {showMenu && (
              <div className="user-dropdown">
                {isAuthenticated ? (
                  <>
                    <Link to="/profile" className="dropdown-item" onClick={() => setShowMenu(false)}>
                      Profile
                    </Link>
                    <Link to="/bookings" className="dropdown-item" onClick={() => setShowMenu(false)}>
                      My Bookings
                    </Link>
                    <Link to="/favorites" className="dropdown-item" onClick={() => setShowMenu(false)}>
                      Favorites
                    </Link>
                    <Link to="/history" className="dropdown-item" onClick={() => setShowMenu(false)}>
                      Travel History
                    </Link>
                    <hr className="dropdown-divider" />
                    <button className="dropdown-item logout" onClick={handleLogout}>
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/signup" className="dropdown-item bold" onClick={() => setShowMenu(false)}>
                      Sign up
                    </Link>
                    <Link to="/login" className="dropdown-item" onClick={() => setShowMenu(false)}>
                      Log in
                    </Link>
                    <hr className="dropdown-divider" />
                    <div className="dropdown-item">Help Center</div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .header {
          position: sticky;
          top: 0;
          z-index: 1000;
          background: white;
          border-bottom: 1px solid #e0e0e0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .header-home {
          background: #F7F7F7;
          border-bottom: none;
          box-shadow: none;
        }

        .header-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 70px;
        }

        .logo img {
          height: 40px;
        }

        .nav-center {
          display: flex;
          gap: 30px;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          color: #333;
          font-weight: 500;
          padding: 10px 15px;
          border-radius: 8px;
          transition: background-color 0.2s;
        }

        .nav-link:hover {
          background-color: #f5f5f5;
        }

        .nav-link.active {
          color: #000;
          background-color: transparent;
        }

        .nav-icon {
          font-size: 18px;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .become-host-btn {
          background: none;
          border: none;
          color: #333;
          font-weight: 500;
          padding: 10px 15px;
          border-radius: 8px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .become-host-btn:hover {
          background-color: rgba(0,0,0,0.05);
        }

        .globe-btn {
          background: none;
          border: none;
          color: #333;
          padding: 10px;
          border-radius: 50%;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .globe-btn:hover {
          background-color: rgba(0,0,0,0.05);
        }

        .user-menu-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: 1px solid #ddd;
          border-radius: 25px;
          padding: 8px 12px;
          cursor: pointer;
          transition: all 0.2s;
          width: 40px;
          height: 40px;
        }

        .user-menu-btn:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }

        .profile-btn {
          border-radius: 50%;
          padding: 0;
          overflow: hidden;
        }

        .profile-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }

        .profile-initial {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #FF385C;
          color: white;
          font-weight: 600;
          font-size: 16px;
          border-radius: 50%;
        }

        .user-menu {
          position: relative;
        }

        .user-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          background: white;
          border: 1px solid #ddd;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          min-width: 200px;
          padding: 10px 0;
          margin-top: 8px;
        }

        .dropdown-item {
          display: block;
          padding: 12px 20px;
          text-decoration: none;
          color: #333;
          transition: background-color 0.2s;
          background: none;
          border: none;
          width: 100%;
          text-align: left;
          cursor: pointer;
        }

        .dropdown-item:hover {
          background-color: #f5f5f5;
        }

        .dropdown-item.bold {
          font-weight: 600;
        }

        .dropdown-item.logout {
          background: none;
          border: none;
          width: 100%;
          text-align: left;
          cursor: pointer;
        }

        .dropdown-divider {
          margin: 8px 0;
          border: none;
          border-top: 1px solid #eee;
        }

        @media (max-width: 768px) {
          .nav-center {
            display: none;
          }
          
          .header-inner {
            padding: 0 15px;
          }

          .become-host-btn {
            display: none;
          }
        }
      `}</style>
    </header>
  );
};

export default Header;
