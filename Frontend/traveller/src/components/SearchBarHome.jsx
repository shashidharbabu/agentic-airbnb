import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SearchBarHome = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(null);
  const [location, setLocation] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState({
    adults: 0,
    children: 0,
    infants: 0,
    pets: 0
  });
  
  const searchBarRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target)) {
        setActiveSection(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = () => {
    const totalGuests = guests.adults + guests.children;
    navigate(`/dashboard?location=${location}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${totalGuests}`);
  };

  const updateGuests = (type, increment) => {
    setGuests(prev => ({
      ...prev,
      [type]: Math.max(0, prev[type] + (increment ? 1 : -1))
    }));
  };

  const totalGuests = guests.adults + guests.children + guests.infants;

  const suggestedLocations = [
    { name: "Nearby", description: "Find what's around you", icon: "📍" },
    { name: "Lake Tahoe", description: "Popular lake destination", icon: "🏔️" },
    { name: "San Diego, CA", description: "For sights like Balboa Park", icon: "🏛️" },
    { name: "Los Angeles, CA", description: "For its bustling nightlife", icon: "🌃" },
    { name: "South Lake Tahoe, CA", description: "For nature-lovers", icon: "🌲" },
    { name: "Las Vegas, NV", description: "For its top-notch dining", icon: "🍴" },
    { name: "San Francisco, CA", description: "For sights like Golden Gate Bridge", icon: "🌉" }
  ];

  return (
    <div className="search-bar-home-container" ref={searchBarRef}>
      <div className={`search-bar-home ${activeSection ? 'expanded' : ''}`}>
        <div 
          className={`search-section where-section ${activeSection === 'where' ? 'active' : ''}`}
          onClick={() => setActiveSection('where')}
        >
          <label>Where</label>
          <input
            type="text"
            placeholder="Search destinations"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <div 
          className={`search-section when-section ${activeSection === 'when' ? 'active' : ''}`}
          onClick={() => setActiveSection('when')}
        >
          <label>When</label>
          <input
            type="text"
            placeholder="Add dates"
            value={checkIn && checkOut ? `${checkIn} - ${checkOut}` : ''}
            readOnly
          />
        </div>

        <div 
          className={`search-section who-section ${activeSection === 'who' ? 'active' : ''}`}
          onClick={() => setActiveSection('who')}
        >
          <label>Who</label>
          <input
            type="text"
            placeholder="Add guests"
            value={totalGuests > 0 ? `${totalGuests} guest${totalGuests > 1 ? 's' : ''}` : ''}
            readOnly
          />
        </div>

        <button className="search-button" onClick={handleSearch}>
          <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" style={{height: '16px', width: '16px', fill: 'currentColor'}}>
            <path d="M13 0c7.18 0 13 5.82 13 13 0 2.868-.929 5.519-2.502 7.669l7.916 7.917-2.828 2.828-7.917-7.916A12.942 12.942 0 0 1 13 26C5.82 26 0 20.18 0 13S5.82 0 13 0zm0 4a9 9 0 1 0 0 18 9 9 0 0 0 0-18z"></path>
          </svg>
          <span>Search</span>
        </button>
      </div>

      {activeSection === 'where' && (
        <div className="search-dropdown where-dropdown">
          <div className="suggested-destinations">
            <h4>Suggested destinations</h4>
            <div className="destination-list">
              {suggestedLocations.map((dest, index) => (
                <div 
                  key={index} 
                  className="destination-item"
                  onClick={() => {
                    setLocation(dest.name);
                    setActiveSection(null);
                  }}
                >
                  <span className="dest-icon">{dest.icon}</span>
                  <div className="dest-info">
                    <div className="dest-name">{dest.name}</div>
                    <div className="dest-description">{dest.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSection === 'when' && (
        <div className="search-dropdown when-dropdown">
          <div className="date-picker-section">
            <div className="date-tabs">
              <button className="date-tab active">Dates</button>
              <button className="date-tab">Months</button>
              <button className="date-tab">Flexible</button>
            </div>
            <div className="calendar-container">
              <div className="calendar-month">
                <div className="calendar-header">
                  <button className="calendar-nav-btn">‹</button>
                  <h3>October 2025</h3>
                  <button className="calendar-nav-btn">›</button>
                </div>
                <div className="calendar-grid">
                  <div className="calendar-weekdays">
                    <div>Su</div>
                    <div>Mo</div>
                    <div>Tu</div>
                    <div>We</div>
                    <div>Th</div>
                    <div>Fr</div>
                    <div>Sa</div>
                  </div>
                  <div className="calendar-days">
                    {Array.from({length: 31}, (_, i) => {
                      const day = i + 1;
                      const isSelected = checkIn === `2025-10-${day.toString().padStart(2, '0')}`;
                      return (
                        <button 
                          key={day}
                          className={`calendar-day ${isSelected ? 'selected' : ''}`}
                          onClick={() => setCheckIn(`2025-10-${day.toString().padStart(2, '0')}`)}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="calendar-month">
                <div className="calendar-header">
                  <button className="calendar-nav-btn">‹</button>
                  <h3>November 2025</h3>
                  <button className="calendar-nav-btn">›</button>
                </div>
                <div className="calendar-grid">
                  <div className="calendar-weekdays">
                    <div>Su</div>
                    <div>Mo</div>
                    <div>Tu</div>
                    <div>We</div>
                    <div>Th</div>
                    <div>Fr</div>
                    <div>Sa</div>
                  </div>
                  <div className="calendar-days">
                    {Array.from({length: 30}, (_, i) => {
                      const day = i + 1;
                      const isSelected = checkOut === `2025-11-${day.toString().padStart(2, '0')}`;
                      return (
                        <button 
                          key={day}
                          className={`calendar-day ${isSelected ? 'selected' : ''}`}
                          onClick={() => setCheckOut(`2025-11-${day.toString().padStart(2, '0')}`)}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            <div className="quick-dates">
              <button onClick={() => { setCheckIn('2025-11-01'); setCheckOut('2025-11-02'); setActiveSection(null); }}>± 1 day</button>
              <button onClick={() => { setCheckIn('2025-11-01'); setCheckOut('2025-11-03'); setActiveSection(null); }}>± 2 days</button>
              <button onClick={() => { setCheckIn('2025-11-01'); setCheckOut('2025-11-04'); setActiveSection(null); }}>± 3 days</button>
              <button onClick={() => { setCheckIn('2025-11-01'); setCheckOut('2025-11-08'); setActiveSection(null); }}>± 7 days</button>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'who' && (
        <div className="search-dropdown who-dropdown">
          <div className="guest-picker">
            <div className="guest-row">
              <div className="guest-info">
                <div className="guest-label">Adults</div>
                <div className="guest-sublabel">Ages 13 or above</div>
              </div>
              <div className="guest-counter">
                <button 
                  className="counter-btn"
                  onClick={() => updateGuests('adults', false)}
                  disabled={guests.adults === 0}
                >-</button>
                <span className="counter-value">{guests.adults}</span>
                <button 
                  className="counter-btn"
                  onClick={() => updateGuests('adults', true)}
                >+</button>
              </div>
            </div>

            <div className="guest-row">
              <div className="guest-info">
                <div className="guest-label">Children</div>
                <div className="guest-sublabel">Ages 2–12</div>
              </div>
              <div className="guest-counter">
                <button 
                  className="counter-btn"
                  onClick={() => updateGuests('children', false)}
                  disabled={guests.children === 0}
                >-</button>
                <span className="counter-value">{guests.children}</span>
                <button 
                  className="counter-btn"
                  onClick={() => updateGuests('children', true)}
                >+</button>
              </div>
            </div>

            <div className="guest-row">
              <div className="guest-info">
                <div className="guest-label">Infants</div>
                <div className="guest-sublabel">Under 2</div>
              </div>
              <div className="guest-counter">
                <button 
                  className="counter-btn"
                  onClick={() => updateGuests('infants', false)}
                  disabled={guests.infants === 0}
                >-</button>
                <span className="counter-value">{guests.infants}</span>
                <button 
                  className="counter-btn"
                  onClick={() => updateGuests('infants', true)}
                >+</button>
              </div>
            </div>

            <div className="guest-row">
              <div className="guest-info">
                <div className="guest-label">Pets</div>
                <div className="guest-sublabel">
                  <a href="#" style={{textDecoration: 'underline'}}>Bringing a service animal?</a>
                </div>
              </div>
              <div className="guest-counter">
                <button 
                  className="counter-btn"
                  onClick={() => updateGuests('pets', false)}
                  disabled={guests.pets === 0}
                >-</button>
                <span className="counter-value">{guests.pets}</span>
                <button 
                  className="counter-btn"
                  onClick={() => updateGuests('pets', true)}
                >+</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBarHome;

