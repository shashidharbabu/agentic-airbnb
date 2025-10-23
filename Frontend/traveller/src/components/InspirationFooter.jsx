import React, { useState } from 'react';
import { popularDestinations, inspirationCategories } from '../data/mockProperties';

const InspirationFooter = () => {
  const [activeTab, setActiveTab] = useState('Popular');
  const [showMore, setShowMore] = useState(false);

  const displayedDestinations = showMore 
    ? popularDestinations 
    : popularDestinations.slice(0, 12);

  return (
    <div className="inspiration-footer">
      <div className="inspiration-container">
        <h2 className="inspiration-title">Inspiration for future getaways</h2>

        <div className="inspiration-tabs">
          {inspirationCategories.map((category) => (
            <button
              key={category}
              className={`inspiration-tab ${activeTab === category ? 'active' : ''}`}
              onClick={() => setActiveTab(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="inspiration-content">
          <div className="destinations-grid">
            {displayedDestinations.map((destination, index) => (
              <div key={index} className="destination-link">
                <div className="destination-city">{destination.city}</div>
                <div className="destination-type">{destination.type}</div>
              </div>
            ))}
          </div>

          {popularDestinations.length > 12 && (
            <button 
              className="show-more-btn"
              onClick={() => setShowMore(!showMore)}
            >
              {showMore ? 'Show less' : 'Show more'} 
              <svg 
                viewBox="0 0 32 32" 
                xmlns="http://www.w3.org/2000/svg" 
                style={{
                  height: '16px', 
                  width: '16px', 
                  fill: 'currentColor',
                  marginLeft: '8px',
                  transform: showMore ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s'
                }}
              >
                <path d="m4 12 11.3 11.3a1 1 0 0 0 1.4 0L28 12"></path>
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="site-footer">
        <div className="footer-container">
          <div className="footer-columns">
            <div className="footer-column">
              <h3>Support</h3>
              <ul>
                <li><a href="#">Help Center</a></li>
                <li><a href="#">Get help with a safety issue</a></li>
                <li><a href="#">AirCover</a></li>
                <li><a href="#">Anti-discrimination</a></li>
                <li><a href="#">Disability support</a></li>
                <li><a href="#">Cancellation options</a></li>
                <li><a href="#">Report neighborhood concern</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h3>Hosting</h3>
              <ul>
                <li><a href="#">Airbnb your home</a></li>
                <li><a href="#">Airbnb your experience</a></li>
                <li><a href="#">Airbnb your service</a></li>
                <li><a href="#">AirCover for Hosts</a></li>
                <li><a href="#">Hosting resources</a></li>
                <li><a href="#">Community forum</a></li>
                <li><a href="#">Hosting responsibly</a></li>
                <li><a href="#">Airbnb-friendly apartments</a></li>
                <li><a href="#">Join a free Hosting class</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h3>Airbnb</h3>
              <ul>
                <li><a href="#">2025 Summer Release</a></li>
                <li><a href="#">Newsroom</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Investors</a></li>
                <li><a href="#">Gift cards</a></li>
                <li><a href="#">Airbnb.org emergency stays</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <div className="footer-legal">
              <span>© 2025 Airbnb, Inc.</span>
              <a href="#">Terms</a>
              <a href="#">Sitemap</a>
              <a href="#">Privacy</a>
              <a href="#">Your Privacy Choices</a>
            </div>
            <div className="footer-settings">
              <button className="footer-btn">
                <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" style={{height: '16px', width: '16px', fill: 'currentColor'}}>
                  <path d="M8 .25a7.77 7.77 0 0 1 7.75 7.75A7.77 7.77 0 0 1 8 15.75 7.77 7.77 0 0 1 .25 8 7.77 7.77 0 0 1 8 .25zm0 13.5A5.75 5.75 0 1 0 2.25 8 5.76 5.76 0 0 0 8 13.75zM8 1.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zm-.938 9.375v-1.25h.626v-3.75H7.062v-1.25h2.5v5h.626v1.25h-3.126z"></path>
                </svg>
                English (US)
              </button>
              <button className="footer-btn">$ USD</button>
              <button className="footer-btn">
                <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" style={{height: '16px', width: '16px', fill: 'currentColor'}}>
                  <path d="M8 .25a7.77 7.77 0 0 1 7.75 7.75A7.77 7.77 0 0 1 8 15.75 7.77 7.77 0 0 1 .25 8 7.77 7.77 0 0 1 8 .25zm1 1.46V4.5h2.583l.167.004c.114.008.224.027.328.058a.8.8 0 0 1 .457.457c.03.104.05.214.058.328l.004.167V8.5h-2.75l-.003-.167a1.77 1.77 0 0 0-.058-.328.8.8 0 0 0-.457-.457 1.77 1.77 0 0 0-.328-.058L9 7.487V5.25H7v2.237l-.003.167a1.77 1.77 0 0 1-.058.328.8.8 0 0 1-.457.457 1.77 1.77 0 0 1-.328.058L6 8.5H3.25V5.514l.004-.167c.008-.114.027-.224.058-.328a.8.8 0 0 1 .457-.457 1.77 1.77 0 0 1 .328-.058L4.25 4.5H7V1.71a6.5 6.5 0 0 0-3.562 1.29H5.25v2.75H1.72A6.5 6.5 0 0 0 1.5 8v.014a6.5 6.5 0 0 0 .22 1.736H5.25v2.75H3.438a6.5 6.5 0 0 0 5.312 2H9V11h2.583l.167-.004c.114-.008.224-.027.328-.058a.8.8 0 0 0 .457-.457c.03-.104.05-.214.058-.328L12.5 10.014V7h2.78A6.5 6.5 0 0 0 14.5 8a6.5 6.5 0 0 0-3.562-6.29H9z"></path>
                </svg>
                Support & resources
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InspirationFooter;

