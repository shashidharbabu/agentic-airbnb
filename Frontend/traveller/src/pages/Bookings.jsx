import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mockProperties } from '../data/mockProperties';

const Bookings = () => {
  const navigate = useNavigate();
  const { traveler, isAuthenticated } = useAuth();
  
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadBookings();
  }, [isAuthenticated, navigate]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      
      try {
        const response = await bookingsAPI.getTravelerBookings(traveler.id);
        setBookings(response.data.bookings);
        return;
      } catch (dbError) {
        console.log('Database not available, using localStorage fallback:', dbError.message);
      }
      

      const storedBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
      
      const enrichedBookings = storedBookings.map(booking => {
        const property = mockProperties.find(p => p.id === booking.property_id);
        return {
          ...booking,
          property_name: property?.name || 'Unknown Property',
          property_location: property?.location || 'Unknown Location',
          property_image: property?.image || '',
          property_price: property?.price || 0,
          owner_name: 'John Doe' 
        };
      });
      
      setBookings(enrichedBookings);
    } catch (err) {
      setError('Failed to load bookings');
      console.error('Error loading bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      setCancelling(bookingId);
      
      try {
        await bookingsAPI.cancel(bookingId);
        await loadBookings(); 
        return;
      } catch (dbError) {
        console.log('Database not available, using localStorage fallback:', dbError.message);
      }
      
      const storedBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
      const updatedBookings = storedBookings.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: 'CANCELLED' }
          : booking
      );
      localStorage.setItem('bookings', JSON.stringify(updatedBookings));
      
      await loadBookings(); 
    } catch (err) {
      console.error('Error cancelling booking:', err);
      alert('Failed to cancel booking. Please try again.');
    } finally {
      setCancelling(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'ACCEPTED':
        return 'success';
      case 'CANCELLED':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING':
        return 'Pending Host Approval';
      case 'ACCEPTED':
        return 'Confirmed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (activeTab === 'all') return true;
    return booking.status === activeTab.toUpperCase();
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="bookings-page">
        <div className="container">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading your bookings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bookings-page">
      <div className="container">
        <div className="bookings-header">
          <h1 className="bookings-title">Your Bookings</h1>
          <p className="bookings-subtitle">Manage your travel reservations</p>
        </div>

        {error && (
          <div className="alert alert-danger">
            {error}
            <button 
              className="btn btn-outline btn-sm"
              onClick={loadBookings}
              style={{ marginLeft: '10px' }}
            >
              Try Again
            </button>
          </div>
        )}

        <div className="bookings-tabs">
          <button
            className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All ({bookings.length})
          </button>
          <button
            className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending ({bookings.filter(b => b.status === 'PENDING').length})
          </button>
          <button
            className={`tab-button ${activeTab === 'accepted' ? 'active' : ''}`}
            onClick={() => setActiveTab('accepted')}
          >
            Confirmed ({bookings.filter(b => b.status === 'ACCEPTED').length})
          </button>
          <button
            className={`tab-button ${activeTab === 'cancelled' ? 'active' : ''}`}
            onClick={() => setActiveTab('cancelled')}
          >
            Cancelled ({bookings.filter(b => b.status === 'CANCELLED').length})
          </button>
        </div>

        {filteredBookings.length > 0 ? (
          <div className="bookings-list">
            {filteredBookings.map(booking => (
              <div key={booking.id} className="booking-card">
                <div className="booking-image">
                  {booking.property_photo ? (
                    <img 
                      src={booking.property_photo} 
                      alt={booking.property_name}
                      onClick={() => navigate(`/property/${booking.property_id}`)}
                    />
                  ) : (
                    <div className="image-placeholder">
                      <span className="placeholder-icon">🏠</span>
                    </div>
                  )}
                </div>

                <div className="booking-details">
                  <div className="booking-header">
                    <h3 className="property-name" onClick={() => navigate(`/property/${booking.property_id}`)}>
                      {booking.property_name}
                    </h3>
                    <span className={`status-badge status-${getStatusColor(booking.status)}`}>
                      {getStatusText(booking.status)}
                    </span>
                  </div>

                  <div className="booking-info">
                    <div className="info-item">
                      <span className="info-label">Location:</span>
                      <span className="info-value">{booking.property_location}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Check-in:</span>
                      <span className="info-value">{formatDate(booking.start_date)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Check-out:</span>
                      <span className="info-value">{formatDate(booking.end_date)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Guests:</span>
                      <span className="info-value">{booking.guests} guest{booking.guests > 1 ? 's' : ''}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Host:</span>
                      <span className="info-value">{booking.owner_name}</span>
                    </div>
                  </div>

                  {booking.special_requests && (
                    <div className="special-requests">
                      <span className="requests-label">Special requests:</span>
                      <p className="requests-text">{booking.special_requests}</p>
                    </div>
                  )}

                  <div className="booking-footer">
                    <div className="booking-price">
                      <span className="price-label">Total:</span>
                      <span className="price-value">
                        {booking.total_price ? formatPrice(booking.total_price) : 'TBD'}
                      </span>
                    </div>

                    <div className="booking-actions">
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => navigate(`/property/${booking.property_id}`)}
                      >
                        View Property
                      </button>
                      
                      {(booking.status === 'PENDING' || booking.status === 'ACCEPTED') && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleCancelBooking(booking.id)}
                          disabled={cancelling === booking.id}
                        >
                          {cancelling === booking.id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h3>No bookings found</h3>
            <p>
              {activeTab === 'all' 
                ? "You haven't made any bookings yet. Start exploring properties!"
                : `No ${activeTab} bookings found.`
              }
            </p>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/dashboard')}
            >
              Browse Properties
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .bookings-page {
          min-height: 100vh;
          background: #f8f9fa;
          padding: 40px 0;
        }

        .bookings-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .bookings-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: #333;
          margin-bottom: 10px;
        }

        .bookings-subtitle {
          color: #666;
          font-size: 1.1rem;
        }

        .bookings-tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 30px;
          border-bottom: 1px solid #eee;
          padding-bottom: 0;
        }

        .tab-button {
          padding: 12px 24px;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          cursor: pointer;
          font-weight: 500;
          color: #666;
          transition: all 0.2s;
        }

        .tab-button:hover {
          color: #333;
        }

        .tab-button.active {
          color: #FF385C;
          border-bottom-color: #FF385C;
        }

        .bookings-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .booking-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          display: flex;
          transition: transform 0.2s ease;
        }

        .booking-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }

        .booking-image {
          width: 200px;
          height: 150px;
          flex-shrink: 0;
          overflow: hidden;
          cursor: pointer;
        }

        .booking-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.2s ease;
        }

        .booking-image:hover img {
          transform: scale(1.05);
        }

        .image-placeholder {
          width: 100%;
          height: 100%;
          background: #f0f0f0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .placeholder-icon {
          font-size: 2rem;
          color: #ccc;
        }

        .booking-details {
          flex: 1;
          padding: 20px;
          display: flex;
          flex-direction: column;
        }

        .booking-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 15px;
        }

        .property-name {
          font-size: 1.3rem;
          font-weight: 600;
          color: #333;
          margin: 0;
          cursor: pointer;
          transition: color 0.2s;
        }

        .property-name:hover {
          color: #FF385C;
        }

        .status-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-warning {
          background: #fff3cd;
          color: #856404;
        }

        .status-success {
          background: #d4edda;
          color: #155724;
        }

        .status-danger {
          background: #f8d7da;
          color: #721c24;
        }

        .booking-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 10px;
          margin-bottom: 15px;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .info-label {
          font-size: 12px;
          font-weight: 600;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-value {
          font-size: 14px;
          color: #333;
        }

        .special-requests {
          margin-bottom: 15px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .requests-label {
          font-size: 12px;
          font-weight: 600;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: block;
          margin-bottom: 5px;
        }

        .requests-text {
          font-size: 14px;
          color: #333;
          margin: 0;
          font-style: italic;
        }

        .booking-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
          padding-top: 15px;
          border-top: 1px solid #eee;
        }

        .booking-price {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .price-label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .price-value {
          font-size: 1.2rem;
          font-weight: 700;
          color: #333;
        }

        .booking-actions {
          display: flex;
          gap: 10px;
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

        .loading-container {
          text-align: center;
          padding: 60px 20px;
        }

        .loading-container .spinner {
          margin: 0 auto 20px;
        }

        @media (max-width: 768px) {
          .booking-card {
            flex-direction: column;
          }

          .booking-image {
            width: 100%;
            height: 200px;
          }

          .booking-info {
            grid-template-columns: 1fr;
          }

          .booking-footer {
            flex-direction: column;
            gap: 15px;
            align-items: stretch;
          }

          .booking-actions {
            justify-content: center;
          }

          .bookings-tabs {
            flex-wrap: wrap;
            gap: 5px;
          }

          .tab-button {
            padding: 8px 16px;
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
};

export default Bookings;
