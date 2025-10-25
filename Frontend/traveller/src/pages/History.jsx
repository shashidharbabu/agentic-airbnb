import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mockProperties } from '../data/mockProperties';

const History = () => {
  const navigate = useNavigate();
  const { traveler, isAuthenticated } = useAuth();
  
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadHistory();
  }, [isAuthenticated, navigate]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const storedBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
      
      const enrichedBookings = storedBookings.map(booking => {
        const property = mockProperties.find(p => p.id === booking.property_id);
        return {
          ...booking,
          property_name: property?.name || 'Unknown Property',
          property_location: property?.location || 'Unknown Location',
          property_image: property?.image || '',
          property_type: property?.type || 'Apartment',
          bedrooms: property?.bedrooms || 2,
          bathrooms: property?.bathrooms || 1,
          max_guests: property?.max_guests || 4,
          rating: property?.rating || 4.5,
          amenities: property?.amenities || []
        };
      });

      enrichedBookings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setHistory(enrichedBookings);
    } catch (err) {
      setError('Failed to load travel history');
      console.error('Error loading history:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACCEPTED': return '#10B981'; // green
      case 'PENDING': return '#F59E0B'; // yellow
      case 'CANCELLED': return '#EF4444'; // red
      default: return '#6B7280'; // gray
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ACCEPTED': return '✅';
      case 'PENDING': return '⏳';
      case 'CANCELLED': return '❌';
      default: return '❓';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateNights = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const filteredHistory = history.filter(booking => {
    if (activeTab === 'all') return true;
    return booking.status === activeTab;
  });

  const tabs = [
    { id: 'all', label: 'All Trips', count: history.length },
    { id: 'ACCEPTED', label: 'Completed', count: history.filter(b => b.status === 'ACCEPTED').length },
    { id: 'PENDING', label: 'Upcoming', count: history.filter(b => b.status === 'PENDING').length },
    { id: 'CANCELLED', label: 'Cancelled', count: history.filter(b => b.status === 'CANCELLED').length }
  ];

  if (loading) {
    return (
      <div className="history-page">
        <div className="container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your travel history...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="history-page">
        <div className="container">
          <div className="error-state">
            <h2>Oops! Something went wrong</h2>
            <p>{error}</p>
            <button onClick={loadHistory} className="retry-btn">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="history-page">
      <div className="container">
        <div className="history-header">
          <h1>Your Travel History</h1>
          <p>All your past and upcoming trips in one place</p>
        </div>

        <div className="history-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {tab.count > 0 && <span className="tab-count">{tab.count}</span>}
            </button>
          ))}
        </div>

        <div className="history-content">
          {filteredHistory.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🧳</div>
              <h3>No trips found</h3>
              <p>
                {activeTab === 'all' 
                  ? "You haven't made any bookings yet. Start exploring properties!"
                  : `No ${activeTab.toLowerCase()} trips found.`
                }
              </p>
              {activeTab === 'all' && (
                <button 
                  className="explore-btn"
                  onClick={() => navigate('/dashboard')}
                >
                  Explore Properties
                </button>
              )}
            </div>
          ) : (
            <div className="history-list">
              {filteredHistory.map((booking) => (
                <div key={booking.id} className="history-card">
                  <div className="property-image">
                    <img src={booking.property_image} alt={booking.property_name} />
                    <div className="status-badge" style={{ backgroundColor: getStatusColor(booking.status) }}>
                      {getStatusIcon(booking.status)} {booking.status}
                    </div>
                  </div>

                  <div className="booking-details">
                    <div className="property-info">
                      <h3 className="property-name">{booking.property_name}</h3>
                      <p className="property-location">{booking.property_location}</p>
                      <div className="property-meta">
                        <span className="property-type">{booking.property_type}</span>
                        <span className="guests">{booking.guests} guest{booking.guests !== 1 ? 's' : ''}</span>
                        <span className="rating">
                          ⭐ {booking.rating}
                        </span>
                      </div>
                    </div>

                    <div className="booking-info">
                      <div className="dates">
                        <div className="date-item">
                          <span className="date-label">Check-in</span>
                          <span className="date-value">{formatDate(booking.start_date)}</span>
                        </div>
                        <div className="date-item">
                          <span className="date-label">Check-out</span>
                          <span className="date-value">{formatDate(booking.end_date)}</span>
                        </div>
                        <div className="date-item">
                          <span className="date-label">Duration</span>
                          <span className="date-value">
                            {calculateNights(booking.start_date, booking.end_date)} night{calculateNights(booking.start_date, booking.end_date) !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      <div className="pricing">
                        <div className="price-breakdown">
                          <div className="price-item">
                            <span>${booking.price_per_night} × {calculateNights(booking.start_date, booking.end_date)} nights</span>
                            <span>${(booking.price_per_night * calculateNights(booking.start_date, booking.end_date)).toFixed(2)}</span>
                          </div>
                          <div className="price-item total">
                            <span>Total</span>
                            <span>${booking.total_price?.toFixed(2) || (booking.price_per_night * calculateNights(booking.start_date, booking.end_date)).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="booking-actions">
                      <button 
                        className="view-details-btn"
                        onClick={() => navigate(`/property/${booking.property_id}`)}
                      >
                        View Property
                      </button>
                      {booking.status === 'PENDING' && (
                        <button 
                          className="cancel-btn"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to cancel this booking?')) {
                              const updatedBookings = history.map(b => 
                                b.id === booking.id ? { ...b, status: 'CANCELLED' } : b
                              );
                              localStorage.setItem('bookings', JSON.stringify(updatedBookings));
                              loadHistory();
                            }
                          }}
                        >
                          Cancel Booking
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .history-page {
          min-height: 100vh;
          background: #f8f9fa;
          padding: 20px 0;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .history-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .history-header h1 {
          font-size: 2.5rem;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 10px;
        }

        .history-header p {
          font-size: 1.1rem;
          color: #666;
        }

        .history-tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 30px;
          border-bottom: 1px solid #e0e0e0;
        }

        .tab {
          background: none;
          border: none;
          padding: 12px 20px;
          font-size: 1rem;
          font-weight: 500;
          color: #666;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .tab:hover {
          color: #333;
        }

        .tab.active {
          color: #FF385C;
          border-bottom-color: #FF385C;
        }

        .tab-count {
          background: #FF385C;
          color: white;
          font-size: 0.8rem;
          padding: 2px 6px;
          border-radius: 10px;
          min-width: 20px;
          text-align: center;
        }

        .loading-state, .error-state {
          text-align: center;
          padding: 60px 20px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #FF385C;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .retry-btn, .explore-btn {
          background: #FF385C;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .retry-btn:hover, .explore-btn:hover {
          background: #E31C5F;
        }

        .empty-state {
          text-align: center;
          padding: 80px 20px;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 20px;
        }

        .empty-state h3 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #333;
          margin-bottom: 10px;
        }

        .empty-state p {
          color: #666;
          margin-bottom: 30px;
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .history-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          overflow: hidden;
          display: flex;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .history-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        }

        .property-image {
          position: relative;
          width: 300px;
          height: 200px;
          flex-shrink: 0;
        }

        .property-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .status-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          color: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .booking-details {
          flex: 1;
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .property-info h3 {
          font-size: 1.3rem;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 8px;
        }

        .property-location {
          color: #666;
          margin-bottom: 12px;
        }

        .property-meta {
          display: flex;
          gap: 16px;
          font-size: 0.9rem;
          color: #666;
        }

        .property-meta span {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .booking-info {
          margin: 20px 0;
        }

        .dates {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 20px;
        }

        .date-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .date-label {
          font-size: 0.8rem;
          color: #666;
          text-transform: uppercase;
          font-weight: 500;
        }

        .date-value {
          font-size: 1rem;
          font-weight: 600;
          color: #1a1a1a;
        }

        .pricing {
          background: #f8f9fa;
          padding: 16px;
          border-radius: 8px;
        }

        .price-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .price-item.total {
          font-weight: 600;
          font-size: 1.1rem;
          color: #1a1a1a;
          border-top: 1px solid #e0e0e0;
          padding-top: 8px;
          margin-top: 8px;
        }

        .booking-actions {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }

        .view-details-btn, .cancel-btn {
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .view-details-btn {
          background: #FF385C;
          color: white;
        }

        .view-details-btn:hover {
          background: #E31C5F;
        }

        .cancel-btn {
          background: #f8f9fa;
          color: #666;
          border: 1px solid #e0e0e0;
        }

        .cancel-btn:hover {
          background: #e9ecef;
          color: #333;
        }

        @media (max-width: 768px) {
          .history-card {
            flex-direction: column;
          }

          .property-image {
            width: 100%;
            height: 200px;
          }

          .dates {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .booking-actions {
            flex-direction: column;
          }

          .container {
            padding: 0 15px;
          }

          .history-header h1 {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
};

export default History;
